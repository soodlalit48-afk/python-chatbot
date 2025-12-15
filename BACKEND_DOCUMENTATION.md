# Backend Documentation

## Overview
This application uses **Supabase** as the backend infrastructure, providing authentication, database, and serverless functions.

## Architecture

### Database Schema

#### `profiles` Table
- `id` (uuid) - Primary key, references auth.users
- `email` (text) - User email
- `credits` (integer) - Available credits (default: 20)
- `created_at` (timestamp) - Account creation time
- `updated_at` (timestamp) - Last update time

**Security:** Row Level Security (RLS) enabled. Users can only view and update their own profile.

#### `chat_messages` Table
- `id` (uuid) - Primary key
- `user_id` (uuid) - References profiles table
- `message` (text) - User's question
- `response` (text) - Bot's response
- `credits_used` (integer) - Credits consumed (default: 1)
- `created_at` (timestamp) - Message timestamp

**Security:** Row Level Security (RLS) enabled. Users can only view and insert their own messages.

### Authentication

Uses Supabase Auth with email/password authentication:
- **Sign Up:** Creates a new user account with 20 free credits
- **Login:** JWT-based authentication
- **Auto Profile Creation:** Trigger automatically creates profile when user signs up

### Edge Function: `chat`

**Endpoint:** `{SUPABASE_URL}/functions/v1/chat`

**Method:** POST

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "message": "How do I use pandas?"
}
```

**Response (Success):**
```json
{
  "response": "AI generated response...",
  "remaining_credits": 19
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid topic (not Python/ML related)
- `402` - No credits remaining
- `401` - Authentication error
- `500` - Server error

#### Topic Validation

The chatbot only accepts questions about:
- Python programming
- Machine Learning (ML)
- Data Science
- Pandas, NumPy, Scikit-learn
- TensorFlow, PyTorch, Keras
- Neural Networks, Deep Learning
- NLP (Natural Language Processing)
- Computer Vision
- Regression, Classification, Clustering
- ML Algorithms

Any message not matching these topics will be rejected with a 400 error.

#### Processing Flow

1. **Authentication:** Verify JWT token
2. **Validation:** Check if message is non-empty
3. **Credits Check:** Verify user has available credits
4. **Topic Check:** Ensure question is about Python/ML
5. **AI Generation:** Call Gemini API to generate response
6. **Update Credits:** Deduct 1 credit from user's account
7. **Save Message:** Store question and response in database
8. **Return Response:** Send AI response and remaining credits

### Credits System

- New users receive **20 free credits**
- Each chat message costs **1 credit**
- Credits are deducted after successful AI response
- Users cannot chat when credits reach 0

### Environment Variables

The following environment variables are automatically configured:

**Frontend (.env):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Backend (Edge Function):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-configured)
- `GEMINI_API_KEY` - Google Gemini API key for AI responses

## API Integration

### Authentication Flow

```typescript
// Sign Up
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Login
const { error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign Out
await supabase.auth.signOut();
```

### Chat Request

```typescript
const { data: session } = await supabase.auth.getSession();

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.session?.access_token}`,
    },
    body: JSON.stringify({ message: 'How do I use pandas?' }),
  }
);

const data = await response.json();
console.log(data.response, data.remaining_credits);
```

### Fetch Profile

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle();

console.log(profile.credits);
```

### Fetch Chat History

```typescript
const { data: messages } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: true })
  .limit(50);
```

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

**Profiles:**
- Users can only view their own profile
- Users can only update their own profile
- Users can only insert their own profile

**Chat Messages:**
- Users can only view their own messages
- Users can only insert their own messages

### Input Validation

**Frontend Validation:**
- Email format validation using regex
- Password minimum length (6 characters)
- Password confirmation matching
- Empty message prevention

**Backend Validation:**
- JWT token verification
- Message content validation
- Topic restriction enforcement
- Credits verification before processing

### Error Handling

Comprehensive error handling at all levels:
- Network errors
- Authentication errors
- Validation errors
- API errors
- Database errors

All errors are caught and displayed to users with clear messages.

## Performance Optimizations

- **Lazy Loading:** Chat history loaded on demand
- **Optimistic Updates:** Messages appear immediately with temp ID
- **Session Caching:** Auth state cached to reduce API calls
- **Query Limits:** Chat history limited to 50 messages
- **Indexed Queries:** Database indexed on frequently queried columns

## Scalability

The architecture is designed to scale:
- **Serverless Functions:** Auto-scaling edge functions
- **Database:** Supabase handles connection pooling
- **CDN:** Static assets served via CDN
- **Real-time:** Ready for real-time subscriptions if needed

## Future Enhancements

Potential improvements:
- **Stripe Integration:** Payment processing for credit purchases
- **Rate Limiting:** Prevent abuse
- **Message History:** Pagination for older messages
- **Export Chat:** Download conversation history
- **Code Syntax Highlighting:** Better code display in responses
- **Conversation Threading:** Group related messages
- **Favorites:** Save important responses
