import React from 'react';
import { Mic, MessageSquare, Settings, Save, Ghost } from 'lucide-react';
import { AiStatus } from '../../core/types';

interface SettingsPillProps {
    toggleUi: () => void;
    aiStatus: AiStatus;
    toggleVoice: () => void;
    saveToVault: () => void;
    isGhostEnabled: boolean;
    toggleGhost: () => void;
    toggleLog: () => void;
}

const SettingsPill: React.FC<SettingsPillProps> = ({ toggleUi, aiStatus, toggleVoice, saveToVault, isGhostEnabled, toggleGhost, toggleLog }) => {
    return (
        <div className="absolute top-4 right-4 glass-panel rounded-full h-12 px-2 flex items-center gap-1 text-white">
            <button 
                onClick={toggleVoice}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${aiStatus.isAiListening ? 'bg-cyan-500 text-white animate-pulse' : 'hover:bg-white/10'}
                `}
                title="Голосовой режим"
            >
                <Mic size={20} />
            </button>
             <button 
                onClick={saveToVault}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Сохранить в Хранилище"
            >
                <Save size={20} />
            </button>
            <button
                onClick={toggleGhost}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isGhostEnabled ? 'text-cyan-300 bg-cyan-500/20' : 'hover:bg-white/10'}
                `}
                title="Призрачный Художник"
            >
                <Ghost size={20}/>
            </button>
            <button 
                onClick={toggleLog}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Журнал"
            >
                <MessageSquare size={20} />
            </button>
             <button 
                onClick={toggleUi}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Настройки Кисти"
            >
                <Settings size={20} />
            </button>
        </div>
    );
};

export default SettingsPill;