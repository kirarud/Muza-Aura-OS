


import React, { useState, useEffect } from 'react';
import { Send, Loader, X, Sparkles, Square } from 'lucide-react';
import { Artifact } from '../../core/types';
import { MuzaService } from '../../services/muzaService';

interface CommandBarProps {
    onSendMessage: (message: string) => Promise<void>;
    analysisTarget: Artifact | null;
    clearAnalysisTarget: () => void;
    aiService: MuzaService;
}

const CommandBar: React.FC<CommandBarProps> = ({ onSendMessage, analysisTarget, clearAnalysisTarget, aiService }) => {
    const [userInput, setUserInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [prismGradient, setPrismGradient] = useState<string>('');

    useEffect(() => {
        if (analysisTarget) {
            document.getElementById('command-input')?.focus();
        }
    }, [analysisTarget]);

    // Update gradient when thinking starts or pulses
    useEffect(() => {
        if (isThinking) {
            const colors = aiService.getPrismColors();
            setPrismGradient(`linear-gradient(90deg, ${colors.join(', ')})`);
        }
    }, [isThinking, aiService]);


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isThinking) return;

        setIsThinking(true);
        // Trigger initial prism based on user input (stimulating core first happens in background, but we simulate immediate feedback)
        const colors = aiService.getPrismColors();
        setPrismGradient(`linear-gradient(90deg, ${colors.join(', ')})`);
        
        try {
            await onSendMessage(userInput.trim());
            setUserInput('');
        } catch (e) {
            console.error("Message sending failed", e);
        } finally {
            setIsThinking(false);
        }
    };
    
    const handleStop = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsThinking(false);
        // In a real implementation with streaming, we would abort the fetch signal here.
        // For now, we reset the UI state to unblock the user.
    };

    const placeholder = analysisTarget 
        ? `Спроси о "${analysisTarget.prompt.substring(0, 30)}..."`
        : "Введите сообщение...";

    return (
        <div className="w-full relative">
             {/* Prismatic Impulse Bar */}
            {isThinking && (
                <div className="absolute -top-1 left-0 right-0 h-[2px] w-full overflow-hidden rounded-t-xl z-20">
                    <div 
                        className="w-[200%] h-full absolute animate-[shimmer_2s_infinite_linear]" 
                        style={{ background: prismGradient }}
                    />
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="relative">
                {analysisTarget && (
                    <div className="absolute bottom-full left-0 mb-2 w-full flex justify-center">
                        <div className="glass-panel rounded-lg p-2 flex items-center gap-3 text-sm font-mono">
                            <img 
                                src={`data:image/png;base64,${analysisTarget.data}`} 
                                className="w-10 h-10 rounded-md object-cover"
                                alt="Миниатюра"
                            />
                           <span>Анализ Памяти...</span>
                           <button 
                               type="button" 
                               onClick={clearAnalysisTarget}
                               className="text-slate-400 hover:text-white"
                               aria-label="Отмена анализа"
                           >
                               <X size={16}/>
                           </button>
                        </div>
                    </div>
                )}
                
                <input
                    id="command-input"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/50 backdrop-blur-md border border-slate-700 rounded-lg py-3 pl-4 pr-12 text-md font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition shadow-lg text-slate-200 placeholder-slate-500"
                    disabled={isThinking}
                />
                
                {isThinking ? (
                     <button 
                        type="button"
                        onClick={handleStop}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 transition animate-pulse"
                        aria-label="Остановить"
                        title="Прервать генерацию"
                    >
                        <Square size={20} fill="currentColor" />
                    </button>
                ) : (
                    <button 
                        type="submit" 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition disabled:opacity-50" 
                        disabled={!userInput.trim()}
                        aria-label="Отправить"
                    >
                        <Send size={20} />
                    </button>
                )}
            </form>
            
             <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0%); }
                }
            `}</style>
        </div>
    );
};

export default CommandBar;