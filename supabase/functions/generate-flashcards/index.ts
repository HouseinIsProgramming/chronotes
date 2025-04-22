
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
    
    // Use the correct model name: gemini-2.0-flash
    const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Create 5 detailed flashcards from this content. Each flashcard should have a clear question (front) and a comprehensive answer (back). 
            Format your response as a strict JSON array of objects with 'front' and 'back' properties.
            Example: [{"front": "What is the main concept?", "back": "Detailed explanation of the concept."}]
            
            Content to convert: ${content}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
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

    console.log('Raw response text:', flashcardsText.substring(0, 200) + '...')

    // Parse the response into JSON - with improved error handling for markdown formatting
    let flashcards
    try {
      // First, try to extract JSON from markdown code blocks if present
      let jsonContent = flashcardsText
      
      // If the response contains markdown code blocks with ```json
      const jsonBlockMatch = flashcardsText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonContent = jsonBlockMatch[1].trim()
        console.log('Extracted JSON content from markdown code block')
      }
      
      // Look for array syntax as a fallback
      if (!jsonContent.startsWith('[')) {
        const arrayMatch = flashcardsText.match(/\[\s*{[\s\S]*}\s*\]/)
        if (arrayMatch) {
          jsonContent = arrayMatch[0]
          console.log('Extracted JSON array using regex')
        }
      }
      
      flashcards = JSON.parse(jsonContent)
      
      // Validate the flashcards structure
      if (!Array.isArray(flashcards)) {
        console.error('Parsed result is not an array:', flashcards)
        throw new Error('Invalid flashcards format: not an array')
      }
      
      if (!flashcards.every(card => card && typeof card === 'object' && 'front' in card && 'back' in card)) {
        console.error('Some flashcards are missing front or back properties:', flashcards)
        throw new Error('Invalid flashcards format: missing front/back properties')
      }
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
