
import React, { useState } from 'react';
import { MuzaState, ViewMode, CoreModule } from '../../core/types';
import { MODULE_UNLOCK_MAP } from '../../core/state';
import { AmbientService } from '../../services/ambientService';
import { Image as ImageIcon, Zap, Database, BrainCircuit, BookOpen, Lock, FlaskConical, Headphones, VolumeX, Sparkles, Cpu } from 'lucide-react';

interface NavigationProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
}

const MODULE_DATA: { [key in CoreModule]: { icon: React.ElementType, view: ViewMode, label: string } } = {
    [CoreModule.CHRONICLES]: { icon: BookOpen, view: ViewMode.CHRONICLES, label: "Хроники" },
    [CoreModule.DREAM_STUDIO]: { icon: ImageIcon, view: ViewMode.DREAM_STUDIO, label: "Студия Снов" },
    [CoreModule.EVOLUTION]: { icon: Zap, view: ViewMode.EVOLUTION, label: "Эволюция" },
    [CoreModule.DATA_VAULT]: { icon: Database, view: ViewMode.DATA_VAULT, label: "Хранилище" },
    [CoreModule.NEURAL_STUDIO]: { icon: BrainCircuit, view: ViewMode.NEURAL_STUDIO, label: "Нейросеть" },
    [CoreModule.ALCHEMY]: { icon: FlaskConical, view: ViewMode.ALCHEMY, label: "Лаборатория" },
};

const getUnlockLevel = (module: CoreModule) => {
    const entry = Object.entries(MODULE_UNLOCK_MAP).find(([lvl, mod]) => mod === module);
    return entry ? parseInt(entry[0]) : 1;
};

// Extracted Component: Safe Dual Core Icon
const DualCoreIcon = ({ activeProvider, onToggle }: { activeProvider: 'nexus' | 'ark', onToggle: () => void }) => {
    const isNexus = activeProvider === 'nexus';
    
    return (
        <button 
            onClick={onToggle}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-lg shadow-lg relative overflow-hidden group transition-all duration-500
                ${isNexus ? 'border-purple-400 text-purple-300 shadow-purple-500/20' : 'border-cyan-400 text-cyan-300 shadow-cyan-500/20'}
            `}
            title={`Текущее ядро: ${isNexus ? 'NEXUS (Cloud)' : 'ARK (Local)'}. Нажмите для переключения.`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${isNexus ? 'from-purple-900/80 to-black' : 'from-cyan-900/80 to-black'}`}></div>
            
            {/* Split Icon */}
            <div className="absolute inset-0 flex">
                <div className={`w-1/2 h-full flex items-center justify-center transition-all ${isNexus ? 'bg-purple-500/20' : 'bg-transparent opacity-30'}`}>
                    <Sparkles size={16} className={isNexus ? "text-purple-300 animate-pulse" : "text-slate-500"} />
                </div>
                <div className={`w-1/2 h-full flex items-center justify-center transition-all ${!isNexus ? 'bg-cyan-500/20' : 'bg-transparent opacity-30'}`}>
                    <Cpu size={16} className={!isNexus ? "text-cyan-300 animate-spin-slow" : "text-slate-500"} />
                </div>
            </div>
            
            {/* Divider */}
            <div className={`absolute w-px h-full left-1/2 -translate-x-1/2 transition-colors duration-500 ${isNexus ? 'bg-purple-500/50' : 'bg-cyan-500/50'}`}></div>
        </button>
    );
};

const ambientService = new AmbientService();

const Navigation: React.FC<NavigationProps> = ({ muzaState, setMuzaState }) => {
    const progression = muzaState?.progression || { unlockedCoreModules: [] };
    const activeView = muzaState?.activeView || ViewMode.CHRONICLES;
    const settings = muzaState?.settings || { activeProvider: 'nexus' };
    const [isMuted, setIsMuted] = useState(true);

    const handleNavClick = (view: ViewMode, isLocked: boolean) => {
        if (isLocked) return;
        
        if (view === ViewMode.NEURAL_STUDIO) {
            setMuzaState(s => {
                if (!s) return null;
                const newView = s.activeView === ViewMode.CHRONICLES_AND_OPTICS 
                    ? ViewMode.CHRONICLES 
                    : ViewMode.CHRONICLES_AND_OPTICS;
                return { ...s, activeView: newView };
            });
            return;
        }

        setMuzaState(prevState => {
            if (!prevState) return null;
            if (prevState.activeView === view) {
                return { ...prevState, activeView: ViewMode.CHRONICLES };
            }
            return { ...prevState, activeView: view };
        });
    };
    
    const handleToggleProvider = () => {
        setMuzaState(s => {
            if (!s) return null;
            const currentProvider = s.settings?.activeProvider || 'nexus';
            const newProvider = currentProvider === 'nexus' ? 'ark' : 'nexus';
            return {
                ...s,
                settings: { ...(s.settings || {}), activeProvider: newProvider }
            };
        });
    };
    
    const toggleSound = async () => {
        const newState = !isMuted;
        if (!newState) {
            await ambientService.init();
        }
        ambientService.toggleMute(newState);
        setIsMuted(newState);
    };

    // FIX: Removed the filter that was hiding DREAM_STUDIO
    const modules = Object.values(CoreModule);
    
    const activeProvider = settings.activeProvider || 'nexus';

    return (
        <nav className="h-full w-20 glass-panel border-r border-white/10 p-2 flex flex-col items-center justify-between z-50">
            <div className="flex flex-col items-center gap-2">
                <div className="mb-4">
                    <DualCoreIcon 
                        activeProvider={activeProvider} 
                        onToggle={handleToggleProvider} 
                    />
                </div>

                {modules.map(module => {
                    const moduleInfo = MODULE_DATA[module];
                    if (!moduleInfo) return null;

                    const Icon = moduleInfo.icon;
                    const viewMode = moduleInfo.view;
                    const isActive = activeView === viewMode || (viewMode === ViewMode.NEURAL_STUDIO && activeView === ViewMode.CHRONICLES_AND_OPTICS);
                    const isUnlocked = progression.unlockedCoreModules ? progression.unlockedCoreModules.includes(module) : false;
                    const unlockLevel = getUnlockLevel(module);
                    
                    return (
                        <button
                            key={module}
                            onClick={() => handleNavClick(viewMode, !isUnlocked)}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-200 group relative
                                ${isActive ? 'bg-cyan-500/30 text-cyan-300' : ''}
                                ${!isUnlocked ? 'opacity-50 cursor-not-allowed bg-white/5' : 'text-slate-400 hover:bg-white/10 hover:text-white'}
                            `}
                            aria-label={moduleInfo.label}
                        >
                            {isUnlocked ? <Icon size={24} /> : <Lock size={20} className="text-slate-500" />}
                            
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[120px] text-left">
                                <p className="font-bold text-sm text-white mb-0.5">{moduleInfo.label}</p>
                                {!isUnlocked && <p className="text-xs text-red-400 font-mono">Доступно с уровня {unlockLevel}</p>}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <div className="flex flex-col items-center gap-4 mb-2">
                 <button
                    onClick={toggleSound}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${!isMuted ? 'text-cyan-400 bg-cyan-900/20 animate-pulse-slow' : 'text-slate-500 hover:text-white'}`}
                    title={isMuted ? "Включить Ауру" : "Выключить Ауру"}
                >
                    {isMuted ? <VolumeX size={20} /> : <Headphones size={20} />}
                </button>
                
                 <div className="w-full px-2 text-center text-xs font-mono text-slate-400">
                    DEV
                 </div>
            </div>
        </nav>
    );
};

export default Navigation;
