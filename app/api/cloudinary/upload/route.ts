import crypto from 'node:crypto';

export const runtime = 'nodejs';
const PRODUCT_IMAGE_TRANSFORMATION = 'c_pad,w_1200,h_1200,b_white';

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${signatureBase}${apiSecret}`).digest('hex');
}

export async function POST(request: Request) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const defaultFolder = process.env.CLOUDINARY_FOLDER || 'tocco/products';

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ message: 'Cloudinary is not configured.' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const requestedFolder = formData.get('folder');
  const folder = typeof requestedFolder === 'string' && requestedFolder.trim()
    ? requestedFolder.trim()
    : defaultFolder;
  const preserveAspectRatio = formData.get('preserve_aspect_ratio') === 'true';

  if (!(file instanceof File)) {
    return Response.json({ message: 'Missing image file.' }, { status: 400 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const uploadParams: Record<string, string> = preserveAspectRatio
    ? { folder, timestamp }
    : { folder, timestamp, transformation: PRODUCT_IMAGE_TRANSFORMATION };
  const signature = buildSignature(uploadParams, apiSecret);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file, file.name);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', timestamp);
  cloudinaryForm.append('folder', folder);
  if (!preserveAspectRatio) {
    cloudinaryForm.append('transformation', PRODUCT_IMAGE_TRANSFORMATION);
  }
  cloudinaryForm.append('signature', signature);

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: cloudinaryForm,
    }
  );

  if (!cloudinaryResponse.ok) {
    const errorText = await cloudinaryResponse.text();
    let cloudinaryMessage = 'Cloudinary upload failed.';
    try {
      const errorPayload = JSON.parse(errorText) as { error?: { message?: string } };
      cloudinaryMessage = errorPayload.error?.message || cloudinaryMessage;
    } catch {
      // Keep the generic message when Cloudinary does not return JSON.
    }

    return Response.json(
      {
        message: cloudinaryMessage,
        details: errorText,
      },
      { status: cloudinaryResponse.status === 403 ? 403 : 502 }
    );
  }

  const payload = await cloudinaryResponse.json();

  return Response.json({
    url: payload.secure_url || payload.url,
    public_id: payload.public_id,
    width: payload.width,
    height: payload.height,
  });
}
