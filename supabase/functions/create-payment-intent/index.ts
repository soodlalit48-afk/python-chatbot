import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  credits: number;
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.log('STRIPE_SECRET_KEY not configured, using mock mode');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const { credits }: PaymentRequest = await req.json();

    if (!credits || credits <= 0 || !Number.isInteger(credits)) {
      throw new Error('Invalid credit amount');
    }

    const amount = credits * 100;
    const metadata = {
      user_id: user.id,
      email: user.email,
      credits: credits.toString(),
    };

    let clientSecret: string;
    let paymentIntentId: string;

    if (stripeSecretKey) {
      const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amount.toString(),
          currency: 'usd',
          metadata: JSON.stringify(metadata),
          description: `${credits} AI Chat Credits`,
        }).toString(),
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.json();
        console.error('Stripe error:', error);
        throw new Error('Failed to create payment intent');
      }

      const stripeData = await stripeResponse.json();
      clientSecret = stripeData.client_secret;
      paymentIntentId = stripeData.id;
    } else {
      clientSecret = `pi_test_${Date.now()}_${user.id}`;
      paymentIntentId = `pi_test_${Date.now()}`;
    }

    return new Response(
      JSON.stringify({
        client_secret: clientSecret,
        payment_intent_id: paymentIntentId,
        amount,
        credits,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});