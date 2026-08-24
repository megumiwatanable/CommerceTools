import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct-client';

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const email = body.get('email');
  const password = body.get('password');
  const firstName = body.get('firstName');
  const lastName = body.get('lastName');

  const accountUrl = new URL('/account', request.url);
  if (!email || !password || !firstName || !lastName) {
    return NextResponse.redirect(accountUrl);
  }

  try {
    await apiRoot.customers().post({
      body: {
        email: email.toString(),
        password: password.toString(),
        firstName: firstName.toString(),
        lastName: lastName.toString(),
      }
    }).execute();

    return NextResponse.redirect(accountUrl);
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.redirect(accountUrl);
  }
}
