import { cache } from 'react';
//這個方法 google.com/uc? 不可靠。不穩定。11/20/2025
import { createChatCompletion } from './openai';

const FALLBACK_DESCRIPTION =
  'A dark, glassy uploader canvas spotlights a centered dropzone card, Drive badge, and tidy status rail, but configure OPENAI_API_KEY to replace this placeholder with GPT generated prose.';

const systemPrompt = `You are a concise UI analyst helping document a Google Drive themed uploader mockup.
Describe what the user sees in natural prose (no headings or bullets), highlight the gradient backdrop, centered dropzone, Google Drive badge, stacked file progress chips, and floating upload control. Keep it under 100 words.`;

const userPrompt = `Summarize the visual cues from https://drive.google.com/uc?export=view&id=1kYSo5NNSkmQk4TBWnllsApFKjZwSlrU6 so readers understand the mood and information hierarchy.`;

export const getAboutDocumentDescription = cache(async () => {
  if (!process.env.OPENAI_API_KEY) {
    return FALLBACK_DESCRIPTION;
  }

  try {
    return await createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 180, temperature: 0.3 },
    );
  } catch (error) {
    console.error('Unable to fetch GPT description:', error);
    return `${FALLBACK_DESCRIPTION} (Error: ${(error as Error).message})`;
  }
});