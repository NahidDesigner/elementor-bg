
import { GoogleGenAI } from "@google/genai";

export const getAIClient = () => {
  // Access the key injected by server.js into the global window object
  const apiKey = (window as any).process?.env?.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in window.process.env. Ensure server.js is injecting it.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const AI_MODELS = {
  DEFAULT: 'gemini-3-flash-preview',
  VISION: 'gemini-3-flash-preview'
};
