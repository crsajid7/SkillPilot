import type { CoachRequest, CoachResponse } from '../types/coach';

export interface HealthStatus {
  status: string;
  service: string;
  model: string;
  apiKeyConfigured: boolean;
  timestamp: string;
}

export async function checkServerHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Healthcheck returned HTTP ${res.status}`);
  }
  return res.json();
}

export async function submitCoachRequest(payload: CoachRequest): Promise<CoachResponse> {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return data;
}
