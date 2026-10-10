import { NextResponse } from 'next/server';
import {
  buildSignature,
  sanitizeFolder,
  verifyAdminAuthorization,
  isAllowedCloudinaryFolder,
  ALLOWED_CLOUDINARY_FOLDERS,
} from '@/lib/api/cloudinaryServer';

export const runtime = 'nodejs';

/**
 * Generates a signed upload authorization for direct client-to-Cloudinary upload.
 * Enforces admin authentication, restricts folders to the whitelist, and protects CLOUDINARY_API_SECRET server-side.
 */
export async function POST(request: Request) {
  // 1. Authorize caller
  const authResult = await verifyAdminAuthorization(request);
  if (!authResult.authorized) {
    return NextResponse.json(
      { message: authResult.message || 'Unauthorized.' },
      { status: authResult.status || 401 }
    );
  }

  // 2. Validate server credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const defaultFolder = process.env.CLOUDINARY_FOLDER || 'alamelsgad-products';

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { message: 'Server-side Cloudinary credentials are not configured.' },
      { status: 500 }
    );
  }

  // 3. Extract, sanitize, and validate folder
  let requestedFolder: unknown;
  try {
    const body = (await request.json()) as { folder?: unknown };
    requestedFolder = body?.folder;
  } catch {
    // Body is optional
  }
  const folder = sanitizeFolder(requestedFolder, defaultFolder);

  if (!isAllowedCloudinaryFolder(folder)) {
    return NextResponse.json(
      {
        message: `Invalid or unauthorized upload folder: '${folder}'. Allowed folders are: ${ALLOWED_CLOUDINARY_FOLDERS.join(', ')}.`,
      },
      { status: 400 }
    );
  }

  // 4. Generate signature
  const timestamp = String(Math.floor(Date.now() / 1000));
  const uploadParams: Record<string, string> = {
    folder,
    timestamp,
  };

  const signature = buildSignature(uploadParams, apiSecret);

  // 5. Return safe authorization parameters (never exposing apiSecret)
  return NextResponse.json({
    cloud_name: cloudName,
    api_key: apiKey,
    timestamp,
    folder,
    signature,
  });
}
