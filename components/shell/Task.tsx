import React from 'react';
import { X, Play, Loader, CheckCircle, XCircle } from 'lucide-react';

type TaskStatus = 'idle' | 'running' | 'success' | 'error';

interface TaskProps {
    title: string;
    description: string;
    status: TaskStatus;
    output: string;
    onRun: () => void;
    onClose: () => void;
}

const StatusIndicator: React.FC<{ status: TaskStatus }> = ({ status }) => {
    switch (status) {
        case 'running':
            return <Loader size={16} className="text-cyan-400 animate-spin" />;
        case 'success':
            return <CheckCircle size={16} className="text-green-400" />;
        case 'error':
            return <XCircle size={16} className="text-red-400" />;
        case 'idle':
        default:
            return <div className="w-4 h-4 rounded-full bg-slate-500" />;
    }
};

const Task: React.FC<TaskProps> = ({ title, description, status, output, onRun, onClose }) => {
    const outputRef = React.useRef<HTMLPreElement>(null);

    React.useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    return (
        <div className="w-full h-full max-w-2xl mx-auto flex flex-col glass-panel rounded-2xl animate-fade-in">
            <header className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <StatusIndicator status={status} />
                    <h1 className="text-lg font-bold text-slate-200">{title}</h1>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </header>
            
            <div className="p-4 flex-shrink-0">
                <p className="text-sm text-slate-400">{description}</p>
                 <button 
                    onClick={onRun}
                    disabled={status === 'running'}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600/50 text-cyan-200 rounded-lg border border-cyan-500/50 hover:bg-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'running' ? <><Loader size={16} className="animate-spin" /> Выполнение...</> : <><Play size={16} /> Запустить задачу</>}
                </button>
            </div>

            <div className="flex-1 p-4 pt-0 flex flex-col min-h-0">
                <h3 className="text-xs font-mono text-slate-500 mb-2">ЖУРНАЛ ВЫВОДА</h3>
                <div className="flex-1 bg-black/50 rounded-lg p-2 overflow-y-auto custom-scrollbar">
                    <pre ref={outputRef} className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words">
                        {output || 'Ожидание запуска задачи...'}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default Task;