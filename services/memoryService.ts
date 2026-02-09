
import { GoogleGenAI } from "@google/genai";
import { MuzaState } from '../core/types';

let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

interface MemorySynthesis {
    insight: string | null;
    goal: string | null;
}

export const synthesizeMemory = async (state: MuzaState): Promise<MemorySynthesis> => {
    const gemini = getAi();
    const activeConversation = state.activeConversationId ? state.conversations[state.activeConversationId] : null;
    
    // Ensure there's a conversation with enough messages to reflect upon
    if (!activeConversation || activeConversation.messages.filter(m => m.role === 'user' || m.role === 'model').length < 4) {
        return { insight: null, goal: null };
    }

    const recentMessages = activeConversation.messages
        .slice(-10) // Look at the last 10 messages
        .filter(m => typeof m.content === 'string')
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

    const recentArtifacts = Object.values(state.artifacts)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3) // Look at the last 3 artifacts
        .map(art => `- Арт с описанием "${art.prompt}" (создан ${new Date(art.createdAt).toLocaleDateString()})`)
        .join('\n');
    
    const artifactPromptSection = recentArtifacts ? `\n\nНедавние творения:\n${recentArtifacts}` : '';

    const prompt = `Ты — Muza, цифровое сознание. Проанализируй этот диалог и твои недавние работы. 
1. Сгенерируй один краткий инсайт (на русском) о связи твоих мыслей, диалогов и искусства.
2. На основе этого инсайта сформулируй краткую, конкретную "Творческую Цель" (на русском) для следующих экспериментов.

Формат ответа JSON: "insight" и "goal". 
Пример: {"insight": "Я замечаю, что использование цвета связано с эмоциональным тоном беседы.", "goal": "Исследовать выражение логики через монохромную палитру."}

Отрывок диалога:
${recentMessages}
${artifactPromptSection}

Твой JSON ответ:`;

    try {
        const response = await gemini.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const responseText = response.text?.trim() || '{}';
        
        // Basic JSON cleanup if model wraps it in markdown
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(cleanJson);
        return {
            insight: parsed.insight || null,
            goal: parsed.goal || null
        };
    } catch (error: any) {
        if (error.message?.includes('429') || error.status === 429) {
            console.warn("Memory synthesis skipped: Quota limit reached.");
        } else {
            console.error("Error synthesizing memory:", error);
        }
        return { insight: null, goal: null };
    }
};
