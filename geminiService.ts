
import { GoogleGenAI } from "@google/genai";

// Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
// This is especially important in environments where the API key might be updated via a user dialog.

export async function summarizeNote(content: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Riassumi brevemente ed estrai i punti chiave di questo appunto universitario: ${content}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // The GenerateContentResponse object features a text property (not a method).
    return response.text || "Impossibile generare il riassunto.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Errore durante l'elaborazione del riassunto.";
  }
}

export async function suggestStudyPlan(topic: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crea un piano di studio rapido in 5 step per il seguente argomento universitario: ${topic}`,
    });
    // The GenerateContentResponse object features a text property (not a method).
    return response.text || "Nessun suggerimento disponibile.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Errore nella generazione del piano di studio.";
  }
}
