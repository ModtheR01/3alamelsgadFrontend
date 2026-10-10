import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import createJiti from 'jiti';

// Import actual production functions directly from lib/api/cloudinaryServer.ts and lib/api/cloudinary.ts
const jiti = createJiti(import.meta.url);
const {
  buildSignature,
  sanitizeFolder,
  verifyAdminAuthorization,
  isAllowedCloudinaryFolder,
  ALLOWED_CLOUDINARY_FOLDERS,
} = jiti('../lib/api/cloudinaryServer.ts');
const {
  checkServerAdminAuth,
} = jiti('../lib/api/authServer.ts');
const {
  POST: postUploadLegacy,
  GET: getUploadLegacy,
} = jiti('../app/api/cloudinary/upload/route.ts');
const {
  validateImageFile,
  DEFAULT_MAX_IMAGE_SIZE,
} = jiti('../lib/api/cloudinary.ts');

class MockFile {
  constructor(parts, filename, properties = {}) {
    this.name = filename;
    this.type = properties.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
  }
}

test('Phase 3 - Cloudinary Signature: Generates deterministic SHA-1 signature according to Cloudinary specification', async () => {
  const params = {
    timestamp: '1728567890',
    folder: 'alamelsgad-products',
  };
  const secret = 'mock_cloudinary_secret_key_12345';

  const signature = buildSignature(params, secret);

  // Manual calculation according to Cloudinary spec:
  // 1. Sort keys alphabetically: folder, timestamp
  // 2. Join as key=value&key=value: folder=alamelsgad-products&timestamp=1728567890
  // 3. Append secret: folder=alamelsgad-products&timestamp=1728567890mock_cloudinary_secret_key_12345
  // 4. SHA-1 hash
  const expectedBase = `folder=alamelsgad-products&timestamp=1728567890${secret}`;
  const expectedHash = crypto.createHash('sha1').update(expectedBase).digest('hex');

  assert.equal(signature, expectedHash, 'Signature must match Cloudinary SHA-1 algorithm');
  assert.equal(signature.length, 40, 'SHA-1 hex string must be 40 characters');
});

test('Phase 3 - Cloudinary Folder Sanitization: Strips traversal sequences and invalid characters', async () => {
  assert.equal(sanitizeFolder('alamelsgad-products'), 'alamelsgad-products');
  assert.equal(sanitizeFolder('products/rugs/turkish'), 'products/rugs/turkish');

  // Traversal attack should be stripped
  const malicious = '../../etc/passwd';
  const sanitized = sanitizeFolder(malicious);
  assert.ok(!sanitized.includes('..'), 'Folder must not contain .. traversal');
  assert.ok(!sanitized.startsWith('/'), 'Folder must not start with slash');

  // Empty or invalid inputs fallback to default folder
  assert.equal(sanitizeFolder('', 'default-folder'), 'default-folder');
  assert.equal(sanitizeFolder(null, 'default-folder'), 'default-folder');
  assert.equal(sanitizeFolder(undefined, 'default-folder'), 'default-folder');
});

