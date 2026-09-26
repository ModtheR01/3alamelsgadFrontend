export interface BackendSpaceProject {
  id: number;
  customer_name: string;
  caption: string;
  location: string;
  image: string;
  public_id: string;
  product_id: number | null;
  product_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpaceProjectRequest {
  customer_name?: string;
  caption?: string;
  location?: string;
  image: string;
  public_id: string;
  product_id?: number | null;
}