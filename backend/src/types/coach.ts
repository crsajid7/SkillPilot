export interface HistoryMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CoachRequest {
  image?: string; // base64 string or data:image/jpeg;base64,...
  question: string;
  history?: HistoryMessage[];
}

export interface CoachAnalysisData {
  observation: string;
  steps: string[]; // max 5, imperative & actionable
  expectedOutcome?: string | null;
  uncertainty?: string | null;
}

export interface CoachResponse {
  success: boolean;
  data?: CoachAnalysisData;
  error?: string;
  modelUsed?: string;
  configured?: boolean;
}
