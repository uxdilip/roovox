import { NextRequest, NextResponse } from 'next/server';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { createUserDocument, getUserByUserId } from '@/lib/appwrite-services';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name } = await request.json();

    switch (action) {
      case 'register':
        // Create user account
        const user = await account.create(ID.unique(), email, password, name);
        // Remove: await createUserDocument({ ... })
        // User upsert is handled in AuthContext
        return NextResponse.json({ success: true, user });

      case 'login':
        const session = await account.createEmailPasswordSession(email, password);
        return NextResponse.json({ success: true, session });

      case 'logout':
        await account.deleteSession('current');
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await account.get();
    
    // Fetch user profile from new User collection
    const userProfile = await getUserByUserId(user.$id);

    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}