import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'Google AI API key not configured' },
      { status: 500 }
    );
  }
  
  try {
    const { players, milestone } = await request.json();

    // Sort players by total
    const sortedPlayers = [...players].sort((a, b) => b.totalPushups - a.totalPushups);
    const leader = sortedPlayers[0];
    const second = sortedPlayers[1];
    const champions = sortedPlayers.filter((p) => p.totalPushups >= milestone);

    // Build race context
    const raceContext = `
Current Standings:
${sortedPlayers.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.name}: ${p.totalPushups} pushups${p.totalPushups >= milestone ? ' 👑' : ''}`
).join('\n')}

Milestone: ${milestone}
Champions: ${champions.length > 0 ? champions.map(c => c.name).join(', ') : 'None yet'}
${second ? `Gap: ${leader.name} leads ${second.name} by ${leader.totalPushups - second.totalPushups}` : ''}
`;

    const prompt = `You're a HILARIOUS standup comedian doing live sports commentary on a pushup competition. Think John Mulaney meets sports announcer.

${raceContext}

Generate ONE SHORT (max 20 words) FUNNY commentary line. 

IMPORTANT: Don't just focus on the leaders! Mix it up - talk about:
- Random middle-of-the-pack players ("${sortedPlayers[Math.floor(sortedPlayers.length / 2)]?.name} is just vibing in the middle")
- The person in last place ("${sortedPlayers[sortedPlayers.length - 1]?.name} bringing up the rear like my motivation on Monday")
- Close battles ANYWHERE in the standings (not just #1 and #2)
- Someone who's close to a round number
- The gap between ANY two players, not just the top

Use:
- Absurd comparisons ("leading by more points than my credit score")
- Witty roasts ("moving slower than my wifi")
- Sarcastic observations about ANYONE in the competition
- Exaggerated drama with comedy about ANY player
- Self-deprecating humor references

Randomly pick someone interesting to talk about. Be FUNNY first, exciting second. Emojis sparingly (0-2 max).`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
      temperature: 1.0,
    });

    return NextResponse.json({ commentary: text.trim() });
  } catch (error: any) {
    console.error('AI Commentator error:', error);
    return NextResponse.json(
      { error: 'Failed to generate commentary', details: error.message || error.toString() },
      { status: 500 }
    );
  }
}
