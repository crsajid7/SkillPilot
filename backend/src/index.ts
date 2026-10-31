import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { analyzeVisualSkill } from './services/aiCoach.js';
import { CoachRequest } from './types/coach.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Payload limits: support up to 15MB for high-resolution base64 snapshots
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Request rate limit reached. Please wait a moment before submitting your next visual question.',
  },
});

app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const modelId = process.env.GEMINI_MODEL || process.env.MODEL_ID || 'gemma-4-26b-a4b-it';

  res.json({
    status: 'ok',
    service: 'SkillPilot AI Backend',
    model: modelId,
    apiKeyConfigured: hasApiKey,
    timestamp: new Date().toISOString(),
  });
});

// Primary coaching route handler
async function handleCoachRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { image, question, history } = req.body as CoachRequest;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A question or coaching objective is required.',
      });
    }

    if (question.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Question exceeds maximum allowed limit of 3000 characters.',
      });
    }

    // Validate image format if supplied
    if (image && typeof image === 'string') {
      const isDataUrl = image.startsWith('data:image/');
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(image.slice(0, 80));

      if (!isDataUrl && !isBase64) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image format. Supported formats are JPEG, PNG, or WebP base64 payloads.',
        });
      }
    }

    const result = await analyzeVisualSkill({
      image,
      question: question.trim(),
      history: Array.isArray(history) ? history : [],
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// Canonical endpoint specified in Master Prompt
app.post('/api/coach', handleCoachRequest);
app.post('/api/coach/analyze', handleCoachRequest);

// Safe error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SkillPilot Server Error]:', err?.message || err);
  res.status(500).json({
    success: false,
    error: 'Internal server error while processing skill analysis. Please verify your frame snapshot.',
  });
});

app.listen(PORT, () => {
  const model = process.env.GEMINI_MODEL || process.env.MODEL_ID || 'gemma-4-26b-a4b-it';
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  console.log(`[SkillPilot AI] Backend running at http://localhost:${PORT}`);
  console.log(`[SkillPilot AI] Target model: ${model}`);
  console.log(`[SkillPilot AI] API Key configured: ${hasKey}`);
});
