import React, { useState, useEffect } from 'react';
import { BrushParams, SimulationParams, PaperParams, HSVColor } from '../../core/types';

interface ControlPanelProps {
    brush: BrushParams;
    setBrush: (p: React.SetStateAction<BrushParams>) => void;
    simulation: SimulationParams;
    setSimulation: (p: React.SetStateAction<SimulationParams>) => void;
    paper: PaperParams;
    setPaper: (p: React.SetStateAction<PaperParams>) => void;
    unlockedSkills: string[];
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = 
    ({ label, value, min, max, step, onChange }) => (
    <div className="flex flex-col">
        <label className="text-xs text-slate-400">{label}</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const ColorPicker: React.FC<{ color: HSVColor, onChange: (c: HSVColor) => void }> = ({ color, onChange }) => {
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 500);
        return () => clearTimeout(timer);
    }, [color]);
    
    const bgColor = `hsl(${color.h}, ${color.s * 100}%, ${color.v * 100}%)`;

    return (
        <div>
            <label className="text-xs text-slate-400">Цвет (HSV)</label>
            <div className="flex gap-2 mt-1">
                <div 
                    className={`w-10 h-10 rounded-md border-2 border-slate-600 transition-all duration-300 ${isPulsing ? 'shadow-lg' : ''}`}
                    style={{ 
                        backgroundColor: bgColor,
                        boxShadow: isPulsing ? `0 0 10px ${bgColor}` : 'none'
                    }}
                />
                <div className="flex-1 space-y-1">
                    <Slider label="Тон" value={color.h} min={0} max={360} step={1} onChange={h => onChange({ ...color, h })} />
                    <Slider label="Насыщ." value={color.s} min={0} max={1} step={0.01} onChange={s => onChange({ ...color, s })} />
                    <Slider label="Яркость" value={color.v} min={0} max={1} step={0.01} onChange={v => onChange({ ...color, v })} />
                </div>
            </div>
        </div>
    );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ brush, setBrush, simulation, setSimulation, paper, setPaper, unlockedSkills }) => {
    
    const brushNames: Record<string, string> = {
        sumi: 'Суми-э',
        round: 'Круглая',
        flat: 'Плоская',
        spray: 'Аэрозоль',
        water: 'Вода'
    };

    const availableBrushes = (['sumi', 'round', 'flat', 'spray', 'water'] as const).filter(
        b => unlockedSkills.includes(`brush_${b}`) || b === 'sumi'
    );

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-5xl p-4 glass-panel rounded-lg flex gap-8 text-white">
            {/* Brush Controls */}
            <div className="flex-1 space-y-3">
                <h3 className="font-bold mb-2">Кисть</h3>
                <div>
                     <label className="text-xs text-slate-400">Тип</label>
                     <select 
                        value={brush.type} 
                        onChange={e => setBrush(p => ({ ...p, type: e.target.value as BrushParams['type'] }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md p-1 text-xs mt-1"
                    >
                       {availableBrushes.map(b => <option key={b} value={b}>{brushNames[b] || b}</option>)}
                     </select>
                </div>
                <Slider label="Размер" value={brush.size} min={1} max={100} step={1} onChange={v => setBrush(p => ({ ...p, size: v }))} />
                <Slider label="Поток" value={brush.flow} min={0} max={1} step={0.01} onChange={v => setBrush(p => ({ ...p, flow: v }))} />
            </div>

            {/* Color Controls */}
            <div className="w-1/3">
                 <h3 className="font-bold mb-2">Палитра</h3>
                 <ColorPicker color={brush.color} onChange={c => setBrush(p => ({ ...p, color: c }))} />
            </div>

            {/* Simulation & Paper Controls */}
            <div className="flex-1 space-y-4">
                <h3 className="font-bold mb-2">Холст</h3>
                <Slider label="Вязкость" value={simulation.viscosity} min={0} max={1} step={0.01} onChange={v => setSimulation(p => ({ ...p, viscosity: v }))} />
                <Slider label="Скорость высыхания" value={simulation.dryingSpeed} min={0} max={1} step={0.01} onChange={v => setSimulation(p => ({ ...p, dryingSpeed: v }))} />
                <Slider label="Фактура бумаги" value={paper.roughness} min={0} max={1} step={0.01} onChange={v => setPaper(p => ({ ...p, roughness: v }))} />
            </div>
        </div>
    );
};

export default ControlPanel;