export interface BackendEvent {
  id: number;
  title: string;
  description: string;
  image: string;
  public_id: string;
  event_date: string;
  created_at: string;
  updated_at: string;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  image: string;
  public_id: string;
  event_date: string;
}

export type EventUpdateRequest = Partial<EventCreateRequest>;
