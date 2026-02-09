
import React, { useEffect, useRef, useState } from 'react';
import { MuzaState, MuzaAINode, ConsciousnessType, VisualTheme, MuzaElement } from '../../core/types';
import { MuzaService, ELEMENT_COLORS } from '../../services/muzaService';
import { X, Rotate3d, Atom, Zap, Maximize, Palette } from 'lucide-react';

interface NeuralStudioProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    aiService: MuzaService;
    onInteraction: () => void;
    onClose: () => void;
    isSplitView: boolean; // Controls expanded/compact mode
}

type DisplayPoint = MuzaAINode & {
    rotatedX: number;
    rotatedY: number;
    rotatedZ: number;
    screenX: number;
    screenY: number;
    scale: number;
    isGhost?: boolean;
};

const THEMES: Record<VisualTheme, Record<MuzaElement, string>> = {
    aura: ELEMENT_COLORS,
    glitch: {
        [MuzaElement.FIRE]: '#ff003c', // Bright Red
        [MuzaElement.WATER]: '#00ff41', // Bright Green
        [MuzaElement.EARTH]: '#00ffff', // Bright Cyan
        [MuzaElement.AIR]: '#ffff00', // Bright Yellow
        [MuzaElement.VOID]: '#ff00ff', // Bright Magenta
    },
    monochrome: {
        [MuzaElement.FIRE]: '#E0E0E0',
        [MuzaElement.WATER]: '#BDBDBD',
        [MuzaElement.EARTH]: '#9E9E9E',
        [MuzaElement.AIR]: '#F5F5F5',
        [MuzaElement.VOID]: '#757575',
    },
    nebula: {
        [MuzaElement.FIRE]: '#F08080', // LightCoral
        [MuzaElement.WATER]: '#87CEEB', // SkyBlue
        [MuzaElement.EARTH]: '#98FB98', // PaleGreen
        [MuzaElement.AIR]: '#FFB6C1', // LightPink
        [MuzaElement.VOID]: '#D8BFD8', // Thistle
    }
};

const NodeInspector: React.FC<{ node: MuzaAINode; theme: VisualTheme; onClose: () => void; onStimulate: () => void; }> = ({ node, theme, onClose, onStimulate }) => {
    const color = THEMES[theme][node.element];
    return (
        <div className="absolute top-4 right-4 w-64 glass-panel p-4 rounded-xl animate-fade-in border border-white/10 bg-black/80 backdrop-blur-xl z-30">
            <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={18}/></button>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{color}}>
                <Atom size={16} /> {node.id}
            </h3>
            <div className="text-xs font-mono space-y-2 text-slate-300">
                <p><span className="text-slate-500">Тип:</span> {node.type}</p>
                <p><span className="text-slate-500">Энергия:</span> {node.hyperbits.toFixed(2)}</p>
                <p><span className="text-slate-500">Масса:</span> {node.mass.toFixed(2)}</p>
                <p><span className="text-slate-500">Стихия:</span> {node.element}</p>
            </div>
             <button
                onClick={onStimulate}
                className="w-full mt-4 py-2 rounded-lg font-bold font-mono text-sm text-yellow-300 bg-yellow-600/20 border border-yellow-500/50 hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
            >
                <Zap size={14} /> Стимулировать
            </button>
        </div>
    );
};

