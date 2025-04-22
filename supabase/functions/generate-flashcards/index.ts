
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content } = await req.json()
    
    // Check for API key in multiple possible environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) {
      throw new Error('API key not found. Please configure GEMINI_API_KEY or GOOGLE_API_KEY in Supabase Edge Function Secrets.')
    }

    console.log('Sending request to Google Gemini API')
    
    // Make the prompt much more explicit about the output format
    const prompt = `Create 3 to 5 flashcards from this content. 
    RETURN A VALID JSON ARRAY OF OBJECTS ONLY, NO MARKDOWN FORMATTING.
    Each flashcard should have a 'front' field with a question and a 'back' field with the answer.
    
    IMPORTANT: Format your response as a PLAIN JSON array with NO explanation, NO markdown, NO backticks. 
    Example of valid format: [{"front":"Question 1?","back":"Answer 1"},{"front":"Question 2?","back":"Answer 2"}]
    
    Content to convert: ${content}`
    
    const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2, // Lower temperature for more predictable formatting
          maxOutputTokens: 1000,
        }
      })
    })
    
    if (!googleResponse.ok) {
      const errorResponse = await googleResponse.text()
      console.error('Google API returned an error:', googleResponse.status, errorResponse)
      throw new Error(`Google API error: ${googleResponse.status} - ${errorResponse}`)
    }

    const data = await googleResponse.json()
    console.log('Google API response received')
    
    // Extract the text from the Google AI response
    const flashcardsText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!flashcardsText) {
      console.error('No text found in Google AI response', data)
      throw new Error('Empty response from AI service')
    }

    console.log('Raw response text:', flashcardsText.substring(0, 100) + '...')

    // Enhanced parsing strategy with multiple fallbacks
    let flashcards
    try {
      // Remove any potential non-JSON content
      let jsonContent = flashcardsText.trim()
      
      // First approach: try parsing the raw response
      try {
        flashcards = JSON.parse(jsonContent)
        console.log('Successfully parsed raw response')
      } catch (firstError) {
        console.log('Failed initial parse, trying to extract JSON...')
        
        // Second approach: extract JSON from markdown blocks if present
        const jsonBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonBlockMatch && jsonBlockMatch[1]) {
          try {
            flashcards = JSON.parse(jsonBlockMatch[1].trim())
            console.log('Successfully parsed from markdown code block')
          } catch (e) {
            console.error('Failed to parse content from code block:', e)
          }
        }
        
        // Third approach: find array pattern in text
        if (!flashcards) {
          const arrayMatch = jsonContent.match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (arrayMatch) {
            try {
              flashcards = JSON.parse(arrayMatch[0])
              console.log('Successfully extracted and parsed array using regex')
            } catch (e) {
              console.error('Failed to parse array match:', e)
            }
          }
        }
        
        // Fourth approach: try reconstructing a valid array through regex
        if (!flashcards) {
          console.log('Attempting to reconstruct JSON from fragments...')
          // Extract individual card objects with regex
          const cardMatches = jsonContent.match(/{[^{}]*"front"\s*:[^{}]*"back"\s*:[^{}]*}/g)
          if (cardMatches && cardMatches.length > 0) {
            try {
              // Reconstruct array from individual card objects
              const reconstructedJSON = '[' + cardMatches.join(',') + ']'
              flashcards = JSON.parse(reconstructedJSON)
              console.log('Successfully reconstructed JSON from fragments')
            } catch (e) {
              console.error('Failed to parse reconstructed JSON:', e)
            }
          }
        }
      }
      
      // If we still don't have valid flashcards, we've exhausted our options
      if (!flashcards) {
        throw new Error('Unable to extract valid JSON from the response')
      }
      
      // Validate the flashcards structure
      if (!Array.isArray(flashcards)) {
        console.error('Parsed result is not an array:', flashcards)
        throw new Error('Invalid flashcards format: not an array')
      }
      
      if (flashcards.length === 0) {
        throw new Error('No flashcards were generated')
      }
      
      // Make sure each flashcard has front and back properties
      flashcards = flashcards.filter(card => 
        card && typeof card === 'object' && 'front' in card && 'back' in card
      )
      
      if (flashcards.length === 0) {
        throw new Error('No valid flashcards found in the response')
      }
      
      console.log(`Successfully parsed ${flashcards.length} valid flashcards`)
      
    } catch (error) {
      console.error('Failed to parse Google AI response:', flashcardsText)
      console.error('Parse error:', error.message)
      throw new Error('Failed to parse flashcards from AI response')
    }

    console.log(`Successfully generated ${flashcards.length} flashcards`)
    
    return new Response(JSON.stringify({ flashcards }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-flashcards function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
