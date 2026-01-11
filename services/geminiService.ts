import { GoogleGenAI } from "@google/genai";
import { GenerationResult } from "../types";

const API_KEY = process.env.API_KEY || '';

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const fixMalformedJson = async (malformedJson: string): Promise<GenerationResult> => {
  if (!API_KEY) {
    return { content: '', error: 'API Key is missing.' };
  }

  try {
    const ai = getAiClient();
    const prompt = `
      You are a strict JSON repair engine. 
      The following text contains malformed JSON. 
      Repair it and return ONLY the valid JSON string. 
      Do not include any Markdown formatting (no \`\`\`json block), no explanations, and no extra text.
      
      Malformed JSON:
      ${malformedJson}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0, // Deterministic for code repair
      }
    });

    const text = response.text || '';
    // Clean up if model accidentally adds markdown despite instructions
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return { content: cleanText };
  } catch (error: any) {
    console.error("Gemini fix JSON error:", error);
    return { content: '', error: error.message || 'Failed to repair JSON.' };
  }
};

export const generateTypeScriptInterfaces = async (jsonString: string): Promise<GenerationResult> => {
  if (!API_KEY) {
    return { content: '', error: 'API Key is missing.' };
  }

  try {
    const ai = getAiClient();
    const prompt = `
      Analyze the following JSON and generate optimized TypeScript interfaces.
      Use 'Root' as the main interface name.
      Use 'readonly' properties.
      Return ONLY the TypeScript code. Do not wrap in markdown blocks if possible, or I will strip them.
      
      JSON:
      ${jsonString}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let text = response.text || '';
    // Strip markdown for clean display in editor
    text = text.replace(/^```typescript\s*/, '').replace(/^```ts\s*/, '').replace(/```$/, '').trim();

    return { content: text };
  } catch (error: any) {
    console.error("Gemini Type Gen error:", error);
    return { content: '', error: error.message || 'Failed to generate types.' };
  }
};