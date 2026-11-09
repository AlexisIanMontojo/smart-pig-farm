import { delay } from './mockApi';
import { isBackendConfigured } from './api';
import axios from 'axios';

/**
 * AI screening service boundary.
 *
 * Planned real flow: smartphone capture -> POST multipart to a Python FastAPI
 * endpoint -> OpenCV preprocessing -> a trained/fine-tuned YOLO-based model
 * limited to the visual classes present in the project's training data ->
 * JSON result returned here.
 *
 * No trained model is connected in this prototype. Results below are fabricated
 * sample output and are labelled as such everywhere they are displayed.
 */
const AI_URL = import.meta.env.VITE_AI_SERVICE_URL;
export const isAiServiceLive = () => Boolean(AI_URL) && isBackendConfigured();

/** Classes must match what the model was actually trained on. Placeholder list. */
export const SCREENING_CLASSES = [
  'No visible abnormality',
  'Possible skin lesion',
  'Possible lameness posture',
  'Image unsuitable for screening',
];

export function validateImage(file) {
  if (!file) return 'Please capture or select an image first.';
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return 'Only JPG, PNG, or WebP images are supported.';
  if (file.size > 8 * 1024 * 1024) return 'Image must be smaller than 8 MB.';
  return '';
}

export async function analyzeImage({ file, pigId }) {
  if (isAiServiceLive()) {
    const form = new FormData();
    form.append('image', file);
    form.append('pig_id', pigId);
    const { data } = await axios.post(`${AI_URL}/screen`, form, { timeout: 30000 });
    return { ...data, simulated: false };
  }

  await delay(1600);
  const label = SCREENING_CLASSES[Math.floor(Math.random() * 3)];
  return {
    simulated: true,
    pigId,
    label,
    confidence: Number((0.62 + Math.random() * 0.3).toFixed(2)),
    note: 'SIMULATED RESULT. This image was not processed by any trained model. '
        + 'Figures shown are placeholder values generated for interface testing only.',
    disclaimer: 'Screening output is preliminary and is not a veterinary diagnosis. '
        + 'Consult a licensed veterinarian before any treatment decision.',
    analyzedAt: new Date().toISOString(),
  };
}
