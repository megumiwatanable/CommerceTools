// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiRoot, executeRequest } from '@/lib/ct-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const email = body.get('email');
    const password = body.get('password');

    if (!email || !password) {
      const errorUrl = new URL('/account', request.url);
      return NextResponse.redirect(errorUrl);
    }

    const response = await executeRequest({
      method: 'POST',
      uri: apiRoot
        .login
        .build(),
      body: {
        email: email.toString(),
        password: password.toString(),
      }
    });

    const customerId = response.body?.customer?.id;

    if (!customerId) {
      const errorUrl = new URL('/account', request.url);
      return NextResponse.redirect(errorUrl);
    }

    const redirectUrl = new URL('/account', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set('commerce_customer_id', customerId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return redirectResponse;

  } catch (error) {
    console.error('Login error:', error);
    const errorUrl = new URL('/account', request.url);
    return NextResponse.redirect(errorUrl);
  }
}