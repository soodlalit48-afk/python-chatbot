# Complete Setup Guide

Follow these steps to get your Python & ML Chatbot fully operational with Gemini API and Stripe payments.

## Step 1: Configure Gemini API Key

### 1.1 Get Your Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated API key

**Your API Key:** `AIzaSyDi2p3jE9bGQhSfmz7eWHD0vxcLztOn4gw`

### 1.2 Add API Key to Supabase

1. Open your Supabase project: https://app.supabase.com
2. Click **Settings** in the left sidebar
3. Click **Edge Functions**
4. Click **Add Environment Variable**
5. Fill in:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyDi2p3jE9bGQhSfmz7eWHD0vxcLztOn4gw`
6. Click **Save**

✅ The chat function will now use your Gemini API key automatically!

## Step 2: Optional - Configure Stripe for Real Payments

### 2.1 Create Stripe Account (Optional)

For testing/demo mode, payment is simulated. To enable real payments:

1. Visit: https://dashboard.stripe.com/register
2. Create an account
3. Complete verification
4. Get your API keys from: https://dashboard.stripe.com/apikeys

### 2.2 Add Stripe Keys to Supabase

1. Open your Supabase project
2. Click **Settings** → **Edge Functions**
3. Add two environment variables:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** `sk_test_...` (your Stripe secret key)
   - **Name:** `VITE_STRIPE_PUBLIC_KEY`
   - **Value:** `pk_test_...` (your Stripe public key)

### 2.3 Add Stripe Public Key to Frontend

Update your `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key
```

**Note:** Without Stripe keys, the app uses demo mode and automatically approves purchases.

## Step 3: Verify Setup

### 3.1 Test Authentication

1. Open the app
2. Sign up with a test email
3. Verify you get 20 free credits
4. Check Supabase → profiles table to see your user

### 3.2 Test Chat

1. Ask a Python question: "How do I use pandas?"
2. Verify you get an AI response
3. Check credits decreased to 19
4. Check Supabase → chat_messages to see your message

### 3.3 Test Payments

1. Use all 20 credits
2. Try to send another message
3. Click "Buy Credits" button
4. Select a package (e.g., "50 credits for $20")
5. Click "Buy 50 Credits"
6. In demo mode: See success message after 2 seconds
7. Verify credits were added (should show ~69 credits)

## Features Overview

### Animations

The app includes 8 types of smooth animations:

- **fade-in:** Messages and modals
- **scale-in:** Modal entrance
- **shake:** Error states
- **slide-up:** Welcome screen
- **slide-in-right:** User messages
- **slide-in-left:** Bot messages
- **bounce-in:** Buttons and icons
- **pulse-glow:** Credits button
- **float:** Floating motion for bot icon
- **spin-slow:** Rotating coins icon
- **gradient-shift:** Animated gradient background

### Credit System

- New users: 20 free credits
- Each question: 1 credit
- Purchase packages:
  - 10 credits: $5 ($0.50/credit)
  - 50 credits: $20 ($0.40/credit) ⭐ Most popular
  - 100 credits: $35 ($0.35/credit)
  - 500 credits: $150 ($0.30/credit)

### Topic Validation

Only answers questions about:
- Python programming
- Machine Learning (ML)
- Data Science
- Neural Networks, Deep Learning
- NLP, Computer Vision
- Pandas, NumPy, Scikit-learn
- TensorFlow, PyTorch, Keras
- ML Algorithms

## Troubleshooting

### "Failed to generate response"

**Cause:** Gemini API key not configured

**Fix:**
1. Go to Supabase Settings → Edge Functions
2. Verify GEMINI_API_KEY environment variable is set
3. Verify the API key is correct

### "Payment failed"

**Cause:** Missing Stripe keys or network error

**Fix:**
- In demo mode: Payments are simulated and will succeed
- For real payments: Add STRIPE_SECRET_KEY to Supabase environment

### "Message not saving"

**Cause:** Database RLS policy issue

**Fix:**
1. Check Supabase → SQL Editor
2. Verify chat_messages table exists
3. Verify RLS policies are enabled
4. Check user ID matches in chat_messages

### "Can't login"

**Cause:** Authentication issue

**Fix:**
1. Clear browser cookies
2. Check Supabase Auth is enabled
3. Verify email/password are correct (min 6 characters)

## File Structure

```
src/
├── components/
│   ├── AuthForm.tsx              ← Login/Signup
│   ├── ChatInterface.tsx         ← Main chat UI
│   └── PaymentModal.tsx          ← Payment UI
├── contexts/
│   └── AuthContext.tsx           ← Auth state management
├── lib/
│   └── supabase.ts               ← Supabase client
├── App.tsx                        ← App router
├── main.tsx                       ← Entry point
└── index.css                      ← Animations

supabase/
├── migrations/
│   └── create_chatbot_schema.sql  ← Database schema
└── functions/
    ├── chat/                      ← Chat AI function
    └── create-payment-intent/     ← Payment function
```

## API Endpoints

### Chat Endpoint

```
POST /functions/v1/chat

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
  { "message": "Your question" }

Response:
  {
    "response": "AI response text",
    "remaining_credits": 19
  }
```

### Payment Endpoint

```
POST /functions/v1/create-payment-intent

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
  { "credits": 50 }

Response:
  {
    "client_secret": "pi_...",
    "payment_intent_id": "pi_...",
    "amount": 2000,
    "credits": 50
  }
```

## Production Checklist

- [ ] Set GEMINI_API_KEY in Supabase
- [ ] (Optional) Set STRIPE_SECRET_KEY for real payments
- [ ] Test signup and login
- [ ] Test chat with Python question
- [ ] Test credit deduction
- [ ] Test payment modal
- [ ] Test error messages
- [ ] Test all animations
- [ ] Deploy to production
- [ ] Monitor Supabase logs for errors

## Security Notes

- Never commit `.env` with real API keys
- Always use HTTPS in production
- Row Level Security (RLS) protects all data
- Users can only see their own messages and credits
- Payment intents are tied to user accounts
- All sensitive operations require authentication

## Next Steps

1. **Test everything locally:**
   ```bash
   npm run dev
   ```

2. **Fix any issues** using the troubleshooting guide

3. **Deploy to production:**
   ```bash
   npm run build
   ```

4. **Monitor performance** using Supabase logs and analytics

## Support

For detailed documentation, see:
- `README.md` - Overview and features
- `BACKEND_DOCUMENTATION.md` - API details
- `VALIDATION_TESTING.md` - Testing guide
