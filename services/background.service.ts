
import { getAIClient, AI_MODELS } from '../lib/ai.ts';

export const BackgroundService = {
  /**
   * Extracts a professional color palette from an image using Gemini
   */
  async extractColorsFromImage(base64: string, mimeType: string): Promise<string[]> {
    const ai = getAIClient();
    
    const response = await ai.models.generateContent({
      model: AI_MODELS.TEXT,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Analyze this image for web design. Extract exactly two hex codes: 1. A deep background color (#hex1) and 2. A vibrant accent color (#hex2). Return ONLY the hex codes separated by a comma." }
        ]
      }
    });

    const text = response.text || "";
    const colors = text.match(/#[a-fA-F0-9]{6}/g);
    
    if (!colors || colors.length < 2) {
      throw new Error("Could not extract sufficient colors from image.");
    }
    
    return colors;
  },

  /**
   * Formats the CSS for Elementor compatibility
   */
  formatElementorCss(css: string): string {
    return `selector {\n  ${css.trim()}\n}`;
  }
};
