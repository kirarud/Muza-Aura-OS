
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MuzaState, ToolCallHandler, BrushParams, SimulationParams, PaperParams, XPType, ConsciousnessType, ChatMessage } from '../../core/types';
import { EMOTION_COLOR_MAP, XP_MAP } from '../../core/state';
import { Ghost } from '../../services/dream/ghost';
import InkSimulation from '../../services/dream/inkSimulation';
import { OpticsEngine } from '../../services/dream/opticsEngine';
import { generatePaperTexture } from '../../services/dream/paper';
import { MuzaService } from '../../services/muzaService';
import { InteractionManager } from '../../services/dream/interactionManager';
import { generateUnifiedResponse } from '../../services/ai/unifiedResponse';

import ControlPanel from '../dream/ControlPanel';
import SettingsPill from '../dream/SettingsPill';
import VoiceStatus from '../dream/VoiceStatus';
import { Target, Sparkles, Eraser, Brain, Play, Wifi, WifiOff } from 'lucide-react';

type XpInfo = { type: XPType; amount: number };
type XpSource = keyof typeof XP_MAP;

interface DreamStudioProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    aiService: MuzaService;
    onGrantXp: (source: XpSource | XpInfo, optionalStateUpdater?: (s: MuzaState) => MuzaState) => void;
    toggleLog: () => void;
    thoughtKeywords: string[] | null;
    registerToolHandler: (handler: ToolCallHandler) => void;
    onSynthesizeMemory: () => Promise<void>;
    onNewLink: (nodes: [string, string]) => void;
    toggleVoice: () => void;
    openTaskRunner: (definition: { taskName: string; title: string; description: string; }) => void;
}

const IDLE_TIMEOUT = 12000;

