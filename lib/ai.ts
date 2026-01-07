
import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  // process.env.API_KEY is injected by server.js
  const apiKey = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    console.error("Critical: API_KEY is missing from environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const AI_MODELS = {
  DEFAULT: 'gemini-3-flash-preview',
  VISION: 'gemini-3-flash-preview'
};
