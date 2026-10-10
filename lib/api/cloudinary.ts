/**
 * Signed Cloudinary direct client upload integration.
 *
 * Architecture:
 * 1. Client validates image file (MIME type and size).
 * 2. Client requests upload signature from Next.js server route (/api/cloudinary/sign),
 *    which verifies admin authorization and keeps CLOUDINARY_API_SECRET strictly server-side.
 * 3. Browser uploads the image directly to Cloudinary (https://api.cloudinary.com/v1_1/<cloud_name>/image/upload)
 *    with progress tracking.
 * 4. Structured Cloudinary result (secure_url, public_id, dimensions) is returned to client.
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface CloudinarySignResponse {
  cloud_name: string;
  api_key: string;
  timestamp: string;
  folder: string;
  signature: string;
}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  onProgress?: UploadProgressCallback;
  maxSizeInBytes?: number;
  preserveAspectRatio?: boolean;
}

export const DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

/**
 * Validates file type and file size before initiating upload.
 */
export function validateImageFile(file: File, maxSizeInBytes: number = DEFAULT_MAX_IMAGE_SIZE): void {
  if (!file) {
    throw new Error('No image file selected.');
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(
      `Unsupported file type "${file.type}". Allowed formats: JPEG, PNG, WebP, AVIF, GIF.`
    );
  }

  if (file.size > maxSizeInBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = (maxSizeInBytes / (1024 * 1024)).toFixed(0);
    throw new Error(`File size (${sizeMb} MB) exceeds maximum allowed size of ${maxMb} MB.`);
  }
}

/**
 * Requests signed upload parameters from the secure server-side endpoint.
 */
export async function getCloudinaryUploadSignature(
  options?: { folder?: string }
): Promise<CloudinarySignResponse> {
  const response = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folder: options?.folder,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `Failed to obtain upload authorization (HTTP ${response.status}).`;
    try {
      const errJson = (await response.json()) as { message?: string };
      if (errJson?.message) {
        errorMessage = errJson.message;
      }
    } catch {
      // Keep generic message
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as CloudinarySignResponse;
  if (!data.cloud_name || !data.api_key || !data.timestamp || !data.signature) {
    throw new Error('Received incomplete upload authorization from server.');
  }

  return data;
}

/**
 * Uploads an image directly from the browser to Cloudinary using signed authorization.
 */
export async function uploadDirectToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  // 1. Client-side file validation
  validateImageFile(file, options.maxSizeInBytes || DEFAULT_MAX_IMAGE_SIZE);

  // 2. Fetch secure signed authorization from Next.js server route
  const signData = await getCloudinaryUploadSignature({ folder: options.folder });

  // 3. Prepare FormData for direct Cloudinary upload
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('api_key', signData.api_key);
  formData.append('timestamp', signData.timestamp);
  if (signData.folder) {
    formData.append('folder', signData.folder);
  }
  formData.append('signature', signData.signature);

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`;

  // 4. Send directly from browser to Cloudinary with progress tracking
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadEndpoint);

    if (options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as Partial<CloudinaryUploadResult> & {
            message?: string;
            error?: { message?: string };
          };
          if (!response.secure_url && !response.url) {
            reject(
              new Error(
                response.error?.message ||
                  response.message ||
                  'Cloudinary returned an incomplete upload response.'
              )
            );
            return;
          }
          resolve({
            secure_url: response.secure_url || response.url || '',
            url: response.url || response.secure_url || '',
            public_id: response.public_id || '',
            resource_type: response.resource_type || 'image',
            format: response.format || '',
            width: response.width || 0,
            height: response.height || 0,
            bytes: response.bytes || file.size,
          });
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        let errorMessage = `Cloudinary upload failed (HTTP ${xhr.status})`;
        try {
          const errPayload = JSON.parse(xhr.responseText) as {
            error?: { message?: string };
            message?: string;
          };
          if (errPayload.error?.message) {
            errorMessage = errPayload.error.message;
          } else if (errPayload.message) {
            errorMessage = errPayload.message;
          }
        } catch {
          // Ignore JSON parse error
        }
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Network error during direct Cloudinary upload. Please check your internet connection.'
        )
      );
    };

    xhr.ontimeout = () => {
      reject(new Error('Cloudinary upload timed out. Please try again.'));
    };

    xhr.send(formData);
  });
}
