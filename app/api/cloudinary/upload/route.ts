import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Legacy server-proxy upload endpoint (Deprecated).
 *
 * All image uploads have been transitioned to direct browser-to-Cloudinary upload
 * using signed authorizations via /api/cloudinary/sign.
 * This route is disabled and returns HTTP 410 Gone.
 */
export async function POST() {
  return NextResponse.json(
    { message: 'Legacy upload route is deprecated. Use direct upload via /api/cloudinary/sign.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { message: 'Legacy upload route is deprecated. Use direct upload via /api/cloudinary/sign.' },
    { status: 410 }
  );
}
