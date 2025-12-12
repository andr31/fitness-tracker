import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { playerName, amount, totalPushups, milestone, allPlayers, isNegative } = await request.json();

    // Find player's rank
    const sortedPlayers = [...allPlayers].sort((a, b) => b.totalPushups - a.totalPushups);
    const playerRank = sortedPlayers.findIndex((p) => p.name === playerName) + 1;
    const isLeader = playerRank === 1;
    const distanceToMilestone = milestone - totalPushups;
    
    // Get context about competition
    const leader = sortedPlayers[0];
    const distanceToLeader = isLeader ? 0 : leader.totalPushups - totalPushups;

    const prompt = isNegative 
      ? `You're a sarcastic standup comedian coaching ${playerName} who just REMOVED ${Math.abs(amount)} pushups (Total now: ${totalPushups}). 
      
Roast them gently with dark humor but keep it supportive. Think Jerry Seinfeld meets gym fails. MAX 15 words. Make it hilariously awkward.`
      : `You're a hilarious standup comedian coaching ${playerName} who just did ${amount} pushups.
      
Context:
- Total: ${totalPushups} pushups
- Rank: #${playerRank} of ${allPlayers.length}
- Distance to milestone (${milestone}): ${distanceToMilestone > 0 ? distanceToMilestone : 'CRUSHED IT!'}
- ${isLeader ? 'Leading the pack!' : `Chasing ${leader.name} (${distanceToLeader} behind)`}

Be HILARIOUS like Dave Chappelle or Ali Wong - use witty observations, exaggeration, absurd comparisons, sarcasm. Think "${amount} pushups? That's like..." or roast their position. MAX 15 words. Use emojis sparingly (0-1).`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
      temperature: 0.9,
    });

    return NextResponse.json({ message: text.trim() });
  } catch (error) {
    console.error('AI Coach error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError = errorMessage.includes('Quota exceeded') || errorMessage.includes('quota');
    
    return NextResponse.json(
      { 
        error: 'Failed to generate motivation',
        details: errorMessage,
        isQuotaError 
      },
      { status: 500 }
    );
  }
}
