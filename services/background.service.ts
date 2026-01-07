
import { getAIClient, AI_MODELS } from '../lib/ai.ts';

export const BackgroundService = {
  async extractColorsFromImage(base64: string, mimeType: string): Promise<string[]> {
    const ai = getAIClient();
    if (!ai) throw new Error("AI Client not initialized. Check API Key.");

    const response = await ai.models.generateContent({
      model: AI_MODELS.VISION,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Act as a world-class UI designer. Extract the two most professional hex codes from this image: 1. A deep base color (#hex1) 2. A vibrant accent color (#hex2). Return ONLY: #hex1, #hex2" }
        ]
      }
    });

    const text = response.text || "";
    const colors = text.match(/#[a-fA-F0-9]{6}/g);
    
    if (!colors || colors.length < 2) {
      throw new Error("Gemini couldn't find a clear palette. Try a different image.");
    }
    
    return [colors[0], colors[1]];
  },

  generateElementorSnippet(cssBody: string): string {
    return `selector {\n  ${cssBody.trim()}\n}`;
  }
};