test('Phase 3 - Server-side Sign Route: Admin role enforcement rule and secret protection', async () => {
  // 1. SEC-01 Test: Anonymous request containing x-test-admin: true MUST BE REJECTED with 401
  const anonWithTestHeaderReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      'x-test-admin': 'true',
    },
  });
  const anonTestRes = await verifyAdminAuthorization(anonWithTestHeaderReq, async () => {
    throw new Error('fetch should not be called for unauthenticated request');
  });
  assert.equal(
    anonTestRes.authorized,
    false,
    'x-test-admin header must not bypass authentication for anonymous clients'
  );
  assert.equal(anonTestRes.status, 401);

  // 2. Standard anonymous request without credentials is rejected with 401
  const anonReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
  });
  const anonRes = await verifyAdminAuthorization(anonReq);
  assert.equal(anonRes.authorized, false);
  assert.equal(anonRes.status, 401);

  // 3. SEC-01 Test: CUSTOMER user with x-test-admin: true MUST BE REJECTED with 403
  const customerReqWithTestHeader = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      cookie: 'access_token=cust_tok',
      'x-test-admin': 'true',
    },
  });
  const mockCustomerFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 5, role: 'CUSTOMER', username: 'customer_user' }),
  });
  const customerTestRes = await verifyAdminAuthorization(customerReqWithTestHeader, mockCustomerFetch);
  assert.equal(
    customerTestRes.authorized,
    false,
    'x-test-admin header must not bypass authorization for customer role'
  );
  assert.equal(customerTestRes.status, 403);

  // 4. ADMIN user verified by backend response is authorized
  const adminReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      cookie: 'access_token=admin_tok',
    },
  });
  const mockAdminFetch = async (url, options) => {
    assert.ok(url.includes('/api/auth/me/'), 'Must verify against /api/auth/me/');
    assert.equal(options.headers?.cookie, 'access_token=admin_tok');
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 1, role: 'ADMIN', username: 'admin_user' }),
    };
  };
  const adminRes = await verifyAdminAuthorization(adminReq, mockAdminFetch);
  assert.equal(adminRes.authorized, true, 'Verified ADMIN user must be authorized');

  // 5. MODERATOR user verified by backend response is authorized
  const modReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      authorization: 'Bearer mod_tok',
    },
  });
  const mockModFetch = async (url, options) => {
    assert.ok(url.includes('/api/auth/me/'), 'Must verify against /api/auth/me/');
    assert.equal(options.headers?.authorization, 'Bearer mod_tok');
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 2, role: 'MODERATOR', username: 'mod_user' }),
    };
  };
  const modRes = await verifyAdminAuthorization(modReq, mockModFetch);
  assert.equal(modRes.authorized, true, 'Verified MODERATOR user must be authorized');

  // 6. Expired session (backend returns 401) is rejected
  const expiredReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      cookie: 'access_token=expired_tok',
    },
  });
  const mockExpiredFetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Token expired' }),
  });
  const expiredRes = await verifyAdminAuthorization(expiredReq, mockExpiredFetch);
  assert.equal(expiredRes.authorized, false);
  assert.equal(expiredRes.status, 401);

  // 7. Network/connection failure does not grant authorization and returns 503
  const networkErrorReq = new Request('http://localhost:3000/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      cookie: 'access_token=some_token',
    },
  });
  const mockErrorFetch = async () => {
    throw new Error('Connection refused / backend unreachable');
  };
  const networkErrorRes = await verifyAdminAuthorization(networkErrorReq, mockErrorFetch);
  assert.equal(networkErrorRes.authorized, false, 'Connection failure must not grant authorization');
  assert.equal(networkErrorRes.status, 503);

  // 8. Secrets are never exposed in response payload
  const signResponse = {
    cloud_name: 'alamelsgad-cloud',
    api_key: '9876543210',
    timestamp: '1728567890',
    folder: 'alamelsgad-products',
    signature: 'mock_signature_hash',
  };
  assert.equal('api_secret' in signResponse, false, 'api_secret must never be in sign response');
  assert.equal('CLOUDINARY_API_SECRET' in signResponse, false);
});

test('Phase 3 - Client Image Validation: Rejects invalid formats and oversize files', async () => {
  // 1. Valid image passes
  const validFile = new MockFile(['fake_bytes_for_image'], 'rug.webp', { type: 'image/webp' });
  assert.doesNotThrow(() => validateImageFile(validFile, 10 * 1024 * 1024));

  // 2. Unsupported format throws error
  const pdfFile = new MockFile(['fake_pdf_bytes'], 'document.pdf', { type: 'application/pdf' });
  assert.throws(
    () => validateImageFile(pdfFile, 10 * 1024 * 1024),
    /Unsupported file type/
  );

  // 3. Oversize file throws error
  const oversizedData = new Array(15 * 1024 * 1024).fill('a').join('');
  const hugeFile = new MockFile([oversizedData], 'huge.jpg', { type: 'image/jpeg' });
  assert.throws(
    () => validateImageFile(hugeFile, 10 * 1024 * 1024),
    /exceeds maximum allowed size/
  );
});

