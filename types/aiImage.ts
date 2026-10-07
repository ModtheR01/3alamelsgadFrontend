export interface AiImageJob {
  id: string;
  originalImage: string;
  originalPublicId?: string;
  enhancedImage?: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  options: {
    cleanBackground: boolean;
    preserveTexture: boolean;
    reduceEmptySpace: boolean;
    aspectRatio: '4:3' | '1:1' | '16:9';
    lightingEnhance: boolean;
  };
  approved: boolean;
  assignedProductId?: string | number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface EnhanceImageRequest {
  image: string; // Base64 data URL or remote URL
  public_id?: string;
  options?: Partial<AiImageJob['options']>;
  productId?: string | number;
}
