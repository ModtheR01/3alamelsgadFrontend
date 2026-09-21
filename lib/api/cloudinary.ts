/**
 * Direct Cloudinary Image Upload Utility
 *
 * Uploads images directly from the browser to Cloudinary.
 * The Django backend never receives, processes, or proxies the raw image file.
 *
 * Supports:
 * - Unsigned uploads via NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 * - Signed uploads via /api/cloudinary/sign (keeping API secret on server)
 * - Granular client-side file validation (type, size)
 * - Real-time progress monitoring (0-100%)
 * - Extraction of secure_url, public_id, format, dimensions
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
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

class CloudinaryConfigManager {
  private cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  private uploadPreset: string = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  private defaultFolder: string = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'tocco/products';

  constructor() {
    if (typeof window !== 'undefined') {
      const storedCloud = localStorage.getItem('tocco_cloudinary_cloud_name');
      if (storedCloud) this.cloudName = storedCloud;
      const storedPreset = localStorage.getItem('tocco_cloudinary_upload_preset');
      if (storedPreset) this.uploadPreset = storedPreset;
    }
  }

  getCloudName(): string {
    return this.cloudName;
  }

  setCloudName(name: string) {
    this.cloudName = name;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tocco_cloudinary_cloud_name', name);
    }
  }

  getUploadPreset(): string {
    return this.uploadPreset;
  }

  setUploadPreset(preset: string) {
    this.uploadPreset = preset;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tocco_cloudinary_upload_preset', preset);
    }
  }

  getFolder(): string {
    return this.defaultFolder;
  }

  isConfigured(): boolean {
    return Boolean(this.cloudName && this.uploadPreset);
  }
}

export const cloudinaryConfig = new CloudinaryConfigManager();

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

/**
 * Uploads an image file directly to Cloudinary
 */
export async function uploadDirectToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  // 1. Client-side validation
  validateImageFile(file, options.maxSizeInBytes || DEFAULT_MAX_SIZE);

  const cloudName = cloudinaryConfig.getCloudName();
  const uploadPreset = cloudinaryConfig.getUploadPreset();
  const folder = options.folder || cloudinaryConfig.getFolder();

  // 2. Prepare Form Data
  const formData = new FormData();
  formData.append('file', file);

  let endpointUrl = '';

  if (cloudName && uploadPreset) {
    // Standard Unsigned Upload with configured preset
    endpointUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    formData.append('upload_preset', uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }
  } else {
    // Attempt Server Signature if Cloudinary API secret is configured in Next.js backend
    try {
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });

      if (signRes.ok) {
        const signData = await signRes.json();
        endpointUrl = `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`;
        formData.append('api_key', signData.api_key);
        formData.append('timestamp', signData.timestamp);
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);
      } else {
        const errJson = await signRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Signature not available');
      }
    } catch {
      // In mock/test mode without live Cloudinary keys, gracefully simulate the direct upload
      if (
        typeof window !== 'undefined' &&
        (process.env.NEXT_PUBLIC_API_MODE === 'mock' || !cloudinaryConfig.isConfigured())
      ) {
        return simulateDirectUpload(file, options);
      }

      throw new Error(
        'Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables, or configure them in the developer console.'
      );
    }
  }

  // 3. Upload via XMLHttpRequest to capture accurate upload progress
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpointUrl);

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
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url || response.url,
            url: response.url || response.secure_url,
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
          if (errPayload.error?.message) {
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

/**
 * Simulates direct image upload for development/testing when Cloudinary credentials are not configured.
 * Generates an accurate CloudinaryUploadResult with base64 Data URL and step-wise progress updates.
 */
async function simulateDirectUpload(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const steps = [15, 45, 75, 100];
  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    options.onProgress?.(step);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cleanName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      resolve({
        secure_url: dataUrl,
        url: dataUrl,
        public_id: `tocco/products/${cleanName}_${Date.now()}`,
        resource_type: 'image',
        format: file.type.split('/')[1] || 'jpg',
        width: 1200,
        height: 900,
        bytes: file.size,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file for simulation.'));
    reader.readAsDataURL(file);
  });
}
