# Validation Testing Guide

This document outlines all the validations implemented in the application and how to test them.

## Authentication Validations

### Sign Up Form

#### Email Validation
**Rule:** Must be a valid email format

**Test Cases:**
- ✅ Valid: `user@example.com`
- ✅ Valid: `test.user+tag@domain.co.uk`
- ❌ Invalid: `notanemail`
- ❌ Invalid: `missing@domain`
- ❌ Invalid: `@example.com`

**Expected Behavior:**
- Shows error: "Please enter a valid email address"

#### Password Validation
**Rule:** Minimum 6 characters

**Test Cases:**
- ✅ Valid: `password123`
- ✅ Valid: `abc123`
- ❌ Invalid: `12345` (only 5 chars)
- ❌ Invalid: `abc` (only 3 chars)

**Expected Behavior:**
- Shows error: "Password must be at least 6 characters long"
- Helper text always visible: "Must be at least 6 characters"

#### Confirm Password Validation
**Rule:** Must match password field

**Test Cases:**
- ✅ Valid: Password: `password123`, Confirm: `password123`
- ❌ Invalid: Password: `password123`, Confirm: `password456`

**Expected Behavior:**
- Shows error: "Passwords do not match"

#### Duplicate Account
**Rule:** Email must not already exist

**Test Cases:**
- Try signing up with an email that already exists

**Expected Behavior:**
- Shows error from Supabase (e.g., "User already registered")

### Login Form

#### Invalid Credentials
**Rule:** Email and password must match existing account

**Test Cases:**
- Wrong email
- Wrong password
- Nonexistent account

**Expected Behavior:**
- Shows error: "Invalid email or password"

## Chat Interface Validations

### Message Input

#### Empty Message
**Rule:** Message cannot be empty or only whitespace

**Test Cases:**
- ❌ Empty string: ``
- ❌ Only spaces: `   `
- ❌ Only newlines: `\n\n`
- ✅ Valid: `How do I use pandas?`

**Expected Behavior:**
- Send button disabled when input is empty
- Trimmed before sending (spaces removed)

#### Credit Check
**Rule:** User must have available credits

**Test Cases:**
1. Use all 20 credits
2. Try to send message with 0 credits

**Expected Behavior:**
- Shows error: "You have no credits left. Please purchase more credits to continue chatting."
- Opens credits modal
- Send button disabled when credits = 0

#### Topic Validation
**Rule:** Message must be about Python/ML topics

**Valid Topics:**
- ✅ `How do I use pandas?`
- ✅ `Explain neural networks`
- ✅ `What is machine learning?`
- ✅ `Python list comprehension examples`
- ✅ `TensorFlow vs PyTorch`
- ✅ `scikit-learn classification`
- ✅ `Deep learning algorithms`
- ✅ `Data science best practices`

**Invalid Topics:**
- ❌ `What's the weather today?`
- ❌ `How to cook pasta?`
- ❌ `Best JavaScript frameworks`
- ❌ `Latest news`
- ❌ `Help me with CSS`

**Expected Behavior:**
- Shows error: "This bot only answers Python & Machine Learning questions. Please ask about Python programming, ML algorithms, data science, or related topics."
- Message not saved to history
- Credits not deducted

## Backend Validations

### Edge Function: Chat

#### Authentication
**Rule:** Must have valid JWT token

**Test Cases:**
- No Authorization header
- Invalid token
- Expired token

**Expected Behavior:**
- Returns 401 error
- Error message: "Invalid token" or "No authorization header"

#### Request Body
**Rule:** Must include valid message field

**Test Cases:**
- ❌ Missing message field: `{}`
- ❌ Empty message: `{ "message": "" }`
- ❌ Null message: `{ "message": null }`
- ✅ Valid: `{ "message": "How do I use NumPy?" }`

**Expected Behavior:**
- Returns 400 error
- Error message: "Message is required"

## Testing Checklist

### Sign Up Flow
- [ ] Enter invalid email → See error
- [ ] Enter password < 6 chars → See error
- [ ] Passwords don't match → See error
- [ ] Valid signup → Success message → Auto-switch to login
- [ ] Try to signup with same email → See error

### Login Flow
- [ ] Enter wrong email → See error
- [ ] Enter wrong password → See error
- [ ] Valid login → Redirect to chat

### Chat Flow
- [ ] View welcome screen with examples
- [ ] Click example question → Fills input
- [ ] Send valid Python question → Get response
- [ ] Send valid ML question → Get response
- [ ] Check credits decrease by 1
- [ ] Send invalid topic → See error
- [ ] Try empty message → Button disabled
- [ ] Use all credits → See error and modal
- [ ] Click credits button → See modal

### UI/UX Testing
- [ ] All animations play smoothly
- [ ] Loading states show correctly
- [ ] Error messages shake
- [ ] Messages fade in
- [ ] Modal scales in
- [ ] Buttons have hover effects
- [ ] Form inputs have focus states
- [ ] Responsive on mobile

### Security Testing
- [ ] Cannot access chat without login
- [ ] Cannot see other users' messages
- [ ] Cannot modify other users' credits
- [ ] Invalid tokens rejected
- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized

## Common Errors and Solutions

### "Profile not found"
**Cause:** User signed up but profile wasn't created
**Solution:** Check database trigger is working

### "Failed to generate response"
**Cause:** Gemini API key not configured or invalid
**Solution:** Set GEMINI_API_KEY in Supabase dashboard

### "No authorization header"
**Cause:** Session expired or not properly authenticated
**Solution:** Logout and login again

### CORS errors
**Cause:** Edge function CORS headers misconfigured
**Solution:** Verify CORS headers in edge function include all required headers

## Automated Testing

For automated tests, you can use the following patterns:

### Unit Tests (Frontend)
```typescript
// Email validation
expect(validateEmail('user@example.com')).toBe(true);
expect(validateEmail('invalid')).toBe(false);

// Password validation
expect(validatePassword('password123')).toBe(true);
expect(validatePassword('12345')).toBe(false);
```

### Integration Tests (API)
```typescript
// Test chat endpoint
const response = await fetch('/functions/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${validToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'How to use pandas?' }),
});

expect(response.status).toBe(200);
const data = await response.json();
expect(data).toHaveProperty('response');
expect(data).toHaveProperty('remaining_credits');
```

### E2E Tests (Playwright/Cypress)
```typescript
// Test signup flow
await page.goto('/');
await page.fill('[id="email"]', 'test@example.com');
await page.fill('[id="password"]', 'password123');
await page.fill('[id="confirmPassword"]', 'password123');
await page.click('button[type="submit"]');
await expect(page.locator('text=Account created successfully')).toBeVisible();
```

## Performance Testing

### Load Testing
- Test with multiple concurrent users
- Verify edge function scales properly
- Check database connection pooling

### Stress Testing
- Rapidly send multiple messages
- Verify credit deduction accuracy
- Check for race conditions

### Edge Cases
- Very long messages (>1000 chars)
- Special characters in messages
- Unicode/emoji in messages
- Multiple spaces/newlines
