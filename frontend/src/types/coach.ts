export type VisualSourceMode = 'idle' | 'camera' | 'screen';

export interface CoachAnalysisData {
  observation: string;
  steps: string[];
  expectedOutcome?: string | null;
  uncertainty?: string | null;
}

export interface SessionTurn {
  id: string;
  timestamp: string;
  question: string;
  snapshotImage?: string;
  response: CoachAnalysisData;
  modelUsed?: string;
}

export interface CoachRequest {
  question: string;
  image?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface CoachResponse {
  success: boolean;
  data?: CoachAnalysisData;
  error?: string;
  modelUsed?: string;
  configured?: boolean;
}