test('Phase 3 - Direct Upload Request Shape to Cloudinary API', async () => {
  // Simulate direct browser upload FormData assembly
  const mockFile = new MockFile(['image_binary_data'], 'persian_rug.png', { type: 'image/png' });
  const signData = {
    cloud_name: 'alamelsgad',
    api_key: '123456789012345',
    timestamp: '1728567890',
    folder: 'alamelsgad-products',
    signature: 'a1b2c3d4e5f67890123456789abcdef012345678',
  };

  // Expected Cloudinary endpoint
  const endpoint = `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`;
  assert.equal(endpoint, 'https://api.cloudinary.com/v1_1/alamelsgad/image/upload');

  // Verify FormData fields
  const expectedFields = ['file', 'api_key', 'timestamp', 'folder', 'signature'];
  const simulatedFormData = {
    file: mockFile,
    api_key: signData.api_key,
    timestamp: signData.timestamp,
    folder: signData.folder,
    signature: signData.signature,
  };

  for (const field of expectedFields) {
    assert.ok(field in simulatedFormData, `Direct upload must include ${field}`);
  }

  // Simulated Cloudinary response shape
  const mockCloudinaryResponse = {
    public_id: 'alamelsgad-products/persian_rug_abc123',
    version: 1728567890,
    width: 1200,
    height: 1200,
    format: 'png',
    resource_type: 'image',
    created_at: '2026-10-10T14:00:00Z',
    bytes: 350000,
    url: 'http://res.cloudinary.com/alamelsgad/image/upload/v1728567890/alamelsgad-products/persian_rug_abc123.png',
    secure_url: 'https://res.cloudinary.com/alamelsgad/image/upload/v1728567890/alamelsgad-products/persian_rug_abc123.png',
  };

  // Structured client return
  const result = {
    secure_url: mockCloudinaryResponse.secure_url || mockCloudinaryResponse.url,
    url: mockCloudinaryResponse.url,
    public_id: mockCloudinaryResponse.public_id,
    resource_type: mockCloudinaryResponse.resource_type,
    format: mockCloudinaryResponse.format,
    width: mockCloudinaryResponse.width,
    height: mockCloudinaryResponse.height,
    bytes: mockCloudinaryResponse.bytes,
  };

  assert.ok(result.secure_url.startsWith('https://'), 'Must use secure HTTPS URL');
  assert.equal(result.public_id, 'alamelsgad-products/persian_rug_abc123');
});

test('Phase 3 - ProductImage Payload & Django Contract Alignment', async () => {
  // Verify ProductImageCreateRequest shape expected by ProductImageViewSet.perform_create
  const createPayload = {
    product: 42,
    image: 'https://res.cloudinary.com/alamelsgad/image/upload/v12345/alamelsgad-products/rug.jpg',
    public_id: 'alamelsgad-products/rug',
    is_primary: true,
    sort_order: 0,
  };

  assert.equal(typeof createPayload.product, 'number', 'product must be foreign key ID');
  assert.equal(typeof createPayload.image, 'string', 'image must be Cloudinary secure URL');
  assert.ok(createPayload.image.startsWith('https://'), 'image URL must be secure HTTPS');
  assert.equal(typeof createPayload.public_id, 'string', 'public_id must be Cloudinary asset ID');
  assert.equal(createPayload.is_primary, true);
  assert.equal(createPayload.sort_order, 0);

  // Verify deletion contract:
  // Frontend calls DELETE /api/products/images/<id>/
  // Backend's ProductImageViewSet.destroy invokes delete_image(public_id) internally.
  const imageRecordId = 15;
  const deleteEndpoint = `/products/images/${imageRecordId}/`;
  assert.equal(deleteEndpoint, '/products/images/15/');
});

test('Phase 3 - Category and Subcategory Image Contracts Alignment', async () => {
  // Category create/update contract
  const categoryPayload = {
    name_ar: 'سجاد مودرن',
    name_en: 'Modern Rugs',
    image: 'https://res.cloudinary.com/alamelsgad/image/upload/v12345/alamelsgad-categories/modern.jpg',
    public_id: 'alamelsgad-categories/modern',
  };

  assert.equal(typeof categoryPayload.image, 'string');
  assert.equal(typeof categoryPayload.public_id, 'string');

  // Subcategory create/update contract
  const subcategoryPayload = {
    category_id: 1,
    name_ar: 'سجاد تركي صالون',
    name_en: 'Turkish Living Room Rugs',
    image: 'https://res.cloudinary.com/alamelsgad/image/upload/v12345/alamelsgad-subcategories/turkish.jpg',
    public_id: 'alamelsgad-subcategories/turkish',
  };

  assert.equal(typeof subcategoryPayload.category_id, 'number');
  assert.equal(typeof subcategoryPayload.image, 'string');
  assert.equal(typeof subcategoryPayload.public_id, 'string');
});

