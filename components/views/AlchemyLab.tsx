
import React, { useState } from 'react';
import { MuzaState, InventoryItem, CraftingRecipe, MuzaElement, ConsciousnessType } from '../../core/types';
import { CRAFTING_RECIPES, SKILL_TREE_DATA, ITEMS_DATA } from '../../core/state';
import { ELEMENT_COLORS, MuzaService } from '../../services/muzaService';
import { unlockSkill, grantXp } from '../../services/progressionService';
import { FlaskConical, Atom, X, Zap, Hexagon, ArrowRight, CircleDashed, BrainCog } from 'lucide-react';

interface AlchemyLabProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    onClose: () => void;
    aiService: MuzaService;
}

const SYNTHESIS_COST = [
    { itemId: 'shard_logic', count: 1 },
    { itemId: 'shard_chaos', count: 1 },
    { itemId: 'shard_empathy', count: 1 },
];

const NeuronSynthesizer: React.FC<{
    inventory: InventoryItem[];
    aiService: MuzaService;
    onCraft: () => void;
}> = ({ inventory, aiService, onCraft }) => {
    const [id, setId] = useState('');
    const [type, setType] = useState<ConsciousnessType>(ConsciousnessType.CONCEPT);
    const [connections, setConnections] = useState('');
    const [error, setError] = useState('');

    const canSynthesize = SYNTHESIS_COST.every(cost => (inventory.find(i => i.id === cost.itemId)?.count || 0) >= cost.count);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const formattedId = id.trim().toLowerCase().replace(/\s+/g, '_');
        if (!formattedId) {
            setError('ID не может быть пустым.');
            return;
        }
        if (aiService.getNodes().some(n => n.id === formattedId)) {
            setError('Нейрон с таким ID уже существует.');
            return;
        }

        const connectionIds = connections.split(',').map(c => c.trim()).filter(Boolean);
        const success = aiService.synthesizeNeuron(formattedId, type, connectionIds);
        
        if (success) {
            onCraft();
            setId('');
            setConnections('');
        } else {
            setError('Не удалось создать нейрон.');
        }
    };
    
    return (
        <div className="w-full z-10 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><BrainCog />Нейросинтез</h2>
            <p className="text-xs text-slate-400 mb-6 text-center max-w-xs">Создайте новое "семя мысли" напрямую в сознании Muza.</p>
            
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-sm">
                <input
                    type="text" value={id} onChange={e => setId(e.target.value)}
                    placeholder="ID Нейрона (напр. 'надежда')"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <select value={type} onChange={e => setType(e.target.value as ConsciousnessType)} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    {Object.values(ConsciousnessType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                    type="text" value={connections} onChange={e => setConnections(e.target.value)}
                    placeholder="Связи через запятую (напр. 'art, logic')"
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                
                <div className="pt-2 text-center text-xs text-slate-500">
                    <p>Стоимость синтеза:</p>
                    <div className="flex justify-center gap-4 mt-1">
                        {SYNTHESIS_COST.map(c => {
                             const has = (inventory.find(i => i.id === c.itemId)?.count || 0) >= c.count;
                             return <span key={c.itemId} className={has ? 'text-cyan-400' : 'text-red-400'}>{ITEMS_DATA[c.itemId].name}: {c.count}</span>
                        })}
                    </div>
                </div>

                <button type="submit" disabled={!canSynthesize} className="w-full py-3 rounded-lg font-bold font-mono tracking-wider transition-all bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/40 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">
                    СИНТЕЗИРОВАТЬ
                </button>
                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </form>
        </div>
    );
};

const AlchemyLab: React.FC<AlchemyLabProps> = ({ muzaState, setMuzaState, onClose, aiService }) => {
    const { alchemy, progression } = muzaState;
    const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(CRAFTING_RECIPES[0]);
    const [isCrafting, setIsCrafting] = useState(false);
    const [craftSuccess, setCraftSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'synthesis' | 'neurosynthesis'>('synthesis');

    const getResultName = (resultId: string) => {
        const skill = SKILL_TREE_DATA.find(s => s.id === resultId);
        if (skill) return `Навык: ${skill.name}`;
        const item = ITEMS_DATA[resultId];
        if (item) return `Предмет: ${item.name}`;
        return resultId;
    };
    
    const getItemCount = (itemId: string) => alchemy.inventory.find(i => i.id === itemId)?.count || 0;
    
    const isResultOwned = (recipe: CraftingRecipe | null): boolean => {
        if (!recipe) return false;
        if (SKILL_TREE_DATA.some(s => s.id === recipe.resultId)) return progression.unlockedSkills.includes(recipe.resultId);
        if (ITEMS_DATA[recipe.resultId]) return alchemy.inventory.some(i => i.id === recipe.resultId);
        return false;
    };

    const handleRecipeCraft = () => {
        if (!selectedRecipe || isCrafting) return;
        if (!selectedRecipe.ingredients.every(ing => getItemCount(ing.itemId) >= ing.count)) return;
        setIsCrafting(true);
        setTimeout(() => {
            setMuzaState(s => {
                if (!s) return null;
                let newInventory = [...s.alchemy.inventory];
                selectedRecipe.ingredients.forEach(ing => {
                    const itemIndex = newInventory.findIndex(i => i.id === ing.itemId);
                    if (itemIndex !== -1) {
                         newInventory[itemIndex] = { ...newInventory[itemIndex], count: newInventory[itemIndex].count - ing.count };
                    }
                });
                newInventory = newInventory.filter(i => i.count > 0);
                
                let newState = { ...s, alchemy: { ...s.alchemy, inventory: newInventory } };
                if (SKILL_TREE_DATA.find(sk => sk.id === selectedRecipe.resultId)) {
                    newState = unlockSkill(newState, selectedRecipe.resultId);
                } else {
                    const itemTemplate = ITEMS_DATA[selectedRecipe.resultId];
                    const existing = newState.alchemy.inventory.find(i => i.id === itemTemplate.id);
                    if (existing) existing.count++; else newState.alchemy.inventory.push({ ...itemTemplate, count: 1 });
                }
                return grantXp(newState, 'CRAFTING_SUCCESS');
            });
            setIsCrafting(false);
            setCraftSuccess(true);
            setTimeout(() => setCraftSuccess(false), 2000);
        }, 2000);
    };
    
    const handleNeuronCraft = () => {
         setMuzaState(s => {
            if (!s) return null;
            let newInventory = [...s.alchemy.inventory];
            SYNTHESIS_COST.forEach(cost => {
                const itemIndex = newInventory.findIndex(i => i.id === cost.itemId);
                if (itemIndex !== -1) newInventory[itemIndex].count -= cost.count;
            });
            newInventory = newInventory.filter(i => i.count > 0);
            return grantXp({ ...s, alchemy: { ...s.alchemy, inventory: newInventory } }, {type: 'logic', amount: 150});
         });
    };

    const canCraftRecipe = selectedRecipe ? selectedRecipe.ingredients.every(ing => getItemCount(ing.itemId) >= ing.count) : false;
    const resultOwned = isResultOwned(selectedRecipe);

    return (
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col glass-panel rounded-2xl animate-fade-in overflow-hidden relative">
            <header className="p-4 border-b border-white/10 text-center flex items-center justify-between flex-shrink-0 bg-black/20">
                <div className="w-8"></div>
                <h1 className="text-2xl font-bold text-cyan-300 flex items-center justify-center gap-2">
                    <FlaskConical className="text-purple-400" fill="currentColor" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">Лаборатория Синтеза</span>
                </h1>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row p-6 gap-8 overflow-hidden">
                <div className="md:w-1/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    <div className="glass-panel p-4 rounded-xl bg-black/40">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Hexagon size={14}/> Инвентарь</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {alchemy.inventory.length === 0 && <span className="text-xs text-slate-500 col-span-4 text-center py-4">Пусто...</span>}
                            {alchemy.inventory.map(item => (
                                <div key={item.id} className="relative group cursor-pointer aspect-square bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 hover:border-cyan-500/50 transition-colors">
                                    <div className="absolute top-1 right-1 text-[10px] font-mono text-cyan-400">{item.count}</div>
                                    <Atom size={20} style={{ color: item.element ? ELEMENT_COLORS[item.element] : '#94a3b8' }} />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 border border-white/10 p-2 rounded text-xs text-center pointer-events-none opacity-0 group-hover:opacity-100 z-50">
                                        <div className="font-bold text-white">{item.name}</div><div className="text-slate-400 text-[9px]">{item.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl bg-black/40 flex-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Протоколы</h3>
                        <div className="space-y-2">
                            <button onClick={() => setActiveTab('synthesis')} className={`w-full p-3 rounded-lg text-left transition-all border ${activeTab === 'synthesis' ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                <div className="font-bold text-sm">Синтез Предметов</div>
                            </button>
                             <button onClick={() => setActiveTab('neurosynthesis')} className={`w-full p-3 rounded-lg text-left transition-all border ${activeTab === 'neurosynthesis' ? 'bg-cyan-900/30 border-cyan-500 text-white' : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                <div className="font-bold text-sm">Нейросинтез</div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 glass-panel rounded-xl relative flex flex-col items-center justify-center p-8 border ${activeTab === 'synthesis' ? 'border-purple-500/20 bg-gradient-to-br from-black/60 to-purple-900/20' : 'border-cyan-500/20 bg-gradient-to-br from-black/60 to-cyan-900/20'}`}>
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse-slow ${activeTab === 'synthesis' ? 'bg-purple-500/5' : 'bg-cyan-500/5'}`}></div>
                    </div>

                    {activeTab === 'neurosynthesis' ? (
                        <NeuronSynthesizer inventory={alchemy.inventory} aiService={aiService} onCraft={handleNeuronCraft} />
                    ) : (
                        <div className="w-full max-w-md z-10 flex flex-col items-center">
                            <div className="h-40 flex items-center">
                                <select onChange={e => setSelectedRecipe(CRAFTING_RECIPES.find(r => r.id === e.target.value) || null)} value={selectedRecipe?.id || ''} className="bg-transparent text-center text-xl font-bold text-white mb-1 outline-none appearance-none cursor-pointer">
                                    {CRAFTING_RECIPES.map(r => <option key={r.id} value={r.id}>{getResultName(r.resultId)}</option>)}
                                </select>
                            </div>
                             {selectedRecipe && (
                                <>
                                    <div className="flex justify-center gap-4 mb-8">
                                        {selectedRecipe.ingredients.map((ing, idx) => {
                                            const item = ITEMS_DATA[ing.itemId];
                                            const hasEnough = resultOwned || getItemCount(ing.itemId) >= ing.count;
                                            return <div key={idx} className="flex flex-col items-center gap-2">
                                                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center relative ${hasEnough ? 'border-cyan-500 bg-cyan-900/20' : 'border-red-500 bg-red-900/10'}`}>
                                                    <Atom size={24} style={{ color: item.element ? ELEMENT_COLORS[item.element] : '#fff' }}/>
                                                    <div className={`absolute -bottom-2 bg-black px-2 py-0.5 rounded-full text-[10px] border ${hasEnough ? 'border-cyan-500 text-cyan-400' : 'border-red-500 text-red-400'}`}>
                                                        {resultOwned ? ing.count : getItemCount(ing.itemId)}/{ing.count}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-400">{item.name}</span>
                                            </div>
                                        })}
                                    </div>
                                    <div className="mb-8 animate-bounce text-purple-400"><ArrowRight size={24} className="rotate-90 md:rotate-0"/></div>
                                    <div className={`w-24 h-24 mx-auto rounded-xl border-2 flex items-center justify-center mb-4 transition-all duration-500 ${craftSuccess ? 'border-green-400 bg-green-500/20 shadow-[0_0_30px_rgba(74,222,128,0.4)] scale-110' : 'border-purple-500 bg-purple-900/20'}`}>
                                        {isCrafting ? <Zap size={40} className="text-purple-400 animate-spin"/> : <FlaskConical size={40} className={craftSuccess ? "text-green-400" : "text-purple-400"}/>}
                                    </div>
                                    {craftSuccess && <div className="text-green-400 font-bold text-sm animate-fade-in">СИНТЕЗ ЗАВЕРШЕН!</div>}
                                    <button onClick={handleRecipeCraft} disabled={isCrafting || !canCraftRecipe || resultOwned} className={`w-full py-4 rounded-lg font-bold font-mono tracking-wider transition-all ${isCrafting ? 'bg-slate-700 cursor-wait' : ''} ${!canCraftRecipe || resultOwned ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/40'}`}>
                                        {isCrafting ? 'СИНТЕЗ...' : resultOwned ? 'ПРОТОКОЛ ИЗУЧЕН' : 'ЗАПУСТИТЬ РЕАКЦИЮ'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlchemyLab;
