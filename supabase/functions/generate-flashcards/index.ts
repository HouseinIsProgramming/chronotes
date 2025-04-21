
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
    
    // Use the correct model name: gemini-2.0-flash instead of gemini-flash-lite
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

    // Parse the response into JSON
    let flashcards
    try {
      // Look for JSON array in the response by finding text between [ and ]
      const jsonMatch = flashcardsText.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : flashcardsText
      
      flashcards = JSON.parse(jsonString)
      
      // Validate the flashcards structure
      if (!Array.isArray(flashcards) || !flashcards.every(card => card.front && card.back)) {
        throw new Error('Invalid flashcards format')
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