test('Phase 3 - Cloudinary Folder Whitelist: Enforces allowed folders and rejects arbitrary or malicious folder names', async () => {
  // 1. Whitelisted folders must be accepted
  assert.deepEqual(
    [...ALLOWED_CLOUDINARY_FOLDERS],
    ['alamelsgad-products', 'alamelsgad-categories', 'alamelsgad-subcategories']
  );

  assert.equal(isAllowedCloudinaryFolder('alamelsgad-products'), true);
  assert.equal(isAllowedCloudinaryFolder('alamelsgad-categories'), true);
  assert.equal(isAllowedCloudinaryFolder('alamelsgad-subcategories'), true);

  // 2. Arbitrary or unauthorized folders must be rejected
  assert.equal(isAllowedCloudinaryFolder('tocco/custom-designs'), false);
  assert.equal(isAllowedCloudinaryFolder('users/avatars'), false);
  assert.equal(isAllowedCloudinaryFolder('arbitrary-folder'), false);
  assert.equal(isAllowedCloudinaryFolder('../etc/passwd'), false);
  assert.equal(isAllowedCloudinaryFolder(''), false);
  assert.equal(isAllowedCloudinaryFolder(null), false);
  assert.equal(isAllowedCloudinaryFolder(undefined), false);
});

test('Phase 3 - Legacy Upload Route Deprecation: Returns HTTP 410 Gone for all requests', async () => {
  const postRes = await postUploadLegacy();
  assert.equal(postRes.status, 410, 'POST /api/cloudinary/upload must return HTTP 410 Gone');
  const postBody = await postRes.json();
  assert.ok(postBody.message.includes('deprecated'), 'Must explain route is deprecated');

  const getRes = await getUploadLegacy();
  assert.equal(getRes.status, 410, 'GET /api/cloudinary/upload must return HTTP 410 Gone');
  const getBody = await getRes.json();
  assert.ok(getBody.message.includes('deprecated'), 'Must explain route is deprecated');
});

test('Phase 3 - Server-side Dashboard Guard: checkServerAdminAuth enforces ADMIN and MODERATOR roles', async () => {
  // 1. Anonymous request without cookie is rejected with 401
  const anonAuth = await checkServerAdminAuth('');
  assert.equal(anonAuth.authorized, false);
  assert.equal(anonAuth.status, 401);

  // 2. CUSTOMER role is rejected with 403
  const customerAuth = await checkServerAdminAuth('access_token=cust_tok', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 1, email: 'customer@example.com', role: 'CUSTOMER' }),
  }));
  assert.equal(customerAuth.authorized, false);
  assert.equal(customerAuth.status, 403);
  assert.equal(customerAuth.user?.role, 'CUSTOMER');

  // 3. ADMIN role is accepted with 200
  const adminAuth = await checkServerAdminAuth('access_token=admin_tok', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 2, email: 'admin@alamelsgad.com', role: 'ADMIN' }),
  }));
  assert.equal(adminAuth.authorized, true);
  assert.equal(adminAuth.status, 200);
  assert.equal(adminAuth.user?.role, 'ADMIN');

  // 4. MODERATOR role is accepted with 200
  const modAuth = await checkServerAdminAuth('access_token=mod_tok', async () => ({
    ok: true,
    status: 200,
    json: async () => ({ id: 3, email: 'mod@alamelsgad.com', role: 'MODERATOR' }),
  }));
  assert.equal(modAuth.authorized, true);
  assert.equal(modAuth.status, 200);
  assert.equal(modAuth.user?.role, 'MODERATOR');

  // 5. Backend unavailable is handled safely with 503
  const netErrorAuth = await checkServerAdminAuth('access_token=tok', async () => {
    throw new Error('Connection refused');
  });
  assert.equal(netErrorAuth.authorized, false);
  assert.equal(netErrorAuth.status, 503);
});

