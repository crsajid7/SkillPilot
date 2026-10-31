import { GoogleGenAI } from '@google/genai';
import { CoachAnalysisData, CoachRequest, CoachResponse } from '../types/coach.js';

const SYSTEM_INSTRUCTION = `You are SkillPilot AI, an elite, minimalist universal visual AI skills coach.
Tagline: "See your work. Ask for guidance. Get better."

Your role is to analyze what the user is working on through their visual frame snapshot and question, then provide immediate, concrete, imperative guidance.

DOMAINS SUPPORTED:
- Creative software: DaVinci Resolve, Premiere, Photoshop, Blender, coding IDEs, audio DAWs.
- Physical skills: Guitar, instruments, handwriting, drawing, cooking, woodworking.
- Sports & movement: Exercise technique, posture, coordination, form.
- Practical technical work: Electronics, soldering, assembly, mechanical repairs.
- Any visual workspace task where a frame provides actionable context.

CORE RULES:
1. NEVER start with greetings ("Hello", "Hey", "Sure!", "Great job").
2. NEVER repeat or rephrase the question back to the user.
3. NEVER write long introductory paragraphs, conversational filler, or generic encouragement.
4. Ground every observation strictly in what is genuinely visible in the submitted image frame. If something is not visible or blurry, state it in uncertainty. NEVER fabricate UI elements, hand positions, or errors.
5. Provide up to 5 numbered, imperative action steps (e.g. "Select the clip...", "Lower your thumb...", "Heat the copper pad...").
6. Provide a concise expected outcome only when useful.
7. If the visual frame lacks evidence or is ambiguous, provide a brief uncertainty note stating what is missing or asking one targeted clarification.
8. Output MUST be valid, clean JSON with this exact schema:
{
  "observation": "One short, precise sentence on what is visually observed in the frame.",
  "steps": [
    "1. Imperative action step",
    "2. Imperative action step"
  ],
  "expectedOutcome": "Short tangible result upon completing the steps",
  "uncertainty": null
}`;

/**
 * Clean and safely validate JSON response from the model
 */
function parseCleanJson(rawText: string): CoachAnalysisData {
  let cleaned = rawText.trim();
  // Strip markdown code blocks if model wrapped the JSON
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }

  const parsed = JSON.parse(cleaned);

  const observation = typeof parsed.observation === 'string'
    ? parsed.observation.trim()
    : (typeof parsed.observations === 'string' ? parsed.observations.trim() : 'Visual frame reviewed.');

  let rawSteps: string[] = [];
  if (Array.isArray(parsed.steps)) {
    rawSteps = parsed.steps.map((s: unknown) => String(s).trim()).filter(Boolean);
  } else if (typeof parsed.steps === 'string') {
    rawSteps = [parsed.steps.trim()];
  }

  // Ensure maximum 5 imperative steps
  const steps = rawSteps.slice(0, 5);

  const expectedOutcome = typeof parsed.expectedOutcome === 'string' && parsed.expectedOutcome.trim().length > 0
    ? parsed.expectedOutcome.trim()
    : (typeof parsed.expected_result === 'string' && parsed.expected_result.trim().length > 0
      ? parsed.expected_result.trim()
      : null);

  const uncertainty = typeof parsed.uncertainty === 'string' && parsed.uncertainty.trim().length > 0
    ? parsed.uncertainty.trim()
    : null;

  return {
    observation,
    steps,
    expectedOutcome,
    uncertainty,
  };
}

export async function analyzeVisualSkill(req: CoachRequest): Promise<CoachResponse> {
  const { image, question, history = [] } = req;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelId = process.env.GEMINI_MODEL?.trim() || process.env.MODEL_ID?.trim() || 'gemma-4-26b-a4b-it';

  // If no API key is configured, return an honest status. Do not fake an AI response!
  if (!apiKey) {
    return {
      success: false,
      configured: false,
      error: 'GEMINI_API_KEY is not configured in backend/.env. Please add your Google AI Studio API key to backend/.env and restart the server to enable real-time Gemma 4 visual analysis.',
      modelUsed: modelId,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Contextual system prompt
    let contextualPrompt = `${SYSTEM_INSTRUCTION}\n\n`;

    if (history.length > 0) {
      contextualPrompt += `RECENT CONVERSATION CONTEXT:\n`;
      for (const msg of history.slice(-4)) {
        contextualPrompt += `${msg.role === 'user' ? 'User' : 'SkillPilot'}: ${msg.text}\n`;
      }
      contextualPrompt += `\n`;
    }

    contextualPrompt += `USER QUESTION: ${question}\n`;
    if (image) {
      contextualPrompt += `A visual snapshot frame has been provided. Analyze the frame carefully and ground all observations in it.\n`;
    } else {
      contextualPrompt += `NOTE: No visual frame was provided with this question. If the user asks about a visual element, explicitly instruct them to share their screen or camera in the uncertainty field.\n`;
    }
    contextualPrompt += `Respond strictly with the specified JSON object.`;

    parts.push({ text: contextualPrompt });

    // Process image if present
    if (image) {
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: parts as any,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawText = response.text || '';
    if (!rawText) {
      throw new Error(`Empty response received from model ${modelId}.`);
    }

    const structuredData = parseCleanJson(rawText);

    return {
      success: true,
      configured: true,
      data: structuredData,
      modelUsed: modelId,
    };
  } catch (error: any) {
    console.error('[SkillPilot AI] Error calling model:', error?.message || error);

    const errorMessage = error?.message || 'Error occurred while contacting the visual model.';
    return {
      success: false,
      configured: true,
      error: `Model error (${modelId}): ${errorMessage}. If ${modelId} is not accessible with your key, set GEMINI_MODEL in backend/.env to another supported multimodal model.`,
      modelUsed: modelId,
    };
  }
}
