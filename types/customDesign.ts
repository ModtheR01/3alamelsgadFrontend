export type CustomDesignRequestType = 'CLIENT' | 'BUSINESS';

export interface CustomDesignDimensions {
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  [key: string]: number | undefined;
}

export interface CustomDesignImage {
  id: number;
  request: number;
  image: string;
  public_id: string;
  sort_order: number;
  created_at: string;
}

export interface CustomDesignRequest {
  id: number;
  user: number;
  title: string;
  request_type: CustomDesignRequestType;
  dimensions: CustomDesignDimensions;
  quantity: number;
  description: string;
  contact_phone: string;
  company_name: string;
  project_location: string;
  target_delivery_date: string | null;
  images: CustomDesignImage[];
  created_at: string;
  updated_at: string;
}

export interface CustomDesignRequestCreate {
  title: string;
  request_type: CustomDesignRequestType;
  dimensions: CustomDesignDimensions;
  quantity: number;
  description: string;
  contact_phone: string;
  company_name: string;
  project_location: string;
  target_delivery_date: string | null;
}

export interface CustomDesignImageCreate {
  request: number;
  image: string;
  public_id: string;
  sort_order: number;
}