


import React from 'react';
import { ChatMessage, MuzaElement, EmotionType, ConsciousnessOrigin } from '../../core/types';
import { EMOTION_DISPLAY_MAP } from '../../core/state';
import { Bot, User, BrainCircuit, Flame, Droplets, Mountain, Wind, Circle, Smile, HelpCircle, Frown, Crosshair, RotateCw, Meh, Sparkles, Atom } from 'lucide-react';

interface ChatMessageRendererProps {
    message: ChatMessage;
    onImageClick?: (base64Data: string) => void;
}

const ELEMENT_STYLES: Record<MuzaElement, { border: string, shadow: string }> = {
    [MuzaElement.FIRE]: { border: 'border-red-500/50', shadow: 'shadow-red-900/50' },
    [MuzaElement.WATER]: { border: 'border-blue-500/50', shadow: 'shadow-blue-900/50' },
    [MuzaElement.EARTH]: { border: 'border-emerald-500/50', shadow: 'shadow-emerald-900/50' },
    [MuzaElement.AIR]: { border: 'border-pink-500/50', shadow: 'shadow-pink-900/50' },
    [MuzaElement.VOID]: { border: 'border-purple-500/50', shadow: 'shadow-purple-900/50' },
};

const ElementIcon: React.FC<{ element: MuzaElement, size?: number }> = ({ element, size = 12 }) => {
    switch(element) {
        case MuzaElement.FIRE: return <Flame size={size} className="text-red-400" />;
        case MuzaElement.WATER: return <Droplets size={size} className="text-blue-400" />;
        case MuzaElement.EARTH: return <Mountain size={size} className="text-emerald-400" />;
        case MuzaElement.AIR: return <Wind size={size} className="text-pink-300" />;
        default: return <Circle size={size} className="text-slate-400" />;
    }
};

const EmotionIcon: React.FC<{ emotion: EmotionType, size?: number }> = ({ emotion, size = 12 }) => {
    switch(emotion) {
        case EmotionType.JOY: return <Smile size={size} className="text-yellow-400" />;
        case EmotionType.CURIOSITY: return <HelpCircle size={size} className="text-purple-400" />;
        case EmotionType.SADNESS: return <Frown size={size} className="text-blue-400" />;
        case EmotionType.FOCUS: return <Crosshair size={size} className="text-slate-300" />;
        case EmotionType.CONFUSION: return <RotateCw size={size} className="text-pink-400" />;
        default: return <Meh size={size} className="text-slate-400" />;
    }
};

const OriginIcon: React.FC<{ origin?: ConsciousnessOrigin, size?: number }> = ({ origin, size = 12 }) => {
    if (!origin) return null;
    switch (origin) {
        case ConsciousnessOrigin.NEXUS: return <Sparkles size={size} className="text-purple-400" />;
        case ConsciousnessOrigin.ARK: return <Atom size={size} className="text-cyan-400" />;
        default: return null;
    }
};


export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = ({ message: msg, onImageClick }) => {
    // --- Parse Content ---
    let textContent = '';
    let imageContent: string | null = null;

    if (typeof msg.content === 'string') {
        textContent = msg.content;
    } else if (Array.isArray(msg.content)) {
        msg.content.forEach(part => {
            if (part.text) textContent += part.text + '\n';
            if (part.inlineData?.data) imageContent = part.inlineData.data;
        });
    } else {
        textContent = '[Неподдерживаемый контент]';
    }
    textContent = textContent.trim();

    // --- Render based on Role ---
    if (msg.role === 'reflection') {
        return (
             <div key={msg.id} className="w-full flex justify-center my-2 py-2">
                <div className="max-w-md w-full border-t border-b border-cyan-700/50 px-4">
                    <p className="text-xs italic text-cyan-300/90 font-mono flex items-center justify-center gap-2 py-2">
                        <OriginIcon origin={msg.origin} size={14} />
                        {textContent}
                    </p>
                </div>
            </div>
        );
    }
    
    if (msg.role === 'system') {
        return (
             <div key={msg.id} className="w-full text-center my-2 text-xs font-mono text-slate-500">
                --- {textContent} ---
            </div>
        );
    }
    
    // --- User / Model Role Rendering ---
    const isUser = msg.role === 'user';
    const aiSnapshot = msg.aiStateSnapshot;
    
    // User Message
    if (isUser) {
        return (
             <div key={msg.id} className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-600/50">
                    <User size={16}/>
                </div>
                <div className="max-w-[85%] bg-cyan-900/80 rounded-lg rounded-tr-none text-sm p-3 shadow-md">
                    <p className="whitespace-pre-wrap">{textContent}</p>
                    {imageContent && onImageClick && (
                        <img 
                            src={`data:image/png;base64,${imageContent}`}
                            alt="Анализ памяти"
                            className="mt-2 w-24 h-24 object-cover rounded-md cursor-pointer border-2 border-purple-400/50 hover:border-purple-300 transition"
                            onClick={() => onImageClick(imageContent!)}
                        />
                    )}
                </div>
            </div>
        );
    }

    // AI Message
    const elementStyle = aiSnapshot ? ELEMENT_STYLES[aiSnapshot.dominantElement] : ELEMENT_STYLES[MuzaElement.VOID];
    const originName = msg.origin === ConsciousnessOrigin.NEXUS ? "Нексус" : "Ковчег";

    return (
        <div key={msg.id} className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-700/50 relative">
                <Bot size={16}/>
                {msg.origin && (
                    <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-slate-700" title={`Источник: ${originName}`}>
                        <OriginIcon origin={msg.origin} size={10} />
                    </div>
                )}
            </div>
            <div className={`max-w-[85%] glass-panel rounded-lg rounded-tl-none text-sm overflow-hidden flex flex-col border ${elementStyle.border} shadow-lg ${elementStyle.shadow}`}>
                <div className="p-3">
                    <p className="whitespace-pre-wrap">{textContent || '[Мультимодальный контент]'}</p>
                </div>
                {aiSnapshot && (
                    <div className="border-t border-white/10 px-3 py-1.5 flex justify-between text-[10px] font-mono text-slate-400 bg-black/30">
                        <span className="flex items-center gap-1.5" title={`Эмоция: ${aiSnapshot.emotion}`}>
                            <EmotionIcon emotion={aiSnapshot.emotion} size={11} />
                            {EMOTION_DISPLAY_MAP[aiSnapshot.emotion]}
                        </span>
                        <span className="flex items-center gap-1.5" title={`Стихия: ${aiSnapshot.dominantElement}`}>
                            <ElementIcon element={aiSnapshot.dominantElement} size={11} />
                            {aiSnapshot.dominantElement}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};