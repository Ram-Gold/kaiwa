import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase/admin';

const VALID_TIERS = ['FREE', 'DONATOR', 'PRO', 'DEVELOPER'];

export async function POST(req) {
  try {
    const { userId, tier } = await req.json();

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 });
    }

    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 });
    }

    // 1. Set Firebase Auth Custom Claim
    await adminAuth.setCustomUserClaims(userId, { userType: tier });

    // 2. Mirror tier to the user's Firestore document
    await adminDb.collection('users').doc(userId).set(
      { tier: tier, updatedAt: new Date() },
      { merge: true }
    );

    return NextResponse.json({ success: true, tier });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