const DreamStudio: React.FC<DreamStudioProps> = (props) => {
    const { muzaState, setMuzaState, aiService, onGrantXp, toggleLog, thoughtKeywords, registerToolHandler, onSynthesizeMemory, onNewLink, toggleVoice, openTaskRunner } = props;
    
    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paperCanvasRef = useRef<HTMLCanvasElement>(null);
    const opticsCanvasRef = useRef<HTMLCanvasElement>(null);
    
    // Engine Refs
    const simulationRef = useRef<InkSimulation | null>(null);
    const ghostRef = useRef<Ghost | null>(null);
    const opticsEngineRef = useRef<OpticsEngine | null>(null);
    const interactionManagerRef = useRef<InteractionManager | null>(null);
    const userActivityTimestamp = useRef<number>(Date.now());
    
    // Local State
    const [isUiVisible, setIsUiVisible] = useState(false); // Clean mode by default
    const [isInteracting, setIsInteracting] = useState(false);
    const [isDreamGenerationLoading, setIsDreamGenerationLoading] = useState(false);
    const [useProceduralOnly, setUseProceduralOnly] = useState(false); // New Offline Mode
    
    const { dreamStudio, consciousness, progression } = muzaState;
    const { brush, simulation, paper, aiStatus, isGhostEnabled } = dreamStudio;

    // --- State Updaters ---
    const updateDreamStudioState = (updater: (prevState: MuzaState) => Partial<typeof dreamStudio>) => {
        setMuzaState(s => s ? { ...s, dreamStudio: { ...s.dreamStudio, ...updater(s) } } : null);
    };

    const setBrush = (u: any) => { 
        userActivityTimestamp.current = Date.now(); 
        const newBrush = typeof u === 'function' ? u(brush) : u;
        updateDreamStudioState(s => ({ brush: newBrush })); 
        // Sync Interaction Manager immediately
        if (interactionManagerRef.current) interactionManagerRef.current.updateBrush(newBrush);
    };
    const setSimulation = (u: any) => updateDreamStudioState(s => ({ simulation: typeof u === 'function' ? u(s.dreamStudio.simulation) : u }));
    const setPaper = (u: any) => updateDreamStudioState(s => ({ paper: typeof u === 'function' ? u(s.dreamStudio.paper) : u }));
    const setAiStatus = useCallback((u: any) => updateDreamStudioState(s => ({ aiStatus: typeof u === 'function' ? u(s.dreamStudio.aiStatus) : u })), [setMuzaState]);

    // --- Tool Handler (The Bridge between AI and Canvas) ---
    const toolCallHandler: ToolCallHandler = useMemo(() => ({
        updateSimulation: (args) => setSimulation((s: any) => ({ ...s, ...args })),
        updatePaper: (args) => setPaper((p: any) => ({ ...p, ...args })),
        setColor: (args) => setBrush((b: any) => ({ ...b, color: args })),
        setBrush: (args) => setBrush((b: any) => ({ ...b, ...args })),
        controlApp: ({ command }) => {
            userActivityTimestamp.current = Date.now();
            if (command === 'clear') simulationRef.current?.clear();
            if (command === 'toggle_ui') setIsUiVisible(v => !v);
            if (command === 'toggle_ghost') updateDreamStudioState(s => ({ isGhostEnabled: !s.dreamStudio.isGhostEnabled }));
            if (command === 'toggle_log') toggleLog();
        },
        generateSketch: ({ path }) => ghostRef.current?.startSketch(path),
        saveCanvas: ({ description }) => {
            const data = canvasRef.current?.toDataURL('image/png').split(',')[1];
            if (data) {
                const artifact = { id: `art-${Date.now()}`, category: 'image', dataType: 'png', createdAt: Date.now(), data, prompt: description } as any;
                onGrantXp('IMAGE_GENERATED', s => ({ ...s, artifacts: { ...s.artifacts, [artifact.id]: artifact } }));
            }
        },
        pickColorFromCanvas: ({ x, y }) => { /* Implemented in InteractionManager, but mapped here for AI use */ },
        createCognitiveNode: (args) => aiService.createCognitiveNode(args),
        dream: ({ composition }) => {
            setAiStatus((s: any) => ({ ...s, isDreaming: true }));
            ghostRef.current?.startDream(composition);
            // Auto turn off dreaming status after a while
            setTimeout(() => setAiStatus((s: any) => ({ ...s, isDreaming: false })), 20000);
        },
        reflectOnMemories: async () => { await onSynthesizeMemory(); },
        setCreativeGoal: ({ goal }) => setMuzaState(s => s ? { ...s, consciousness: { ...s.consciousness, creativeGoal: goal } } : null),
        learnTechnique: ({ name, connections }) => {
            aiService.createCognitiveNode({ id: `proc:${name}`, type: ConsciousnessType.PROCEDURE, connections: connections || ['art'] });
            onGrantXp({ type: 'logic', amount: 20 });
        },
        runTask: ({ taskName, description }) => openTaskRunner({ taskName, title: 'Системная Задача', description }),
        unlockAchievement: () => {},
        dropLoot: () => {},
        tuneResonance: () => {}
    }), [setMuzaState, toggleLog, onGrantXp, aiService, onSynthesizeMemory, openTaskRunner]);

    useEffect(() => registerToolHandler(toolCallHandler), [toolCallHandler, registerToolHandler]);

    // --- Engine Initialization ---
    useEffect(() => {
        const resize = () => {
            if (!canvasRef.current || !paperCanvasRef.current || !opticsCanvasRef.current) return;
            const { width, height } = canvasRef.current.getBoundingClientRect();
            [canvasRef.current, paperCanvasRef.current, opticsCanvasRef.current].forEach(c => { c.width = width; c.height = height; });
            
            simulationRef.current?.resize(width, height);
            opticsEngineRef.current?.resize(width, height);
            
            const tex = generatePaperTexture(width, height, paper.roughness);
            paperCanvasRef.current.getContext('2d')?.drawImage(tex, 0, 0);
        };

        simulationRef.current = new InkSimulation(canvasRef.current!);
        opticsEngineRef.current = new OpticsEngine(opticsCanvasRef.current!);
        ghostRef.current = new Ghost(simulationRef.current, consciousness, brush, { width: window.innerWidth, height: window.innerHeight }, aiService);
        
        interactionManagerRef.current = new InteractionManager({
            canvas: canvasRef.current!,
            simulation: simulationRef.current!,
            aiService,
            brush,
            onGrantXp,
            onInteractionStart: () => setIsInteracting(true),
            onInteractionEnd: () => setIsInteracting(false),
        });

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []); // Run once on mount

    // --- Main Loop ---
    useEffect(() => {
        let frame: number;
        const loop = () => {
            if (ghostRef.current) {
                ghostRef.current.updateDependencies(consciousness, brush, { width: canvasRef.current!.width, height: canvasRef.current!.height }, aiService);
                if (isGhostEnabled) ghostRef.current.update();
            }
            simulationRef.current?.update();
            simulationRef.current?.render(brush.color);
            
            opticsEngineRef.current?.render(aiService.getNodes());
            frame = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frame);
    }, [isGhostEnabled, brush, consciousness, aiService]);

    // --- Idle / Daydream Logic ---
    useEffect(() => {
        const timer = setInterval(() => {
            if (isGhostEnabled && Date.now() - userActivityTimestamp.current > IDLE_TIMEOUT && !isInteracting && !aiStatus.isDreaming) {
                ghostRef.current?.startDaydreaming();
            } else if ((isInteracting || !isGhostEnabled) && !aiStatus.isDreaming) {
                ghostRef.current?.stopDaydreaming();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isInteracting, aiStatus.isDreaming, isGhostEnabled]);

    // --- Interactions ---
    const handleMouse = (e: React.MouseEvent, type: 'down'|'move'|'up') => {
        if (type === 'down') { userActivityTimestamp.current = Date.now(); interactionManagerRef.current?.handleMouseDown(e.nativeEvent); }
        else if (type === 'move') { userActivityTimestamp.current = Date.now(); interactionManagerRef.current?.handleMouseMove(e.nativeEvent); }
        else { interactionManagerRef.current?.handleMouseUp(); }
    };
    
    // --- Trigger AI Dream ---
    const handleManifestDream = async () => {
        setIsDreamGenerationLoading(true);
        userActivityTimestamp.current = Date.now();
        
        updateDreamStudioState(s => ({ isGhostEnabled: true }));
        setAiStatus((s: any) => ({ ...s, isDreaming: true }));
        
        // Always trigger procedural start for instant feedback
        ghostRef.current?.startDream([
            { type: 'background_wash', color_theme: 'vibrant', intensity: 0.8, description: 'Initialization burst' },
        ]);

        // If offline mode is enabled, or if we want to save quota, skip API
        if (useProceduralOnly) {
             // Add more procedural layers manually to simulate a complex dream
             setTimeout(() => {
                 ghostRef.current?.startDream([
                    { type: 'background_wash', color_theme: 'vibrant', intensity: 0.8, description: 'Procedural Wash' },
                    { type: 'focal_point', color_theme: 'vibrant', intensity: 1.0, description: 'Procedural Core' },
                    { type: 'accent_strokes', color_theme: 'vibrant', intensity: 0.9, description: 'Procedural Chaos' }
                 ]);
                 setIsDreamGenerationLoading(false);
                 setTimeout(() => setAiStatus((s: any) => ({ ...s, isDreaming: false })), 8000);
             }, 1000);
             return;
        }

        try {
            const promptMsg: ChatMessage = {
                id: `dream-trigger-${Date.now()}`,
                role: 'user',
                timestamp: Date.now(),
                content: "Начни процедуру 'dream' сейчас. Нарисуй абстракцию."
            };
            
            const response = await generateUnifiedResponse(muzaState, [promptMsg], toolCallHandler);
            
            // Check if response contains error message about quota
            if (response.responseText.includes('429') || response.responseText.includes('КВОТА')) {
                console.warn("API Quota hit during dream. Falling back to procedural.");
                setUseProceduralOnly(true); // Auto-switch to offline mode
                // Trigger procedural fallback
                ghostRef.current?.startDream([
                    { type: 'accent_strokes', color_theme: 'vibrant', intensity: 1.0, description: 'Fallback Energy' }
                ]);
            }

        } catch (e) {
            console.error("Dream generation failed, falling back to procedural", e);
        } finally {
            setIsDreamGenerationLoading(false);
            setTimeout(() => setAiStatus((s: any) => ({ ...s, isDreaming: false })), 5000);
        }
    };
    
    const clearCanvas = () => {
        simulationRef.current?.clear();
        onGrantXp({ type: 'logic', amount: 1 }); // Tiny reward for cleaning up
    };

    return (
        <div className="w-full h-full relative bg-[#111] overflow-hidden">
            {/* 1. Paper Layer (Texture) */}
            <canvas ref={paperCanvasRef} className="absolute inset-0 pointer-events-none opacity-80" />
            
            {/* 2. Ink Layer (Interactive) */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 cursor-crosshair active:cursor-none"
                onMouseDown={e => handleMouse(e, 'down')}
                onMouseMove={e => handleMouse(e, 'move')}
                onMouseUp={e => handleMouse(e, 'up')}
                onMouseLeave={e => handleMouse(e, 'up')}
            />
            
            {/* 3. Optics Layer (Neural Visualization Overlay) */}
            <canvas ref={opticsCanvasRef} className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60" />

            {/* 4. Creative Goal Indicator */}
            {consciousness.creativeGoal && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 glass-panel rounded-full h-8 px-4 flex items-center gap-2 text-xs font-mono text-purple-300 animate-fade-in pointer-events-none z-0 opacity-70">
                    <Sparkles size={12} />
                    <span>Цель: {consciousness.creativeGoal}</span>
                </div>
            )}
            
            {/* 5. Ghost Activity Indicator */}
            {isGhostEnabled && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none opacity-50 animate-pulse">
                    <Brain size={16} className="text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 font-mono tracking-widest">GHOST ACTIVE</span>
                </div>
            )}

            {/* 6. Controls */}
            <SettingsPill
                toggleUi={() => setIsUiVisible(!isUiVisible)}
                aiStatus={aiStatus}
                toggleVoice={toggleVoice}
                saveToVault={() => toolCallHandler.saveCanvas({ description: 'Сохранено пользователем' })}
                isGhostEnabled={isGhostEnabled}
                toggleGhost={() => updateDreamStudioState(s => ({ isGhostEnabled: !s.dreamStudio.isGhostEnabled }))}
                toggleLog={toggleLog}
            />
            <VoiceStatus status={aiStatus} />
            
            {/* Action Buttons (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto">
                 <div className="flex gap-4">
                     <button 
                        onClick={clearCanvas}
                        className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold"
                    >
                        <Eraser size={14} /> Очистить
                    </button>
                    
                    <button 
                        onClick={handleManifestDream}
                        disabled={isDreamGenerationLoading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all shadow-lg text-xs font-bold uppercase tracking-wider
                            ${isDreamGenerationLoading 
                                ? 'bg-purple-900/50 border-purple-500/30 text-purple-300 cursor-wait' 
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 border-transparent text-white hover:scale-105 hover:shadow-purple-500/50'}
                        `}
                    >
                        {isDreamGenerationLoading ? (
                            <><Sparkles size={14} className="animate-spin" /> Генерирую...</>
                        ) : (
                            <><Play size={14} fill="currentColor" /> Сновидение</>
                        )}
                    </button>
                </div>
                
                {/* Offline Toggle */}
                <button 
                    onClick={() => setUseProceduralOnly(!useProceduralOnly)}
                    className={`flex items-center gap-2 text-[10px] font-mono transition-colors ${useProceduralOnly ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {useProceduralOnly ? <WifiOff size={10} /> : <Wifi size={10} />}
                    {useProceduralOnly ? "РЕЖИМ: ПРОЦЕДУРНЫЙ (ОФЛАЙН)" : "РЕЖИМ: НЕЙРОСЕТЬ (ОНЛАЙН)"}
                </button>
            </div>
            
            {isUiVisible && (
                <ControlPanel 
                    brush={brush} setBrush={setBrush}
                    simulation={simulation} setSimulation={setSimulation}
                    paper={paper} setPaper={setPaper}
                    unlockedSkills={progression.unlockedSkills}
                />
            )}
        </div>
    );
};

export default DreamStudio;
