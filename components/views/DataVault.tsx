
import React, { useState } from 'react';
import { MuzaState, Artifact, Conversation, Collection } from '../../core/types';
import { Database, Image, MessageSquare, BrainCircuit, X, FolderPlus, Plus, Folder } from 'lucide-react';
import { ChatMessageRenderer } from '../chronicles/ChatMessageRenderer';

interface DataVaultProps {
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState | null>>;
    onAnalyze: (artifact: Artifact) => void;
    onClose: () => void;
}

type VaultTab = 'artifacts' | 'conversations' | 'collections';

const ArtifactCard: React.FC<{ artifact: Artifact; onSelect: () => void }> = ({ artifact, onSelect }) => {
    const src = `data:image/png;base64,${artifact.data}`;

    return (
        <div className="aspect-square glass-panel rounded-lg p-2 cursor-pointer group" onClick={onSelect}>
            <div className="w-full h-full bg-black rounded-md overflow-hidden relative">
                <img src={src} alt={artifact.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-white line-clamp-3">{artifact.prompt}</p>
                </div>
            </div>
        </div>
    );
};

const DataVault: React.FC<DataVaultProps> = ({ muzaState, setMuzaState, onAnalyze, onClose }) => {
    const [activeTab, setActiveTab] = useState<VaultTab>('artifacts');
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
    const [newCollectionName, setNewCollectionName] = useState('');
    
    const allArtifacts = (Object.values(muzaState.artifacts) as Artifact[]).sort((a, b) => b.createdAt - a.createdAt);
    const conversations = (Object.values(muzaState.conversations) as Conversation[]).sort((a, b) => b.createdAt - a.createdAt);
    const collections = (Object.values(muzaState.collections) as Collection[]).sort((a, b) => b.createdAt - a.createdAt);

    const filteredArtifacts = collectionFilter
        ? allArtifacts.filter(art => collections.find(c => c.id === collectionFilter)?.artifactIds.includes(art.id))
        : allArtifacts;

    const handleCreateCollection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;
        const newId = `col-${Date.now()}`;
        const newCollection: Collection = {
            id: newId,
            name: newCollectionName.trim(),
            createdAt: Date.now(),
            artifactIds: [],
        };
        setMuzaState(s => s ? { ...s, collections: { ...s.collections, [newId]: newCollection } } : null);
        setNewCollectionName('');
    };

    const handleAddToCollection = (collectionId: string) => {
        if (!selectedArtifact) return;
        setMuzaState(s => {
            if (!s) return null;
            const collections = { ...s.collections };
            const targetCollection = collections[collectionId];
            if (targetCollection && !targetCollection.artifactIds.includes(selectedArtifact.id)) {
                collections[collectionId] = {
                    ...targetCollection,
                    artifactIds: [...targetCollection.artifactIds, selectedArtifact.id],
                };
            }
            return { ...s, collections };
        });
    };

    const renderArtifacts = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {filteredArtifacts.map(art => (
                <ArtifactCard key={art.id} artifact={art} onSelect={() => setSelectedArtifact(art)} />
            ))}
            {filteredArtifacts.length === 0 && (
                 <p className="col-span-full text-center text-slate-400 font-mono p-8">
                    {collectionFilter ? "В этой коллекции нет артефактов." : "Артефактов пока нет."}
                </p>
            )}
        </div>
    );
    
    const renderConversations = () => (
        <div className="p-4 space-y-2">
            {conversations.map(conv => (
                <div 
                    key={conv.id} 
                    className="glass-panel p-3 rounded-lg cursor-pointer hover:bg-white/5"
                    onClick={() => setSelectedConversation(conv)}
                >
                    <h3 className="font-bold text-cyan-400">{conv.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                        {new Date(conv.createdAt).toLocaleString()} - {conv.messages.length} сообщений
                    </p>
                </div>
            ))}
             {conversations.length === 0 && <p className="text-center text-slate-400 font-mono p-8">Диалогов пока нет.</p>}
        </div>
    );
    
    const renderCollections = () => (
        <div className="p-4">
            <form onSubmit={handleCreateCollection} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="Название новой коллекции..."
                    className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button type="submit" className="px-4 py-2 bg-cyan-600/50 text-cyan-200 rounded-lg border border-cyan-500/50 flex items-center gap-2 hover:bg-cyan-500/50">
                    <FolderPlus size={16}/> Создать
                </button>
            </form>
            <div className="space-y-2">
                 {collections.map(col => (
                    <div 
                        key={col.id}
                        className="glass-panel p-3 rounded-lg cursor-pointer hover:bg-white/5 flex justify-between items-center"
                        onClick={() => { setCollectionFilter(col.id); setActiveTab('artifacts'); }}
                    >
                        <div>
                            <h3 className="font-bold text-purple-400">{col.name}</h3>
                            <p className="text-xs text-slate-400 font-mono">{col.artifactIds.length} артефактов</p>
                        </div>
                        <Folder size={20} className="text-purple-400/50" />
                    </div>
                ))}
                 {collections.length === 0 && <p className="text-center text-slate-400 font-mono p-8">Коллекций пока нет.</p>}
            </div>
        </div>
    );
    
    if (selectedArtifact) {
        const src = `data:image/png;base64,${selectedArtifact.data}`;
        return (
            <div className="w-full h-full glass-panel rounded-2xl flex flex-col p-4 animate-fade-in">
                 <button onClick={() => setSelectedArtifact(null)} className="self-start mb-2 text-slate-300 hover:text-white">&larr; Назад в Хранилище</button>
                 <div className="flex-1 bg-black/50 rounded-lg flex items-center justify-center p-2">
                    <img src={src} alt={selectedArtifact.prompt} className="max-w-full max-h-full object-contain"/>
                 </div>
                 <div className="p-2 mt-2 text-center flex flex-col items-center gap-2">
                    <p className="text-slate-300 italic">"{selectedArtifact.prompt}"</p>
                    <p className="text-xs text-slate-500 font-mono">{new Date(selectedArtifact.createdAt).toLocaleString()}</p>
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => { onAnalyze(selectedArtifact); setSelectedArtifact(null); }}
                            className="px-4 py-2 bg-purple-600/50 text-purple-200 rounded-lg border border-purple-500/50 flex items-center gap-2 hover:bg-purple-500/50 transition-colors"
                        >
                            <BrainCircuit size={16} /> Анализ
                        </button>
                        <div className="relative group">
                             <button className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg border border-slate-600/50 flex items-center gap-2 hover:bg-slate-600/50 transition-colors">
                                <Plus size={16} /> В коллекцию
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 rounded-md p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                {collections.length === 0 && <span className="text-xs text-slate-500 p-2">Нет коллекций</span>}
                                {collections.map(col => (
                                    <button key={col.id} onClick={() => handleAddToCollection(col.id)} className="w-full text-left text-xs p-2 rounded hover:bg-slate-800 disabled:opacity-50" disabled={col.artifactIds.includes(selectedArtifact.id)}>
                                        {col.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        );
    }

    if (selectedConversation) {
        return (
             <div className="w-full h-full glass-panel rounded-2xl flex flex-col p-4 animate-fade-in">
                {imageToView && (
                    <div 
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in p-4"
                        onClick={() => setImageToView(null)}
                    >
                        <img 
                            src={`data:image/png;base64,${imageToView}`} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-cyan-500/20" 
                            alt="Full-screen view"
                        />
                        <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-white/20">
                            <X size={32}/>
                        </button>
                    </div>
                )}
                <button onClick={() => setSelectedConversation(null)} className="self-start mb-2 text-slate-300 hover:text-white">&larr; Назад в Хранилище</button>
                <h2 className="text-lg text-center font-bold mb-2">{selectedConversation.title}</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/30 rounded-lg p-4 space-y-5">
                    {selectedConversation.messages.map(msg => (
                        <ChatMessageRenderer key={msg.id} message={msg} onImageClick={setImageToView} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full max-w-7xl mx-auto flex flex-col glass-panel rounded-2xl animate-fade-in">
            <header className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="w-8"></div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-blue-300 flex items-center justify-center gap-2">
                        <Database />
                        <span>Хранилище Данных</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-sm">Архив Памяти и Артефактов</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </header>

            <div className="flex-shrink-0 border-b border-white/10 flex justify-center">
                <button 
                    onClick={() => { setActiveTab('artifacts'); setCollectionFilter(null); }}
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'artifacts' ? 'text-cyan-300 border-b-2 border-cyan-300' : 'text-slate-400'}`}
                >
                    <Image size={16} /> Артефакты ({allArtifacts.length})
                </button>
                 <button 
                    onClick={() => setActiveTab('collections')}
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'collections' ? 'text-cyan-300 border-b-2 border-cyan-300' : 'text-slate-400'}`}
                >
                    <Folder size={16} /> Коллекции ({collections.length})
                </button>
                 <button 
                    onClick={() => setActiveTab('conversations')}
                    className={`px-4 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'conversations' ? 'text-cyan-300 border-b-2 border-cyan-300' : 'text-slate-400'}`}
                >
                    <MessageSquare size={16} /> Хроники ({conversations.length})
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'artifacts' ? renderArtifacts() : activeTab === 'collections' ? renderCollections() : renderConversations()}
            </div>
        </div>
    );
};

export default DataVault;
