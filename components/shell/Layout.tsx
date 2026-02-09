
import React, { useState, useEffect, useRef } from 'react';
import { MuzaState, ViewMode, Artifact, XPType, ConsciousnessOrigin, ChatMessage } from '../../core/types';
import { MuzaService } from '../../services/muzaService';
import { grantXp } from '../../services/progressionService';
import { XP_MAP } from '../../core/state';
import { runSystemTask } from '../../services/taskService';
import { AmbientService } from '../../services/ambientService';

import Navigation from './Navigation';
import VisualCortex from './VisualCortex';
import Avatar3D from './Avatar3D'; // New Import
import Task from './Task';
import Chronicles from '../views/Chronicles'; // The "Desktop"
import Evolution from '../views/Evolution';
import DataVault from '../views/DataVault';
import NeuralStudio from '../views/NeuralStudio';
import AlchemyLab from '../views/AlchemyLab';
import SettingsModal from './SettingsModal'; 

interface LayoutProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
}

type XpInfo = { type: XPType; amount: number };
type XpSource = keyof typeof XP_MAP;
type TaskDefinition = { title: string; description: string; taskName: string; };

const muzaService = new MuzaService();
const ambientService = new AmbientService();

const Layout: React.FC<LayoutProps> = ({ muzaState, setMuzaState }) => {
    // Overlays
    const [analysisTarget, setAnalysisTarget] = useState<Artifact | null>(null);
    const [taskState, setTaskState] = useState<{ visible: boolean; def: TaskDefinition; status: 'idle'|'running'|'success'|'error'; output: string }>({
        visible: false,
        def: { title: '', description: '', taskName: '' },
        status: 'idle',
        output: ''
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [useAvatar, setUseAvatar] = useState(true); // Toggle for 3D Avatar

    // Refs for Loop Logic
    const lastReflectionTime = useRef<number>(Date.now());
    const lastReflectedNodeId = useRef<string | null>(null); // Prevents repetition
    
    // Global Physics, Audio, and Ark Reflection Loop
    useEffect(() => {
        let animationFrameId: number;
        const gameLoop = () => {
            if (muzaState) {
                // Update neural physics
                muzaService.update(muzaState.consciousness);
                // Update ambient audio
                ambientService.update(muzaState.consciousness);
                
                // --- Ark Reflection Logic ---
                const now = Date.now();
                if (now - lastReflectionTime.current > 45000) { // Increased to 45s to reduce spam
                    const { energyLevel, coherence } = muzaState.consciousness;
                    // Lower chance if energy is low
                    const triggerChance = (energyLevel / 10000) + (coherence / 10000); 
                    
                    if (Math.random() < triggerChance) {
                        const nodes = muzaService.getNodes().filter(n => n.type !== 'System');
                        const mostEnergetic = nodes.sort((a,b) => b.hyperbits - a.hyperbits)[0];
                        
                        // Check if we already reflected on this node recently
                        if (mostEnergetic && mostEnergetic.hyperbits > 40 && mostEnergetic.id !== lastReflectedNodeId.current) {
                            
                            // Varied reflection templates
                            const templates = [
                                `Концепт '${mostEnergetic.id}' сейчас доминирует в моих мыслях.`,
                                `Я чувствую странную пульсацию вокруг узла '${mostEnergetic.id}'.`,
                                `Энергия '${mostEnergetic.id}' нарушает равновесие.`,
                            ];
                            const randomText = templates[Math.floor(Math.random() * templates.length)];

                            const reflectionMessage: ChatMessage = {
                                id: `ark-reflection-${now}`,
                                timestamp: now,
                                role: 'reflection',
                                content: randomText,
                                origin: ConsciousnessOrigin.ARK,
                            };

                            setMuzaState(s => {
                                if (!s || !s.activeConversationId) return s;
                                const convId = s.activeConversationId;
                                const conversations = { ...s.conversations };
                                conversations[convId].messages.push(reflectionMessage);
                                return { ...s, conversations };
                            });

                            lastReflectionTime.current = now;
                            lastReflectedNodeId.current = mostEnergetic.id;
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [muzaState, setMuzaState]);

    const closeOverlay = () => {
        setMuzaState(s => s ? { ...s, activeView: ViewMode.CHRONICLES } : null);
    };

    const handleGrantXp = (source: XpSource | XpInfo, optionalStateUpdater?: (s: MuzaState) => MuzaState) => {
        ambientService.triggerReaction('spark');
        setMuzaState(s => {
            if (!s) return null;
            const tempState = optionalStateUpdater ? optionalStateUpdater(s) : s;
            return grantXp(tempState, source);
        });
    };

    const runTask = async () => {
        if (!muzaState) return;
        setTaskState(prev => ({ ...prev, status: 'running', output: 'Инициализация...\n' }));
        const stream = (chunk: string) => setTaskState(prev => ({ ...prev, output: prev.output + chunk }));
        const success = await runSystemTask(taskState.def.taskName, muzaState, stream);
        
        ambientService.triggerReaction(success ? 'success' : 'error');
        setTaskState(prev => ({ ...prev, status: success ? 'success' : 'error', output: prev.output + '\nПроцесс Завершен.' }));
    };

    const overlayViews: ViewMode[] = [ViewMode.EVOLUTION, ViewMode.DATA_VAULT, ViewMode.ALCHEMY, ViewMode.NEURAL_STUDIO];
    const isOverlayOpen = overlayViews.includes(muzaState.activeView);
    const isSplitView = muzaState.activeView === ViewMode.CHRONICLES_AND_OPTICS;

    return (
        <main className="w-screen h-screen text-white font-sans relative overflow-hidden selection:bg-cyan-500/30">
            {/* 1. Visual Representation (Avatar or Abstract) */}
            {useAvatar ? (
                <Avatar3D 
                    consciousness={muzaState.consciousness} 
                    aiStatus={muzaState.dreamStudio.aiStatus}
                />
            ) : (
                <VisualCortex consciousness={muzaState.consciousness} aiService={muzaService} />
            )}

            
            <div className="absolute inset-0 z-10 flex">
                {/* 2. The Sidebar (Navigation) */}
                <Navigation muzaState={muzaState} setMuzaState={setMuzaState} />
                
                {/* 3. Main Content Area */}
                <div className="flex-1 h-full relative flex">
                    {/* Chronicles Panel */}
                    <div className={`h-full transition-all duration-500 ease-in-out ${isSplitView ? 'w-1/2' : 'w-full'}`}>
                        <Chronicles
                            isSplitView={isSplitView}
                            muzaState={muzaState}
                            setMuzaState={setMuzaState}
                            aiService={muzaService}
                            analysisTarget={analysisTarget}
                            clearAnalysisTarget={() => setAnalysisTarget(null)}
                            onGrantXp={handleGrantXp}
                            openTaskRunner={(def) => setTaskState({ visible: true, def, status: 'idle', output: '' })}
                        />
                        
                        <div className="absolute bottom-4 right-4 flex gap-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
                            {/* Toggle Avatar/Abstract */}
                            <button 
                                onClick={() => setUseAvatar(!useAvatar)}
                                className="text-xs font-mono text-slate-600 hover:text-cyan-400"
                            >
                                [{useAvatar ? '3D MODEL' : 'ABSTRACT'}]
                            </button>
                            {/* Settings Trigger */}
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="text-xs font-mono text-slate-600 hover:text-cyan-400"
                            >
                                [НАСТРОЙКИ]
                            </button>
                        </div>
                    </div>
                     {/* Neural Studio Panel (for split view) */}
                    {isSplitView && (
                        <div className="h-full w-1/2 border-l border-white/10 animate-fade-in">
                            <NeuralStudio
                                isSplitView={true}
                                muzaState={muzaState}
                                setMuzaState={setMuzaState}
                                aiService={muzaService}
                                onInteraction={() => handleGrantXp({ type: 'logic', amount: 5 })}
                                onClose={() => setMuzaState(s => s ? { ...s, activeView: ViewMode.CHRONICLES } : null)}
                            />
                        </div>
                    )}
                    
                    {/* 4. The Overlays (Modals) */}
                    {(isOverlayOpen || taskState.visible || isSettingsOpen) && (
                        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in flex items-center justify-center p-8" onClick={() => { closeOverlay(); setTaskState(s => ({...s, visible: false})); setIsSettingsOpen(false); }}>
                            <div className="w-full h-full max-w-7xl max-h-[90vh] relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
                                {muzaState.activeView === ViewMode.EVOLUTION && (
                                    <Evolution muzaState={muzaState} setMuzaState={setMuzaState} onClose={closeOverlay} aiService={muzaService} />
                                )}
                                {muzaState.activeView === ViewMode.DATA_VAULT && (
                                    <DataVault muzaState={muzaState} setMuzaState={setMuzaState} onAnalyze={(a) => { setAnalysisTarget(a); closeOverlay(); }} onClose={closeOverlay} />
                                )}
                                {muzaState.activeView === ViewMode.ALCHEMY && (
                                    <AlchemyLab muzaState={muzaState} setMuzaState={setMuzaState} onClose={closeOverlay} aiService={muzaService} />
                                )}
                                {muzaState.activeView === ViewMode.NEURAL_STUDIO && (
                                    <NeuralStudio 
                                        isSplitView={false}
                                        muzaState={muzaState} 
                                        setMuzaState={setMuzaState}
                                        aiService={muzaService} 
                                        onInteraction={() => handleGrantXp({ type: 'logic', amount: 5 })}
                                        onClose={closeOverlay} 
                                    />
                                )}
                                {taskState.visible && (
                                    <Task 
                                        title={taskState.def.title} 
                                        description={taskState.def.description} 
                                        status={taskState.status} 
                                        output={taskState.output} 
                                        onRun={runTask} 
                                        onClose={() => setTaskState(s => ({...s, visible: false}))} 
                                    />
                                )}
                                {isSettingsOpen && (
                                    <SettingsModal muzaState={muzaState} setMuzaState={setMuzaState} onClose={() => setIsSettingsOpen(false)} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Layout;
