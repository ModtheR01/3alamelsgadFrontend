import { apiClient } from '../client';
import { AiImageJob, EnhanceImageRequest } from '@/types/aiImage';

export interface ProcessRugImageResult {
  blob: Blob;
  contentType: string;
}

/**
 * AI Product Image Enhancement Service
 *
 * Connects directly to the Django REST API endpoint:
 * POST /api/products/process-rug/
 *
 * Accepts either:
 * 1. JSON with 'image_url' (recommended: eliminates Vercel FUNCTION_PAYLOAD_TOO_LARGE).
 * 2. multipart/form-data with file field 'image' (legacy / direct file).
 *
 * Returns raw binary image data (Blob) with its MIME type.
 */
export const aiImageService = {
  /**
   * Internal helper to handle raw backend response from /products/process-rug/
   */
  async _handleProcessResponse(response: Response): Promise<ProcessRugImageResult> {
    if (!response.ok) {
      let errorMessage = `فشلت معالجة الصورة (رمز الخطأ ${response.status}).`;
      try {
        const text = await response.text();
        if (text && text.trim()) {
          try {
            const json = JSON.parse(text);
            errorMessage = json.error || json.detail || json.message || errorMessage;
          } catch {
            errorMessage = text;
          }
        }
      } catch {
        // Fallback to default message
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type') || '';
    const blob = await response.blob();

    const isImage = (blob.type && blob.type.startsWith('image/')) || contentType.startsWith('image/');
    if (!isImage) {
      throw new Error('الاستجابة المستلمة من الخادم ليست صورة صالحة.');
    }

    return {
      blob,
      contentType: blob.type || contentType,
    };
  },

  /**
   * Submit an image URL (e.g. secure Cloudinary URL) to the backend rug processing endpoint:
   * POST /api/products/process-rug/ with JSON { image_url: imageUrl }
   *
   * By sending a lightweight URL string (~100 bytes) instead of large binary image bytes or base64,
   * this completely prevents Vercel Serverless Function 4.5MB payload limit errors (FUNCTION_PAYLOAD_TOO_LARGE).
   */
  async processRugImageUrl(imageUrl: string): Promise<ProcessRugImageResult> {
    if (!imageUrl || !imageUrl.trim()) {
      throw new Error('لم يتم تحديد رابط الصورة للمعالجة.');
    }

    const response = await apiClient.postJsonRaw('/products/process-rug/', {
      image_url: imageUrl.trim(),
    });

    return this._handleProcessResponse(response);
  },

  /**
   * Submit an image to the real Django backend rug processing endpoint:
   * POST /api/products/process-rug/
   *
   * Accepts:
   * - string: Image URL (Cloudinary / HTTPS), sent as lightweight JSON { image_url }.
   * - File | Blob: Binary file under multipart form-data key "image".
   *
   * Returns: Raw binary image data as a Blob with its MIME type.
   * On error: Parses backend JSON error response or throws descriptive error.
   */
  async processRugImage(imageInput: File | Blob | string, filename = 'rug-image.jpg'): Promise<ProcessRugImageResult> {
    if (!imageInput) {
      throw new Error('لم يتم تحديد صورة للمعالجة.');
    }

    if (typeof imageInput === 'string') {
      return this.processRugImageUrl(imageInput);
    }

    const formData = new FormData();
    if (imageInput instanceof File) {
      formData.append('image', imageInput, imageInput.name);
    } else {
      formData.append('image', imageInput, filename);
    }

    const response = await apiClient.postFormData('/products/process-rug/', formData);
    return this._handleProcessResponse(response);
  },

  /**
   * Submit an image to the AI enhancement pipeline.
   * If a File or Blob is available, delegates to the real processRugImage endpoint.
   */
  async enhanceImage(request: EnhanceImageRequest & { file?: File | Blob }): Promise<AiImageJob> {
    if (request.file) {
      const { blob } = await this.processRugImage(request.file);
      const defaultOptions = {
        cleanBackground: true,
        preserveTexture: true,
        reduceEmptySpace: true,
        aspectRatio: '4:3' as const,
        lightingEnhance: true,
        ...request.options,
      };
      const enhancedUrl = typeof window !== 'undefined' ? URL.createObjectURL(blob) : request.image;
      return {
        id: `ai-job-${Date.now()}`,
        originalImage: request.image,
        originalPublicId: request.public_id,
        enhancedImage: enhancedUrl,
        status: 'completed',
        options: defaultOptions,
        approved: false,
        assignedProductId: request.productId,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
    }

    return apiClient.post<AiImageJob>('/products/process-rug/', {
      image: request.image,
    });
  },

  /**
   * Approve a generated AI product image.
   * POST /api/ai/approve-image/
   */
  async approveImage(jobId: string, productId?: string | number): Promise<{ success: boolean; image: string }> {
    try {
      return await apiClient.post<{ success: boolean; image: string }>('/ai/approve-image/', {
        job_id: jobId,
        product_id: productId,
      });
    } catch {
      return { success: true, image: '' };
    }
  },
};
