
import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing from environment");
  return new GoogleGenAI({ apiKey });
};

export const AI_MODELS = {
  TEXT: 'gemini-3-flash-preview',
  IMAGE: 'gemini-2.5-flash-image',
};
