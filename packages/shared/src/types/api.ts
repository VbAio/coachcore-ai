export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadReplayResponse {
  replayId: string;
  uploadUrl?: string;
  status: string;
}

export interface ReplaySummary {
  id: string;
  fileName: string;
  hero: string;
  map: string;
  durationSeconds: number;
  grade?: string;
  status: string;
  createdAt: string;
  thumbnailUrl?: string;
}
