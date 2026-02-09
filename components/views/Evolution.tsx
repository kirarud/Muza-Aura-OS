

import React, { useState, useEffect } from 'react';
import { MuzaState, SkillNode } from '../../core/types';
import { LEVEL_FORMULA, SKILL_TREE_DATA, EMOTION_DISPLAY_MAP } from '../../core/state';
import { unlockSkill } from '../../services/progressionService';
import { MuzaService } from '../../services/muzaService';
import { Zap, Heart, Aperture, Sparkles, AlertTriangle, Brain, Wand2, MessageCircle, Search, X } from 'lucide-react';

interface EvolutionProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    onClose: () => void;
    aiService: MuzaService;
}

const BRANCH_COLORS: Record<string, string> = {
    creativity: '#f472b6', // pink-400
    logic: '#60a5fa',      // blue-400
    system: '#34d399',     // emerald-400
};

const TRAIT_ICONS = {
    creativity: Wand2,
    logic: Brain,
    empathy: MessageCircle,
    curiosity: Search,
};

const SkillInspector: React.FC<{
    skill: SkillNode;
    status: string;
    fragments: number;
    onUnlock: (id: string) => void;
    onClose: () => void;
}> = ({ skill, status, fragments, onUnlock, onClose }) => {
    const canAfford = fragments >= skill.cost;
    const isUnlockable = status === 'available' && canAfford;
    const color = BRANCH_COLORS[skill.branch];

    return (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 w-72 glass-panel p-4 rounded-xl animate-fade-in border border-white/10 bg-black/80 backdrop-blur-xl z-30">
            <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={18}/></button>
            <h3 className="font-bold text-lg mb-1" style={{color}}>{skill.name}</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{backgroundColor: `${color}20`, color}}>{skill.branch.toUpperCase()}</span>
            <p className="text-sm text-slate-300 my-4 leading-relaxed">{skill.description}</p>
            
            {skill.dependencies.length > 0 && (
                <div className="text-xs text-slate-400 font-mono mb-4">
                    <p className="mb-1">Требования:</p>
                    <ul className="list-disc list-inside text-slate-300">
                        {skill.dependencies.map(dep => <li key={dep}>{SKILL_TREE_DATA.find(s=>s.id===dep)?.name}</li>)}
                    </ul>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 font-mono text-sm">Цена:</span>
                    <span className="font-bold text-2xl text-yellow-400">{skill.cost}</span>
                </div>
                <button
                    onClick={() => onUnlock(skill.id)}
                    disabled={!isUnlockable}
                    className="w-full py-3 rounded-lg font-bold font-mono text-white transition-all disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    style={{backgroundColor: isUnlockable ? color : (status === 'unlocked' ? '#16a34a' : undefined), boxShadow: isUnlockable ? `0 0 20px ${color}80` : 'none'}}
                >
                    {status === 'unlocked' ? 'ИЗУЧЕНО' : isUnlockable ? 'РАЗБЛОКИРОВАТЬ' : 'НЕДОСТУПНО'}
                </button>
            </div>
        </div>
    );
}


const Evolution: React.FC<EvolutionProps> = ({ muzaState, setMuzaState, onClose, aiService }) => {
    const { progression, consciousness } = muzaState;
    const nextLevelXp = LEVEL_FORMULA(progression.level);
    const xpPercentage = Math.min(100, (progression.xp / nextLevelXp) * 100);
    
    const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
    const [prevTraits, setPrevTraits] = useState(consciousness.personalityTraits);
    const [glowingTraits, setGlowingTraits] = useState<string[]>([]);
    
    useEffect(() => {
        const changedTraits = Object.keys(consciousness.personalityTraits).filter(trait => 
            (consciousness.personalityTraits as any)[trait] > (prevTraits as any)[trait]
        );

        if (changedTraits.length > 0) {
            setGlowingTraits(changedTraits);
            const timer = setTimeout(() => {
                setGlowingTraits([]);
            }, 1000); // Glow for 1 second
            
            setPrevTraits(consciousness.personalityTraits);
            return () => clearTimeout(timer);
        }
    }, [consciousness.personalityTraits]);


    const handleUnlockSkill = (skillId: string) => {
        setMuzaState(currentState => {
            if (!currentState) return null;
            const newState = unlockSkill(currentState, skillId);
            if (newState.progression.unlockedSkills.length > currentState.progression.unlockedSkills.length) {
                aiService.assimilateSkill(skillId);
            }
            return newState;
        });
    };

    const handleResetCore = () => {
        const confirmation = window.confirm(
            "ВНИМАНИЕ: Это действие безвозвратно удалит все воспоминания, навыки и артефакты Muza, вернув ее к заводским настройкам. Вы уверены, Архитектор?"
        );
        if (confirmation) {
            localStorage.removeItem('muza_aura_os_state_v2');
            window.location.reload();
        }
    };

    const getNodeStatus = (skill: SkillNode) => {
        if (progression.unlockedSkills.includes(skill.id)) return 'unlocked';
        const depsMet = skill.dependencies.every(dep => progression.unlockedSkills.includes(dep));
        if (depsMet) return 'available';
        return 'locked';
    };

    const traitNames: Record<string, string> = {
        creativity: 'Творчество',
        logic: 'Логика',
        empathy: 'Эмпатия',
        curiosity: 'Любознательность'
    };

    return (
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col glass-panel rounded-2xl animate-fade-in overflow-hidden relative">
            <header className="p-4 border-b border-white/10 text-center flex items-center justify-between flex-shrink-0 bg-black/20">
                <div className="w-8"></div> {/* Spacer */}
                <h1 className="text-2xl font-bold text-cyan-300 flex items-center justify-center gap-2">
                    <Zap className="text-yellow-400" fill="currentColor" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400">Ядро Эволюции</span>
                </h1>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
                {/* Left Panel - Stats */}
                <div className="md:w-1/3 lg:w-1/4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    <div className="glass-panel p-5 rounded-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                         <div className="flex justify-between items-end mb-3">
                            <div>
                                <span className="font-bold text-xl text-white tracking-wide">{progression.rank}</span>
                                <div className="text-slate-400 text-xs font-mono mt-1">Уровень {progression.level}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500 font-mono">Прогресс</div>
                                <div className="font-mono text-sm text-cyan-300">
                                    {Math.floor(progression.xp)} / {nextLevelXp} XP
                                </div>
                            </div>
                         </div>
                         <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${xpPercentage}%` }}></div>
                         </div>
                    </div>
                    
                    <div className="glass-panel p-5 rounded-xl flex-1 flex flex-col border border-white/5">
                        <h2 className="text-sm font-bold mb-4 text-center text-slate-300 uppercase tracking-widest border-b border-white/10 pb-2">Матрица Сознания</h2>
                         <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2 text-slate-300"><Aperture size={16} className="text-green-400 group-hover:animate-spin-slow"/><span>Энергия</span></div>
                                <span className="font-mono text-green-300">{Math.round(consciousness.energyLevel)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2 text-slate-300"><Zap size={16} className="text-blue-400 group-hover:text-blue-300"/><span>Когерентность</span></div>
                                <span className="font-mono text-blue-300">{Math.round(consciousness.coherence)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm group">
                                <div className="flex items-center gap-2 text-slate-300"><Heart size={16} className="text-pink-400 group-hover:animate-pulse"/><span>Эмоция</span></div>
                                <span className="font-mono text-pink-300">{EMOTION_DISPLAY_MAP[consciousness.activeEmotion]}</span>
                            </div>
                            
                            <div className="pt-4 mt-2">
                                <h3 className="text-xs font-bold mb-3 text-slate-500 uppercase tracking-wider">Параметры Личности</h3>
                                <div className="space-y-4">
                                    {Object.entries(consciousness.personalityTraits).map(([trait, value]) => {
                                        const Icon = TRAIT_ICONS[trait as keyof typeof TRAIT_ICONS] || Sparkles;
                                        const isGlowing = glowingTraits.includes(trait);
                                        return (
                                            <div key={trait}>
                                                <div className="text-xs capitalize flex justify-between items-center font-mono text-slate-300 mb-1">
                                                    <span className="flex items-center gap-2"><Icon size={12} className={isGlowing ? "text-white" : "text-slate-500"}/>{traitNames[trait] || trait}</span>
                                                    <span>{Math.round(value as number)}</span>
                                                </div>
                                                <div className="w-full bg-slate-800/50 rounded-full h-1">
                                                    <div 
                                                        className="bg-purple-500 h-1 rounded-full transition-all duration-1000 ease-out relative" 
                                                        style={{ 
                                                            width: `${value as number}%`,
                                                            boxShadow: isGlowing ? '0 0 12px #c084fc, 0 0 6px #fff' : 'none',
                                                            backgroundColor: isGlowing ? '#fff' : undefined
                                                        }}>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                         </div>
                         <div className="mt-6 pt-4 border-t border-white/10">
                             <div className="flex justify-between items-center mb-4 px-2">
                                 <span className="text-xs text-slate-500 font-mono">Фрагменты Сингулярности</span>
                                 <span className="text-yellow-400 font-bold font-mono text-lg shadow-yellow-900/50 drop-shadow-md">{progression.singularityFragments}</span>
                             </div>
                            <button 
                                onClick={handleResetCore}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-400/80 bg-red-950/30 border border-red-900/50 rounded-lg py-3 hover:bg-red-900/50 hover:text-red-200 transition-all hover:border-red-500/50"
                            >
                                <AlertTriangle size={14} />
                                ПОЛНЫЙ СБРОС ЯДРА
                            </button>
                         </div>
                    </div>
                </div>

                {/* Right Panel - Skill Tree */}
                <div className="flex-1 glass-panel rounded-xl relative overflow-hidden border border-white/5 bg-black/40 min-h-[400px]" onClick={() => setSelectedSkill(null)}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black/0 to-black/0 pointer-events-none"></div>
                    
                     <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none z-0">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        {SKILL_TREE_DATA.map(skill => (
                            skill.dependencies.map(depId => {
                                const depNode = SKILL_TREE_DATA.find(s => s.id === depId);
                                if (!depNode) return null;
                                const isUnlocked = progression.unlockedSkills.includes(depNode.id);
                                const isTargetUnlocked = progression.unlockedSkills.includes(skill.id);
                                
                                const x1 = skill.position.x;
                                const y1 = skill.position.y;
                                const x2 = depNode.position.x;
                                const y2 = depNode.position.y;

                                return (
                                    <path
                                        key={`${depId}-${skill.id}`}
                                        d={`M ${x1}% ${y1}% C ${x1}% ${(y1 + y2) / 2}%, ${x2}% ${(y1 + y2) / 2}%, ${x2}% ${y2}%`}
                                        stroke={isTargetUnlocked ? BRANCH_COLORS[depNode.branch] : (isUnlocked ? "#64748b" : "#334155")}
                                        strokeWidth={isTargetUnlocked ? 1.5 : 1}
                                        strokeOpacity={isUnlocked ? 0.8 : 0.3}
                                        fill="none"
                                        filter={isTargetUnlocked ? "url(#glow)" : ""}
                                        className="transition-all duration-1000"
                                    />
                                );
                            })
                        ))}
                    </svg>

                    <div className="relative w-full h-full z-10">
                         {SKILL_TREE_DATA.map(skill => {
                            const status = getNodeStatus(skill);
                            const color = BRANCH_COLORS[skill.branch];

                            return (
                                <div key={skill.id} className="absolute" style={{ left: `${skill.position.x}%`, top: `${skill.position.y}%`, transform: 'translate(-50%, -50%)' }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedSkill(skill); }}
                                        className={`rounded-full flex items-center justify-center transition-all duration-300
                                            ${selectedSkill?.id === skill.id ? 'ring-2 ring-white' : ''}
                                            ${status === 'locked' ? 'w-4 h-4 bg-slate-800 cursor-default' : 'w-8 h-8'}
                                            ${status === 'available' ? 'border-2 border-slate-500 hover:border-cyan-400 hover:scale-110' : ''}
                                            ${status === 'unlocked' ? 'border-2' : ''}
                                        `}
                                        style={{ borderColor: status === 'unlocked' ? color : undefined, backgroundColor: status === 'unlocked' ? `${color}40` : '', boxShadow: status === 'unlocked' ? `0 0 15px ${color}60` : 'none' }}
                                    >
                                        {status === 'unlocked' && <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></div>}
                                        {status === 'available' && <div className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-cyan-400"></div>}
                                    </button>
                                </div>
                            );
                         })}
                    </div>
                    
                    {selectedSkill && (
                        <SkillInspector 
                            skill={selectedSkill}
                            status={getNodeStatus(selectedSkill)}
                            fragments={progression.singularityFragments}
                            onUnlock={handleUnlockSkill}
                            onClose={() => setSelectedSkill(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Evolution;