const NeuralStudio: React.FC<NeuralStudioProps> = ({ muzaState, setMuzaState, aiService, onInteraction, onClose, isSplitView }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);
    const [rotation, setRotation] = useState({ x: 0.2, y: 0 });
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [selectedNode, setSelectedNode] = useState<MuzaAINode | null>(null);
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    
    const activeTheme = muzaState.settings.visualTheme;

    const setTheme = (theme: VisualTheme) => {
        setMuzaState(s => s ? { ...s, settings: { ...s.settings, visualTheme: theme } } : null);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);

        const renderConstellation = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const { width, height } = canvas;
            const centerX = width / 2;
            const centerY = height / 2;

            const isExpanded = !isSplitView;
            const fov = isExpanded ? 600 : 300;
            const linkThreshold = isExpanded ? 120 : 80;
            const themeColors = THEMES[activeTheme];

            if (isAutoRotating) {
                setRotation(prev => ({ ...prev, y: prev.y + 0.001 }));
            }
            const { x: angleX, y: angleY } = rotation;
            
            let nodes = aiService.getNodes();
            const links = aiService.getLinks();

            let displayPoints: DisplayPoint[] = nodes.map(node => {
                let x = node.x, y = node.y, z = node.z;
                let tempY = y * Math.cos(angleX) - z * Math.sin(angleX);
                z = z * Math.cos(angleX) + y * Math.sin(angleX);
                y = tempY;
                let tempX = x * Math.cos(angleY) - z * Math.sin(angleY);
                z = z * Math.cos(angleY) + x * Math.sin(angleY);
                x = tempX;
                const scale = fov / (fov + z);
                const screenX = centerX + x * scale;
                const screenY = centerY + y * scale;
                return { ...node, rotatedX: x, rotatedY: y, rotatedZ: z, screenX, screenY, scale };
            });

            displayPoints.sort((a, b) => b.rotatedZ - a.rotatedZ);

            ctx.clearRect(0, 0, width, height);

            const projMap = new Map(displayPoints.map(p => [p.id, p]));

            ctx.lineWidth = 1;
            links.forEach(link => {
                const source = projMap.get(link.source.id);
                const target = projMap.get(link.target.id);
                if (!source || !target) return;
                const dist = Math.hypot(source.screenX - target.screenX, source.screenY - target.screenY);
                if (dist > linkThreshold * Math.max(source.scale, target.scale)) return;
                const baseOpacity = Math.max(0, 1 - dist / (linkThreshold * 2));
                const depthOpacity = Math.min(source.scale, target.scale) * 1.5;
                const finalOpacity = baseOpacity * depthOpacity;

                if (finalOpacity < 0.05) return;

                const color = link.isEntangled ? '192, 132, 252' : '255, 255, 255';
                ctx.beginPath();
                ctx.moveTo(source.screenX, source.screenY);
                ctx.lineTo(target.screenX, target.screenY);
                ctx.strokeStyle = `rgba(${color}, ${finalOpacity * 0.5})`;
                ctx.stroke();
            });

            displayPoints.forEach(p => {
                const opacity = Math.max(0.1, Math.min(1, p.scale * 1.2));
                ctx.globalAlpha = opacity;

                const baseRadius = Math.max(1, (p.mass * 0.25) * p.scale);
                const glowRadius = baseRadius + Math.pow(p.hyperbits, 1.1) * 0.4 * p.scale;
                const color = themeColors[p.element];
                
                const gradient = ctx.createRadialGradient(p.screenX, p.screenY, 0, p.screenX, p.screenY, glowRadius);
                gradient.addColorStop(0, `${color}80`);
                gradient.addColorStop(1, `${color}00`);
                ctx.fillStyle = gradient;
                ctx.fillRect(p.screenX - glowRadius, p.screenY - glowRadius, glowRadius * 2, glowRadius * 2);
                
                ctx.beginPath();
                ctx.arc(p.screenX, p.screenY, baseRadius, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                
                const hotCoreOpacity = Math.max(0, (p.hyperbits - 12) / 30);
                if (hotCoreOpacity > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${hotCoreOpacity})`;
                    ctx.fill();
                }
                
                if (selectedNode?.id === p.id) {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2 * p.scale;
                    ctx.stroke();
                }

                // Render Label
                if (p.scale > 0.45 || (selectedNode?.id === p.id && p.scale > 0.3)) {
                    ctx.font = `bold ${Math.max(8, 11 * p.scale)}px "JetBrains Mono"`;
                    ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.id, p.screenX, p.screenY - glowRadius - 5);
                }
                
                ctx.globalAlpha = 1.0;
            });

            animationFrameId.current = requestAnimationFrame(renderConstellation);
        };
        renderConstellation();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [aiService, rotation, isAutoRotating, isSplitView, selectedNode, activeTheme]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const nodes = aiService.getNodes();
        const { x: angleX, y: angleY } = rotation;
        const fov = !isSplitView ? 600 : 300;

        const projectedNodes: DisplayPoint[] = nodes.map(node => {
            let x = node.x, y = node.y, z = node.z;
            let tempY = y * Math.cos(angleX) - z * Math.sin(angleX);
            z = z * Math.cos(angleX) + y * Math.sin(angleX);
            y = tempY;
            let tempX = x * Math.cos(angleY) - z * Math.sin(angleY);
            z = z * Math.cos(angleY) + x * Math.sin(angleY);
            x = tempX;
            const scale = fov / (fov + z);
            const screenX = (canvasRef.current?.width || 0) / 2 + x * scale;
            const screenY = (canvasRef.current?.height || 0) / 2 + y * scale;
            return { ...node, rotatedZ: z, screenX, screenY, scale } as DisplayPoint;
        }).sort((a, b) => a.rotatedZ - b.rotatedZ);

        let clickedNode: MuzaAINode | null = null;
        for (const p of projectedNodes) {
            const radius = Math.max(5, (p.mass * 0.5) * p.scale);
            if (Math.hypot(p.screenX - mouseX, p.screenY - mouseY) < radius) {
                clickedNode = p;
                break;
            }
        }
        setSelectedNode(clickedNode);
        if (clickedNode) onInteraction();
    };
    
    const handleStimulate = () => {
        if (selectedNode) {
            aiService.stimulate([selectedNode.id]);
            onInteraction();
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-black/80 relative overflow-hidden">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto flex items-center gap-2">
                    <Atom size={18} className="text-cyan-400"/>
                    <span className="font-bold text-slate-200">Созвездие</span>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                    <div className="relative">
                        <button 
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className={`bg-black/40 backdrop-blur-md p-2 rounded-full hover:text-white transition-colors ${showThemeSelector ? 'text-cyan-400' : 'text-slate-400'}`}
                            title="Визуальная тема"
                        >
                            <Palette size={20}/>
                        </button>
                        {showThemeSelector && (
                            <div className="absolute top-full right-0 mt-2 w-36 glass-panel p-2 rounded-lg text-sm font-mono z-50">
                                {(Object.keys(THEMES) as VisualTheme[]).map(theme => (
                                    <button
                                        key={theme}
                                        onClick={() => { setTheme(theme); setShowThemeSelector(false); }}
                                        className={`w-full text-left px-2 py-1 rounded capitalize ${activeTheme === theme ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/10'}`}
                                    >{theme}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsAutoRotating(!isAutoRotating)} 
                        className={`bg-black/40 backdrop-blur-md p-2 rounded-full hover:text-white transition-colors ${isAutoRotating ? 'text-cyan-400' : 'text-slate-500'}`}
                        title="Авто-вращение"
                    >
                        <Rotate3d size={20}/>
                    </button>
                    <button onClick={onClose} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-slate-400 hover:text-white">
                        {isSplitView ? <Maximize size={20}/> : <X size={20}/>}
                    </button>
                </div>
            </header>
            
            <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-pointer"
                onClick={handleCanvasClick}
            />

            {selectedNode && (
                <NodeInspector 
                    node={selectedNode}
                    theme={activeTheme}
                    onClose={() => setSelectedNode(null)}
                    onStimulate={handleStimulate}
                />
            )}
        </div>
    );
};

export default NeuralStudio;
