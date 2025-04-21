
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
    
    const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GOOGLE_API_KEY')
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

    const data = await googleResponse.json()
    
    // Extract the text from the Google AI response
    const flashcardsText = data.candidates?.[0]?.content?.parts?.[0]?.text

    // Parse the response into JSON
    let flashcards
    try {
      flashcards = JSON.parse(flashcardsText)
    } catch (error) {
      console.error('Failed to parse Google AI response:', flashcardsText)
      throw new Error('Failed to parse flashcards from AI response')
    }

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
