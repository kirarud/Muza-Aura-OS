import React from 'react';
import { AiStatus } from '../../core/types';

interface VoiceStatusProps {
    status: AiStatus;
}

const VoiceStatus: React.FC<VoiceStatusProps> = ({ status }) => {
    let text = "ИИ Офлайн";
    let color = "bg-red-500";

    if (status.isAiReady) {
        text = "Готов";
        color = "bg-slate-500";
    }
    if (status.isAiListening) {
        text = "Слушаю...";
        color = "bg-cyan-500";
    }
    if (status.isAiSpeaking) {
        text = "Говорю...";
        color = "bg-green-500";
    }
    if (status.isDreaming) {
        text = "Вижу сны...";
        color = "bg-purple-500";
    }


    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white font-mono text-sm">
            <div className={`w-3 h-3 rounded-full ${color} transition-colors`} />
            <span>{text}</span>
        </div>
    );
};

export default VoiceStatus;