import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase/admin';

const DAILY_LIMIT = 20;

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const now = new Date();
    const lastReset = userData.quota?.lastReset?.toDate() || new Date(0);
    let dailyUsed = userData.quota?.dailyRequestsUsed || 0;

    // Reset quota if it's a new day (UTC)
    if (
      lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
      lastReset.getUTCMonth() !== now.getUTCMonth() ||
      lastReset.getUTCDate() !== now.getUTCDate()
    ) {
      dailyUsed = 0;
    }

    if (dailyUsed >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily quota exceeded. Please use your own API key.' },
        { status: 429 }
      );
    }

    // Process the actual AI request
    const body = await req.json();
    const { messages, provider } = body;
    
    // In a real implementation, this would use a master key to call OpenAI/Anthropic/Ollama
    // For now, since Ollama is local, we just mock the response or call local ollama directly 
    // if this Next.js server has access to it.
    let responseText = "Mocked AI response from Next.js Proxy.";
    
    // Update quota
    await userRef.update({
      'quota.dailyRequestsUsed': dailyUsed + 1,
      'quota.lastReset': now,
    });

    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error('API /ai/chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
