
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
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that creates flashcards from note content. 
              Extract key concepts and create question-answer pairs.
              Format your response as a JSON array of objects with 'front' and 'back' properties.
              'front' should be a question or key concept, and 'back' should be the corresponding answer or explanation.
              Keep each flashcard focused on a single concept.`
          },
          {
            role: 'user',
            content: `Create flashcards from this content: ${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    const data = await openAIResponse.json()
    const flashcardsText = data.choices[0].message.content

    // Parse the response into JSON
    let flashcards
    try {
      flashcards = JSON.parse(flashcardsText)
    } catch (error) {
      console.error('Failed to parse OpenAI response:', flashcardsText)
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
