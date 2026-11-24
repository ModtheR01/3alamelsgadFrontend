import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);

const { aiImageService } = jiti('../lib/api/services/aiImageService.ts');
const { apiClient } = jiti('../lib/api/client.ts');
const { safelyPrepareImageForUpload, DEFAULT_COMPRESSION_THRESHOLD, DEFAULT_MAX_DIMENSION } = jiti('../lib/imageOptimization.ts');

test('1. processRugImageUrl sends JSON body with image_url and receives binary blob', async () => {
  const originalPostJsonRaw = apiClient.postJsonRaw;
  let capturedEndpoint = '';
  let capturedBody = null;

  try {
    apiClient.postJsonRaw = async (endpoint, body) => {
      capturedEndpoint = endpoint;
      capturedBody = body;
      const fakeBinaryPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      return new Response(fakeBinaryPng, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    };

    const cloudinaryUrl = 'https://res.cloudinary.com/alamelsgad/image/upload/v123456/alamelsgad-products/carpet_sample.jpg';
    const result = await aiImageService.processRugImageUrl(cloudinaryUrl);

    assert.equal(capturedEndpoint, '/products/process-rug/', 'Must call /products/process-rug/');
    assert.deepEqual(capturedBody, { image_url: cloudinaryUrl }, 'Must send { image_url } JSON payload');

    // Verify payload size is ultra lightweight (< 200 bytes) - avoids Vercel 4.5MB FUNCTION_PAYLOAD_TOO_LARGE
    const payloadSize = Buffer.byteLength(JSON.stringify(capturedBody));
    assert.ok(payloadSize < 500, `Payload size (${payloadSize} bytes) must be well under Vercel 4.5MB limit`);

    assert.ok(result.blob instanceof Blob, 'Result must be a Blob');
    assert.equal(result.contentType, 'image/png', 'MIME type must match');
    assert.equal(result.blob.size, 8, 'Blob must contain exact binary image data');
  } finally {
    apiClient.postJsonRaw = originalPostJsonRaw;
  }
});

test('2. processRugImage accepts URL string and delegates to processRugImageUrl', async () => {
  const originalPostJsonRaw = apiClient.postJsonRaw;
  let capturedBody = null;

  try {
    apiClient.postJsonRaw = async (endpoint, body) => {
      capturedBody = body;
      const fakeBinaryPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      return new Response(fakeBinaryPng, {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    };

    const imageUrl = 'https://res.cloudinary.com/alamelsgad/image/upload/sample.jpg';
    const result = await aiImageService.processRugImage(imageUrl);

    assert.deepEqual(capturedBody, { image_url: imageUrl }, 'Must pass image_url payload');
    assert.equal(result.blob.size, 8);
  } finally {
    apiClient.postJsonRaw = originalPostJsonRaw;
  }
});

test('3. Image optimization utility preserves safe images and exports defaults', async () => {
  assert.equal(DEFAULT_COMPRESSION_THRESHOLD, 8 * 1024 * 1024, 'Threshold should be 8MB');
  assert.equal(DEFAULT_MAX_DIMENSION, 2560, 'Max dimension should be 2560px');

  // In Node environment, safelyPrepareImageForUpload returns the file safely
  const dummyFile = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
  const resultFile = await safelyPrepareImageForUpload(dummyFile);
  assert.equal(resultFile.name, 'test.jpg');
});

test('4. AiProductImageView uploads original image to Cloudinary and sends URL to avoid FUNCTION_PAYLOAD_TOO_LARGE', () => {
  const componentPath = path.resolve(process.cwd(), 'components/admin/AiProductImageView.tsx');
  const code = fs.readFileSync(componentPath, 'utf8');

  // Must import image optimization
  assert.match(code, /safelyPrepareImageForUpload/);

  // Must upload original image to Cloudinary before AI enhancement
  assert.match(code, /uploadDirectToCloudinary\(fileToUpload,\s*\{\s*folder:\s*'alamelsgad-products'/);

  // Must cache original Cloudinary URL
  assert.match(code, /setOriginalCloudinaryUrl/);

  // Must send URL to aiImageService.processRugImage
  assert.match(code, /aiImageService\.processRugImage\(targetImageUrl\)/);

  // Must have multi-stage loading feedback (uploading, enhancing, optimizing)
  assert.match(code, /processingStage/);
});
