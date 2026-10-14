import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api/config';

/**
 * GET /api/auth/check-phone?phone=...
 * BFF endpoint to check if a phone number is available for registration.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim() || '';

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Indian mobile phone number.' },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const res = await fetch(`${apiBaseUrl}/auth/check-phone?phone=${encodeURIComponent(phone)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Failed to verify phone number.' },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Could not connect to authentication service.' },
      { status: 502 }
    );
  }
}
