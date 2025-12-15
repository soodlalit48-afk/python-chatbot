# Python & ML Chatbot

A beautiful, production-ready chatbot application specializing in Python and Machine Learning topics. Built with React, TypeScript, Supabase, and Google Gemini AI.

## Features

### Core Functionality
- **Topic-Restricted Chat:** Only answers Python and Machine Learning questions
- **Smart AI Responses:** Powered by Google Gemini 1.5 Flash
- **Credits System:** Usage-based credits (20 free credits for new users)
- **Real-time Updates:** Instant credit updates and message delivery
- **Chat History:** Persistent conversation storage
- **Secure Authentication:** Email/password authentication via Supabase

### User Experience
- **Beautiful UI:** Modern, gradient-based design with smooth animations
- **Responsive Design:** Works perfectly on desktop and mobile
- **Form Validations:** Real-time validation with helpful error messages
- **Loading States:** Clear feedback during operations
- **Error Handling:** User-friendly error messages

### Security
- **Row Level Security:** Database-level access control
- **JWT Authentication:** Secure token-based auth
- **Input Validation:** Both frontend and backend validation
- **Environment Variables:** Sensitive data never exposed

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS with custom animations
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** Google Gemini 1.5 Flash
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**

   Your `.env` file should contain:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Configure Gemini API Key:**

   You need to set the `GEMINI_API_KEY` environment variable in your Supabase project:

   - Go to your Supabase project dashboard
   - Navigate to Settings → Edge Functions
   - Add environment variable: `GEMINI_API_KEY=your_gemini_api_key`
   - Get your key from: https://makersuite.google.com/app/apikey

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Database Schema

### Profiles Table
Stores user information and credits.

### Chat Messages Table
Stores conversation history.

See `BACKEND_DOCUMENTATION.md` for detailed schema and API documentation.

## Usage

### Sign Up
1. Click "Sign Up" tab
2. Enter email and password (min 6 characters)
3. Receive 20 free credits automatically

### Chat
1. Type your Python/ML question
2. Click send or press Enter
3. Receive AI-generated response
4. Each message costs 1 credit

### Accepted Topics
- Python programming
- Machine Learning
- Data Science
- Pandas, NumPy, Scikit-learn
- TensorFlow, PyTorch, Keras
- Neural Networks, Deep Learning
- NLP, Computer Vision
- ML Algorithms

## Validation Rules

### Authentication
- Email must be valid format
- Password minimum 6 characters
- Passwords must match during signup

### Chat
- Message cannot be empty
- Must have available credits
- Topic must be Python/ML related

## Project Structure

```
src/
├── components/
│   ├── AuthForm.tsx          # Login/Signup forms
│   └── ChatInterface.tsx     # Main chat UI
├── contexts/
│   └── AuthContext.tsx       # Authentication state
├── lib/
│   └── supabase.ts           # Supabase client config
├── App.tsx                    # Main app component
├── main.tsx                   # App entry point
└── index.css                  # Global styles & animations

supabase/
└── functions/
    └── chat/
        └── index.ts           # Chat edge function
```

## API Endpoints

### POST `/functions/v1/chat`
Send a message to the AI chatbot.

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "message": "Your question here"
}
```

**Response:**
```json
{
  "response": "AI response",
  "remaining_credits": 19
}
```

## Animations

The app includes smooth animations:
- **fade-in:** Messages and modals
- **scale-in:** Modal entrance
- **shake:** Error states
- **hover:** Interactive elements
- **spinner:** Loading states

## Error Handling

All errors are caught and displayed clearly:
- Invalid credentials
- Network failures
- Insufficient credits
- Invalid topics
- API errors

## Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## Development

### Run TypeScript type checking:
```bash
npm run typecheck
```

### Run linting:
```bash
npm run lint
```

## Contributing

When contributing, please:
1. Follow the existing code style
2. Add proper TypeScript types
3. Include error handling
4. Test authentication flows
5. Verify validations work

## Support

For issues or questions:
1. Check `BACKEND_DOCUMENTATION.md`
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables

## License

MIT
