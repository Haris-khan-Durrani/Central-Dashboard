import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword, getExpectedAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body || {};

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    const token = await getExpectedAdminToken();
    const isProd = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days session
    });

    return response;
  } catch (error: any) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}
