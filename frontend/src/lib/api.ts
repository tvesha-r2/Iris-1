/**
 * frontend/src/lib/api.ts
 * ========================
 * Thin API client for ThumbHeap backend.
 * API_BASE reads from VITE_API_BASE_URL env var; falls back to localhost:8000.
 *
 * SECURITY: GROQ_API_KEY is never passed here — it lives server-side only.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface AnalysisDetections {
  texts: number;
  faces: number;
  objects: number;
}

export interface BudgetItem {
  name: string;
  percentage: number;
  insight: string;
}

export interface Recommendation {
  category: string;
  text: string;
}

export interface AnalysisInsights {
  attention_score: number;
  attention_budget: BudgetItem[];
  attention_efficiency: number;
  attention_leakage: number;
  primary_attention: string;
  strongest_anchor: string;
  largest_competitor: string;
  potential_distraction: string;
  alignment: string;
  recommendations: Recommendation[];
}

export interface AnalysisResult {
  id: string;
  url: string;
  overlay_url: string | null;
  detections: AnalysisDetections;
  insights: AnalysisInsights | null;
}

export interface StoredImage {
  id: string;
  url: string;
  filename?: string | null;
}

export interface StoredThumbnail extends StoredImage {
  overlay_url?: string | null;
  analysis_status?: string;
  ai_scores?: {
    texts_detected?: number;
    faces_detected?: number;
    objects_detected?: number;
  };
  detections?: AnalysisDetections;
  insights?: AnalysisInsights | null;
}

async function errorDetail(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => ({}));
  return error.detail ?? `${fallback} (${response.status}). Please try again.`;
}

/** POST /api/upload — persist the original image and return its database reference. */
export async function uploadImage(file: File, token: string): Promise<StoredImage> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await errorDetail(response, 'Image storage failed'));
  }

  const storedImage = await response.json() as StoredImage;
  if (!storedImage.id || !storedImage.url) {
    throw new Error('Image storage failed: the server returned no stored image reference.');
  }
  return storedImage;
}

/**
 * POST /api/analyze
 * Sends the persisted thumbnail reference to the ML pipeline.
 */
export async function analyzeImage(thumbnailId: string, token: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('thumbnail_id', thumbnailId);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    // Do NOT manually set Content-Type — browser sets multipart boundary automatically
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!res.ok) {
    throw new Error(await errorDetail(res, 'Analysis failed'));
  }

  return res.json() as Promise<AnalysisResult>;
}

/** GET /api/thumbnails — user's analysis history */
export async function getThumbnails(token: string): Promise<StoredThumbnail[]> {
  const res = await fetch(`${API_BASE}/api/thumbnails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await errorDetail(res, 'Could not load saved thumbnails'));
  const data = await res.json() as { thumbnails: StoredThumbnail[] };
  return data.thumbnails;
}

/** POST /api/insights/{id} — generate AI insights on demand */
export async function generateAIInsights(thumbnailId: string, token: string): Promise<AnalysisInsights> {
  const res = await fetch(`${API_BASE}/api/insights/${thumbnailId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Failed to generate AI insights.');
  }
  const data = await res.json();
  return data.insights;
}
