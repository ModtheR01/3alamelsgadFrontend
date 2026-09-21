/**
 * Signed Cloudinary image upload utility.
 *
 * The browser sends the file to the Next.js route. The route keeps the
 * Cloudinary secret server-side, signs the request, and forwards the file.
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

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  onProgress?: UploadProgressCallback;
  maxSizeInBytes?: number;
  preserveAspectRatio?: boolean;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

/**
 * Validates file type and file size before upload
 */
export function validateImageFile(file: File, maxSizeInBytes: number = DEFAULT_MAX_SIZE): void {
  if (!file) {
    throw new Error('No image file selected.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
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

/** Uploads an image through the server-side signed Cloudinary route. */
export async function uploadDirectToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  validateImageFile(file, options.maxSizeInBytes || DEFAULT_MAX_SIZE);

  const formData = new FormData();
  formData.append('file', file, file.name);
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  formData.append('preserve_aspect_ratio', String(options.preserveAspectRatio ?? false));

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/cloudinary/upload');

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
          };
          if (!response.url || !response.public_id) {
            reject(new Error(response.message || 'Cloudinary returned an incomplete upload response.'));
            return;
          }
          resolve({
            secure_url: response.secure_url || response.url,
            url: response.url,
            public_id: response.public_id,
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
          const errPayload = JSON.parse(xhr.responseText);
          if (errPayload.message) {
            errorMessage = errPayload.message;
          } else if (errPayload.error?.message) {
            errorMessage = errPayload.error.message;
          }
        } catch {
          // Ignore json parse error
        }
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during direct Cloudinary upload. Please check your internet connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Cloudinary upload timed out.'));
    };

    xhr.send(formData);
  });
}
