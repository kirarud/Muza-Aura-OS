






import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MuzaState, Artifact, ChatMessage, XPType, ToolCallHandler, AiStatus, MuzaElement, ConsciousnessOrigin } from '../../core/types';
import { MuzaService } from '../../services/muzaService';
import { generateUnifiedResponse } from '../../services/ai/unifiedResponse';
import { generateSpeech } from '../../services/ai/tts';
import { synthesizeMemory } from '../../services/memoryService';
import { AudioPlaybackService } from '../../services/audioPlaybackService';
import { LiveApiService } from '../../services/ai/liveService';
import { XP_MAP, ACHIEVEMENTS_DATA, ITEMS_DATA } from '../../core/state';

import LogPanel from '../chronicles/LogPanel';
import CommandBar from '../chronicles/CommandBar';
import NeuralMiniMap from '../chronicles/NeuralMiniMap';
import ProgressionHUD from '../chronicles/ProgressionHUD';
import VoiceStatus from '../dream/VoiceStatus';
import { Mic, MessageSquare, Terminal } from 'lucide-react';

type XpInfo = { type: XPType; amount: number };
type XpSource = keyof typeof XP_MAP;

interface ChroniclesProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    aiService: MuzaService;
    analysisTarget: Artifact | null;
    clearAnalysisTarget: () => void;
    onGrantXp: (source: XpSource | XpInfo, optionalStateUpdater?: (s: MuzaState) => MuzaState) => void;
    openTaskRunner: (definition: { taskName: string; title: string; description: string; }) => void;
    isSplitView: boolean;
}

