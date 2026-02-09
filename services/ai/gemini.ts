import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

/**
 * Returns a singleton instance of the GoogleGenAI client.
 * Throws an error if the API key is not available.
 */
export const getAi = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};
