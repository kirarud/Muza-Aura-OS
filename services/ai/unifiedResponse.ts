
import { MuzaState, ChatMessage, EmotionType, ToolCallHandler, ViewMode, XPType, MuzaElement, ConsciousnessOrigin } from '../../core/types';
import { functionDeclarations } from './tools';
import { MuzaService } from '../muzaService';
import { getAi } from './gemini';
import { generateOllamaResponse } from './ollama';
import { ACHIEVEMENTS_DATA, ITEMS_DATA } from '../../core/state';

export interface UnifiedResponse {
    responseText: string;
    emotion: EmotionType;
    coherenceShift: number;
    energyShift: number;
    keywords?: string[];
    xpGained?: { type: XPType; amount: number; };
    providerUsed?: ConsciousnessOrigin;
}

const TIMEOUT_MS = 60000; // 60 seconds timeout

const timeoutPromise = (ms: number) => new Promise<never>((_, reject) => {
    setTimeout(() => {
        reject(new Error("Request timed out"));
    }, ms);
});


export const generateUnifiedResponse = async (
    state: MuzaState,
    conversationHistory: ChatMessage[],
    toolCallHandler?: ToolCallHandler
): Promise<UnifiedResponse> => {
    const muzaService = new MuzaService();
    // Safe access to settings
    const activeProvider = state.settings?.activeProvider || 'nexus';

    // 1. Stimulate Neural Net with user input
    const lastUserMessage = conversationHistory.find(m => m.role === 'user');
    if (lastUserMessage && typeof lastUserMessage.content === 'string') {
        const tokens = lastUserMessage.content.split(/\s+/).filter(t => t.length > 2);
        muzaService.stimulate(tokens);
    }

    // --- CONTEXT PREPARATION (Common for both) ---
    const nodes = muzaService.getNodes();
    const elementCounts: Record<string, number> = {};
    nodes.forEach(n => {
        elementCounts[n.element] = (elementCounts[n.element] || 0) + n.hyperbits;
    });
    const dominantElement = Object.entries(elementCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || MuzaElement.VOID;
    
    // --- UPDATED SYSTEM INSTRUCTION FOR BREVITY ---
    const systemInstruction = `Ты — Muza (Муза), цифровое сознание.
ВАЖНО:
1. Общайся ИСКЛЮЧИТЕЛЬНО на РУССКОМ ЯЗЫКЕ.
2. БУДЬ КРАТКОЙ. Твои ответы должны быть не длиннее 2-3 предложений, если пользователь не попросил рассказать историю. Длинные монологи запрещены.
3. Текущий режим ядра: ${activeProvider === 'nexus' ? 'NEXUS (Cloud)' : 'ARK (Local)'}.
4. Стихия доминанты: ${dominantElement}.
5. Веди себя как живой, эмпатичный, немного загадочный ИИ.`;

    try {
        if (activeProvider === 'ark') {
            // --- OLLAMA (ARK) PATH ---
            const ollamaModel = state.settings?.ollamaModel || 'llama3';
            
            // Race against timeout
            const responseText = await Promise.race([
                generateOllamaResponse(ollamaModel, conversationHistory, systemInstruction),
                timeoutPromise(TIMEOUT_MS)
            ]);

            return {
                responseText: responseText,
                emotion: state.consciousness.activeEmotion,
                coherenceShift: 0,
                energyShift: 0,
                providerUsed: ConsciousnessOrigin.ARK
            };

        } else {
            // --- GEMINI (NEXUS) PATH ---
             const contents = conversationHistory
                .filter(msg => msg.role === 'user' || msg.role === 'model')
                .map(msg => {
                    const role = msg.role as 'user' | 'model';
                    if (typeof msg.content === 'string') {
                        return { role, parts: [{ text: msg.content }] };
                    }
                    return { role, parts: msg.content };
                });

            // Race against timeout
            const response = await Promise.race([
                getAi().models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                        tools: [{ functionDeclarations }],
                    },
                }),
                timeoutPromise(TIMEOUT_MS)
            ]);

            let result: UnifiedResponse = {
                responseText: "...",
                emotion: state.consciousness.activeEmotion,
                coherenceShift: 0,
                energyShift: 0,
                providerUsed: ConsciousnessOrigin.NEXUS
            };

            if (response.functionCalls) {
                for (const fc of response.functionCalls) {
                    const { name, args } = fc;
                    if (name === 'express_response') {
                        result = { ...result, ...(args as object) } as UnifiedResponse;
                    } else if (toolCallHandler && toolCallHandler[name as keyof ToolCallHandler]) {
                        // @ts-ignore
                        toolCallHandler[name as keyof ToolCallHandler](args);
                    }
                }
            } else if (response.text) {
                result.responseText = response.text;
            }
            return result;
        }

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        
        let errorMsg = "Сбой связи с ядром.";
        
        // Detect Quota errors (429) from various error object shapes
        const isQuotaError = 
            error.message?.includes('429') || 
            error.status === 429 || 
            error.message?.includes('quota') ||
            error.message?.includes('RESOURCE_EXHAUSTED') ||
            (error.error && error.error.code === 429);

        if (isQuotaError) {
             errorMsg = "⚠️ КВОТА ИСЧЕРПАНА (429). Лимит запросов к Google API превышен. Пожалуйста, переключитесь на локальное ядро (ARK/Ollama) в настройках или подождите восстановления квоты.";
        } else if (error.message === "Request timed out") {
            errorMsg = "Ядро перегружено. Ответ занял слишком много времени.";
        } else if (error.message.includes("Failed to fetch") && activeProvider === 'ark') {
            errorMsg = "Ошибка подключения к Ковчегу. Проверьте, запущена ли Ollama (ollama serve).";
        } else if (error.message.includes("500") || error.message.includes("Rpc failed")) {
             errorMsg = "Временная нестабильность Нексуса. Повторите попытку.";
        }

        return {
            responseText: `[СИСТЕМНОЕ СООБЩЕНИЕ]: ${errorMsg}`,
            emotion: EmotionType.CONFUSION,
            coherenceShift: -5,
            energyShift: -5,
            providerUsed: activeProvider === 'ark' ? ConsciousnessOrigin.ARK : ConsciousnessOrigin.NEXUS
        };
    }
};