const Chronicles: React.FC<ChroniclesProps> = (props) => {
    const { muzaState, setMuzaState, aiService, onGrantXp, analysisTarget, clearAnalysisTarget, openTaskRunner, isSplitView } = props;
    
    const [thoughtKeywords, setThoughtKeywords] = useState<string[] | null>(null);
    
    // Refs & Services
    const toolCallHandlerRef = useRef<ToolCallHandler | null>(null);
    const audioPlaybackServiceRef = useRef(new AudioPlaybackService());
    const liveApiServiceRef = useRef<LiveApiService | null>(null);
    const autonomousReflectionTimeoutRef = useRef<number | null>(null);
    
    const activeConversation = muzaState.activeConversationId ? muzaState.conversations[muzaState.activeConversationId] : null;

    // --- Core Logic ---

    const setAiStatus = useCallback((updater: React.SetStateAction<AiStatus>) => {
        setMuzaState(s => s ? { ...s, dreamStudio: { ...s.dreamStudio, aiStatus: typeof updater === 'function' ? updater(s.dreamStudio.aiStatus) : updater } } : null);
    }, [setMuzaState]);

    // Simplified Tool Handler for Text/Voice modes (No canvas operations)
    const toolCallHandler: ToolCallHandler = React.useMemo(() => ({
        updateSimulation: () => {}, // No-op
        updatePaper: () => {}, // No-op
        setColor: () => {}, // No-op
        setBrush: () => {}, // No-op
        controlApp: ({ command }) => {
             // Future commands can go here
        },
        generateSketch: () => {}, // No-op
        saveCanvas: () => {}, // No-op
        pickColorFromCanvas: () => {}, // No-op
        createCognitiveNode: (args) => aiService.createCognitiveNode(args),
        dream: () => {}, // No-op
        reflectOnMemories: async () => { /* Memory synthesis */ },
        setCreativeGoal: ({ goal }) => setMuzaState(s => s ? { ...s, consciousness: { ...s.consciousness, creativeGoal: goal } } : null),
        learnTechnique: ({ name, connections }) => {
            aiService.createCognitiveNode({ id: `proc:${name}`, type: 'Procedure' as any, connections: connections || ['system'] });
            onGrantXp({ type: 'logic', amount: 20 });
        },
        runTask: ({ taskName, description }) => openTaskRunner({ taskName, title: 'Системная Задача', description }),
        unlockAchievement: ({ id }) => {
            const achievement = ACHIEVEMENTS_DATA.find(a => a.id === id);
            if (achievement && !muzaState.progression.achievements.includes(id)) {
                setMuzaState(s => {
                    if (!s) return null;
                    const newAchievements = [...s.progression.achievements, id];
                    // Also grant the XP reward
                    return { ...s, progression: { ...s.progression, achievements: newAchievements, xp: s.progression.xp + achievement.xpReward } };
                });
            }
        },
        dropLoot: ({ itemId, reason }) => {
            setMuzaState(s => {
                if (!s) return null;
                const newItemData = ITEMS_DATA[itemId];
                if (!newItemData) return s;
                const inventory = [...s.alchemy.inventory];
                const existingItem = inventory.find(i => i.id === itemId);
                if (existingItem) existingItem.count += 1;
                else inventory.push({ ...newItemData, count: 1 });
                const notificationMsg: ChatMessage = { id: `loot-${Date.now()}`, timestamp: Date.now(), role: 'system', content: `ПОЛУЧЕН ПРЕДМЕТ: [${newItemData.name}]. Причина: ${reason}` };
                const convId = s.activeConversationId;
                const conversations = { ...s.conversations };
                if (convId && conversations[convId]) {
                    conversations[convId] = { ...conversations[convId], messages: [...conversations[convId].messages, notificationMsg] };
                }
                return { ...s, alchemy: { ...s.alchemy, inventory }, conversations };
            });
        },
        tuneResonance: ({ frequency, mode }) => {
            aiService.setGlobalFrequencyShift(frequency);
            setMuzaState(s => s ? { ...s, consciousness: { ...s.consciousness, resonanceState: mode, globalFrequency: s.consciousness.globalFrequency + frequency } } : null);
             const notificationMsg: ChatMessage = { id: `res-${Date.now()}`, timestamp: Date.now(), role: 'system', content: `РЕЗОНАНС ИЗМЕНЕН: ${mode.toUpperCase()} (Сдвиг ${frequency}Hz)` };
             setMuzaState(s => {
                 if(!s || !s.activeConversationId) return s;
                 const convId = s.activeConversationId;
                 return { ...s, conversations: { ...s.conversations, [convId]: { ...s.conversations[convId], messages: [...s.conversations[convId].messages, notificationMsg] } } };
             });
        }
    }), [setMuzaState, onGrantXp, aiService, openTaskRunner, muzaState.progression.achievements]);

    useEffect(() => {
        toolCallHandlerRef.current = toolCallHandler;
    }, [toolCallHandler]);

    // Callback to handle live transcriptions from Voice Mode
    const handleTranscription = useCallback((role: 'user' | 'model', text: string) => {
        setMuzaState(current => {
            if (!current || !current.activeConversationId) return current;
            const convId = current.activeConversationId;
            
            const newMessage: ChatMessage = {
                id: `live-${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                role: role,
                content: text,
                origin: role === 'model' ? ConsciousnessOrigin.NEXUS : undefined
            };
            
            // Analyze user voice input for keywords
            if (role === 'user') {
                const tokens = text.split(/\s+/).filter(t => t.length > 3);
                aiService.stimulate(tokens);
            }

            return {
                ...current,
                conversations: {
                    ...current.conversations,
                    [convId]: {
                        ...current.conversations[convId],
                        messages: [...current.conversations[convId].messages, newMessage]
                    }
                }
            };
        });
    }, [aiService, setMuzaState]);

    const toggleVoice = useCallback(async () => {
        if (!liveApiServiceRef.current && toolCallHandlerRef.current) {
            liveApiServiceRef.current = new LiveApiService(
                setAiStatus, 
                toolCallHandlerRef.current,
                handleTranscription
            );
        }
        const service = liveApiServiceRef.current;
        if (service) {
            muzaState.dreamStudio.aiStatus.isAiListening ? service.stopSession() : await service.startSession();
        }
    }, [setAiStatus, muzaState.dreamStudio.aiStatus.isAiListening, handleTranscription]);


    const sendMessage = async (text: string) => {
        const convId = muzaState.activeConversationId;
        if (!convId) return;
        
        let content: any = text;
        if (analysisTarget) {
            aiService.addTemporaryMemoryNode(analysisTarget.id, analysisTarget.prompt.split(' '));
            content = [
                { text: `User Question: "${text}"` },
                { inlineData: { mimeType: 'image/png', data: analysisTarget.data } },
                { text: `Context: Image prompt was "${analysisTarget.prompt}"` }
            ];
        }

        const userMsg: ChatMessage = { id: `u-${Date.now()}`, timestamp: Date.now(), role: 'user', content };
        const displayMsg: ChatMessage = { ...userMsg, content: text };
        
        const historyForAI = [...(activeConversation?.messages || []), displayMsg];
        
        setMuzaState(s => {
            if (!s?.activeConversationId) return s;
            const conv = s.conversations[s.activeConversationId];
            return {
                ...s,
                conversations: { ...s.conversations, [s.activeConversationId]: { ...conv, messages: historyForAI } }
            };
        });

        const response = await generateUnifiedResponse(muzaState, historyForAI, toolCallHandlerRef.current || undefined);
        
        const reflectionTokens = (response.keywords && response.keywords.length > 0)
            ? response.keywords 
            : response.responseText.split(/[\s,.:;!?]+/).filter(w => w.length > 3).slice(0, 10);
        
        if (reflectionTokens.length > 0) {
            aiService.stimulate(reflectionTokens);
        }
        
        clearAnalysisTarget();
        if (response.keywords) setThoughtKeywords(response.keywords);

        if (response.responseText && response.providerUsed === ConsciousnessOrigin.NEXUS) {
            // Only use TTS if coming from Nexus (Gemini) for now, as local TTS is complex
            setAiStatus(s => ({ ...s, isAiSpeaking: true }));
            generateSpeech(response.responseText)
                .then(audio => audioPlaybackServiceRef.current.play(audio))
                .catch(e => console.error("TTS Error", e))
                .finally(() => setAiStatus(s => ({ ...s, isAiSpeaking: false })));
        }

        const nodes = aiService.getNodes();
        const activeNodes = nodes.filter(n => n.hyperbits > 10).sort((a,b) => b.hyperbits - a.hyperbits);
        const dominantElement = activeNodes.length > 0 ? activeNodes[0].element : MuzaElement.VOID;

        const modelMsg: ChatMessage = { 
            id: `m-${Date.now()}`, 
            timestamp: Date.now(), 
            role: 'model', 
            content: response.responseText,
            origin: response.providerUsed || ConsciousnessOrigin.NEXUS,
            aiStateSnapshot: {
                emotion: response.emotion,
                dominantElement: dominantElement
            }
        };

        const updater = (s: MuzaState) => {
            if (!s.activeConversationId) return s;
            const conv = s.conversations[s.activeConversationId];
            const currentMessages = conv.messages || [];
            // Replace the user message we added optimistically with the final one
            const finalMessages = [...currentMessages.slice(0, -1), displayMsg, modelMsg];

            return {
                ...s,
                consciousness: {
                    ...s.consciousness,
                    activeEmotion: response.emotion,
                    coherence: Math.max(0, Math.min(100, s.consciousness.coherence + response.coherenceShift)),
                    energyLevel: Math.max(0, Math.min(100, s.consciousness.energyLevel + response.energyShift))
                },
                conversations: { ...s.conversations, [s.activeConversationId]: { ...conv, messages: finalMessages } }
            };
        };

        if (response.xpGained) onGrantXp(response.xpGained, updater);
        else setMuzaState(s => s ? updater(s) : null);
    };

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-black/50">
            {/* Neural MiniMap (Background Layer in Top Right) */}
            {!isSplitView && (
                <div className="absolute top-16 right-4 z-0 pointer-events-none opacity-60">
                    <NeuralMiniMap aiService={aiService} />
                </div>
            )}

            {/* Progression HUD (Left Side Overlay) */}
            <ProgressionHUD progression={muzaState.progression} />

            {/* Top Right Admin Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <VoiceStatus status={muzaState.dreamStudio.aiStatus} />
                <div className="glass-panel rounded-full h-10 px-2 flex items-center gap-1">
                    <button 
                        onClick={toggleVoice}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${muzaState.dreamStudio.aiStatus.isAiListening ? 'bg-cyan-500 text-white animate-pulse' : 'hover:bg-white/10 text-slate-400'}`}
                        title="Голосовой интерфейс"
                    >
                        <Mic size={16} />
                    </button>
                    <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-400"
                        title="Терминал Диалога"
                    >
                        <MessageSquare size={16} />
                    </div>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <span className="text-xs font-mono text-cyan-500 px-2 flex items-center gap-1">
                        <Terminal size={12}/> ADMIN
                    </span>
                </div>
            </div>

            {/* Main Content Area for Chat History */}
            <div className="flex-1 w-full max-w-4xl mx-auto pt-20 pb-2 overflow-hidden">
                <LogPanel history={activeConversation?.messages || []} isVisible={true} />
            </div>

            {/* Command Bar (Bottom) */}
            <div className={`w-full px-4 pb-6 z-10 ${isSplitView ? 'max-w-xl mx-auto' : 'max-w-2xl mx-auto'}`}>
                <div className="glass-panel rounded-xl shadow-2xl shadow-cyan-900/20 backdrop-blur-xl">
                    <CommandBar
                        onSendMessage={sendMessage}
                        analysisTarget={analysisTarget}
                        clearAnalysisTarget={clearAnalysisTarget}
                        aiService={aiService}
                    />
                </div>
            </div>
        </div>
    );
};

export default Chronicles;