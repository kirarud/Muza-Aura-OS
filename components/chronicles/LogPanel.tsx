
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../core/types';
import { ChatMessageRenderer } from './ChatMessageRenderer';

interface LogPanelProps {
    history: ChatMessage[];
    isVisible: boolean;
}

const LogPanel: React.FC<LogPanelProps> = ({ history }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="flex flex-col gap-5 text-sm">
                    {history.map((msg) => (
                       <ChatMessageRenderer key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

export default LogPanel;
