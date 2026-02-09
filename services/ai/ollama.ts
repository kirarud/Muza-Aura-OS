

import { ChatMessage } from '../../core/types';

const OLLAMA_HOST = 'http://localhost:11434';

export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

export const generateOllamaResponse = async (
    model: string,
    messages: ChatMessage[],
    systemInstruction: string
): Promise<string> => {
    
    // Convert ChatMessage to Ollama format
    const formattedMessages = [
        { role: 'system', content: systemInstruction },
        ...messages
            .filter(m => m.role === 'user' || m.role === 'model')
            .map(m => ({
                role: m.role === 'model' ? 'assistant' : m.role,
                content: typeof m.content === 'string' ? m.content : '[Multimedia content]' 
            }))
    ];

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: formattedMessages,
                stream: false, // For simplicity in this version, no streaming
                options: {
                    temperature: 0.8,
                    top_k: 40,
                    top_p: 0.9,
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data: OllamaResponse = await response.json();
        return data.message.content;

    } catch (error) {
        console.error("Failed to connect to Ark Core (Ollama):", error);
        throw error;
    }
};
