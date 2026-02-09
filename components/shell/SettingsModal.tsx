
import React, { useState } from 'react';
import { MuzaState } from '../../core/types';
import { X, Save, Download, Server, Cpu, Database } from 'lucide-react';

interface SettingsModalProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ muzaState, setMuzaState, onClose }) => {
    const [ollamaModel, setOllamaModel] = useState(muzaState.settings.ollamaModel || 'llama3');
    const [saveStatus, setSaveStatus] = useState<string>('');

    const handleSaveLocal = () => {
        try {
            // Force save to localStorage
            const key = 'muza_aura_os_god_mode_v6'; // Must match App.tsx
            localStorage.setItem(key, JSON.stringify(muzaState));
            setSaveStatus('Сохранено в браузере!');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (e) {
            setSaveStatus('Ошибка сохранения!');
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(muzaState));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `muza_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        setSaveStatus('Файл скачан!');
        setTimeout(() => setSaveStatus(''), 2000);
    };

    const saveSettings = () => {
        setMuzaState(s => s ? { ...s, settings: { ...s.settings, ollamaModel } } : null);
        onClose();
    };

    return (
        <div className="w-full max-w-md bg-black/90 glass-panel rounded-xl p-6 border border-white/10 relative animate-fade-in text-white">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-cyan-400">
                <Server size={24} /> Настройки Ядра
            </h2>

            {/* Provider Config */}
            <div className="mb-6 space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Cpu size={16}/> Локальное Ядро (Ollama)
                    </h3>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 block">Название модели</label>
                        <input 
                            type="text" 
                            value={ollamaModel} 
                            onChange={(e) => setOllamaModel(e.target.value)}
                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 font-mono text-sm focus:border-cyan-500 outline-none"
                            placeholder="llama3, mistral, etc..."
                        />
                        <p className="text-[10px] text-slate-500">
                            Убедитесь, что Ollama запущена: <code className="bg-black px-1 rounded">ollama serve</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="mb-6 space-y-4">
                 <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <Database size={16}/> Управление Памятью
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleSaveLocal}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/30 border border-blue-500/50 rounded hover:bg-blue-500/30 transition-colors text-sm"
                        >
                            <Save size={16} /> В браузер
                        </button>
                         <button 
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded hover:bg-purple-500/30 transition-colors text-sm"
                        >
                            <Download size={16} /> В файл
                        </button>
                    </div>
                    {saveStatus && <p className="text-center text-xs text-green-400 mt-2 font-mono">{saveStatus}</p>}
                </div>
            </div>

            <button 
                onClick={saveSettings}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
            >
                Применить и Закрыть
            </button>
        </div>
    );
};

export default SettingsModal;
