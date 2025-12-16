import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatRequest {
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = 'AIzaSyDi2p3jE9bGQhSfmz7eWHD0vxcLztOn4gw';

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const { message }: ChatRequest = await req.json();

    if (!message || message.trim().length === 0) {
      throw new Error('Message is required');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    if (profile.credits <= 0) {
      return new Response(
        JSON.stringify({ error: 'No credits left. Please purchase more credits to continue.' }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const topicRegex = /python|machine learning|ml|pandas|numpy|sklearn|scikit-learn|tensorflow|pytorch|keras|data science|neural network|deep learning|nlp|natural language processing|computer vision|regression|classification|clustering|algorithm/i;
    
    if (!topicRegex.test(message)) {
      return new Response(
        JSON.stringify({ 
          error: 'This bot only answers Python & Machine Learning questions. Please ask about Python programming, ML algorithms, data science, or related topics.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a Python and Machine Learning coding assistant. Only answer questions related to Python programming, Machine Learning, Data Science, and related technologies. User question: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to generate response');
    }

    const geminiData = await geminiResponse.json();
    const botResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
    }

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        message,
        response: botResponse,
        credits_used: 1,
      });

    if (insertError) {
      console.error('Error saving message:', insertError);
    }

    return new Response(
      JSON.stringify({
        response: botResponse,
        remaining_credits: profile.credits - 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});