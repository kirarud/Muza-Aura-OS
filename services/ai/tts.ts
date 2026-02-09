
import { Modality } from "@google/genai";
import { getAi } from './gemini';

export const generateSpeech = async (text: string): Promise<string> => {
    if (!text || !text.trim()) {
        console.warn("TTS skipped: Empty text");
        return "";
    }

    // Clean text of markdown/code blocks which might confuse TTS
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[*_~`]/g, '').trim();
    if (!cleanText) return "";

    try {
        const response = await getAi().models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        // Ensure we handle potential missing candidates gracefully
        if (!response.candidates || response.candidates.length === 0) {
             console.warn("TTS: No candidates returned.");
             return "";
        }

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            console.warn("TTS: No audio data received.");
            return "";
        }
        return base64Audio;
    } catch (error: any) {
        if (error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn("TTS skipped due to quota limits (429).");
            return "";
        }
        // Log simplified error to avoid cluttering console with full RPC dumps
        console.error("TTS generation failed:", error.message || "Unknown error");
        return "";
    }
};
