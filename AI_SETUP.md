# AI Features Setup Guide

## 🤖 What's New

Your fitness tracker now has TWO AI-powered features:

### 1. **AI Coach** 🏋️
- Generates personalized motivational messages when players add pushups
- Context-aware based on:
  - Current ranking
  - Distance to milestone
  - Distance to leader
  - Amount added
- Shows up briefly (5 seconds) in the player card

### 2. **AI Commentator** 🎙️
- Sports-style live commentary on the competition
- Updates every 30 seconds automatically
- Appears in a ticker banner below the header
- Highlights:
  - Close competitions
  - Milestone achievements
  - Dramatic leads and comebacks

## 🔑 Setup Instructions

### Step 1: Get an OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (it starts with `sk-`)

### Step 2: Add API Key to Your Project

Open `.env.local` and replace the placeholder:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 💰 Cost Information

Both features use **GPT-4o-mini** which is very affordable:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Each AI call uses ~50-100 tokens
- **Estimated cost: <$0.01 per 100 interactions**

## 🎯 How It Works

### AI Coach
- Triggers automatically when you add pushups (non-backdated)
- Message appears below the player name
- Contextual based on your performance and standing

### AI Commentator
- Refreshes every 30 seconds
- Appears in banner below header
- Provides real-time race updates

## 🔧 Customization

### Change Update Frequency

In `src/app/page.tsx`:
```typescript
// Change from 30 seconds to 1 minute:
const commentaryInterval = setInterval(() => {
  generateCommentary();
}, 60 * 1000); // 60 seconds instead of 30
```

### Adjust Message Length

In `src/app/api/ai/coach/route.ts` or `commentator/route.ts`:
```typescript
maxTokens: 50, // Increase for longer messages (e.g., 100)
temperature: 0.9, // Increase (0-2) for more creative messages
```

### Change AI Model

```typescript
model: openai('gpt-4o-mini'), // Change to 'gpt-4o' for smarter responses (more $$$)
```

## 🐛 Troubleshooting

### AI messages not showing?
1. Check console for errors
2. Verify OPENAI_API_KEY is set correctly in `.env.local`
3. Restart dev server after adding key

### Commentary not updating?
- Check browser console
- Make sure you have at least 2 players
- Commentary generates every 30 seconds

### "Failed to generate" errors?
- Verify API key is valid
- Check OpenAI account has credits
- Check network connection

## 🎨 Next Steps

Want to enhance it further?
- Add player personality profiles for personalized messages
- Create different commentary styles (funny, serious, sarcastic)
- Add AI-generated challenges or predictions
- Voice narration of commentary (text-to-speech)

Enjoy your AI-powered fitness tracker! 🚀
