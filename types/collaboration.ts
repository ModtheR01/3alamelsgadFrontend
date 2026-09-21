export interface BackendCollaboration {
  id: number;
  title: string;
  image: string;
  public_id: string;
  created_at: string;
}

export interface CollaborationCreateRequest {
  title: string;
  image: string;
  public_id: string;
}
