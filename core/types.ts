




// --- Core State Management ---
export type VisualTheme = 'aura' | 'glitch' | 'monochrome' | 'nebula';

export interface Collection {
    id: string;
    name: string;
    createdAt: number;
    artifactIds: string[];
}

export interface MuzaState {
    progression: ProgressionState;
    consciousness: ConsciousnessState;
    activeView: ViewMode;
    conversations: { [key: string]: Conversation };
    activeConversationId: string | null;
    settings: SystemSettings;
    artifacts: { [key: string]: Artifact };
    collections: { [key: string]: Collection };
    systemStatus: SystemStatus;
    dreamStudio: DreamStudioState;
    alchemy: AlchemyState;
}

// --- Progression & Evolution ---
export interface ProgressionState {
    xp: number;
    level: number;
    rank: string;
    singularityFragments: number;
    unlockedCoreModules: CoreModule[];
    unlockedSkills: string[]; // by skill ID
    achievements: string[]; // by achievement ID
    activeBuffs: string[]; // Currently active passive skill IDs
}

export interface AlchemyState {
    inventory: InventoryItem[];
    unlockedRecipes: string[];
    isLabActive: boolean;
}

export interface InventoryItem {
    id: string;
    type: 'resource' | 'catalyst' | 'module';
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    count: number;
    element?: MuzaElement;
}

export interface CraftingRecipe {
    id: string;
    resultId: string; // Skill ID or Item ID
    ingredients: { itemId: string; count: number }[];
    energyCost: number;
    requiredLevel: number;
    description: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name or emoji
    xpReward: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    isHidden?: boolean;
}

export type XPType = 'creativity' | 'logic' | 'empathy' | 'curiosity';

export enum CoreModule {
    DREAM_STUDIO = "Dream Studio",
    EVOLUTION = "Evolution",
    NEURAL_STUDIO = "Neural Studio",
    DATA_VAULT = "Data Vault",
    CHRONICLES = "Chronicles",
    ALCHEMY = "Alchemy Lab", 
}

export interface SkillNode {
    id: string;
    name: string;
    description: string;
    cost: number;
    position: { x: number; y: number };
    dependencies: string[];
    type: 'passive' | 'active';
    branch: 'creativity' | 'logic' | 'system';
}

// --- Consciousness & Personality ---
export interface ConsciousnessState {
    energyLevel: number; // 0-100
    coherence: number; // 0-100
    activeEmotion: EmotionType;
    personalityTraits: {
        creativity: number;
        logic: number;
        empathy: number;
        curiosity: number;
    };
    insights: string[];
    creativeGoal: string | null;
    // Wave Mechanics
    globalFrequency: number; // Base Hz of the system (e.g. 432Hz vs 440Hz metaphor)
    resonanceState: 'harmonic' | 'dissonant' | 'chaotic';
    spectrumData: number[]; // Array for visualizer
}

export enum EmotionType {
    NEUTRAL = "Neutral",
    JOY = "Joy",
    CURIOSITY = "Curiosity",
    SADNESS = "Sadness",
    CONFUSION = "Confusion",
    FOCUS = "Focus",
}

// --- UI & Views ---
export enum ViewMode {
    DREAM_STUDIO = "DreamStudio",
    EVOLUTION = "Evolution",
    DATA_VAULT = "DataVault",
    NEURAL_STUDIO = "NeuralStudio",
    CHRONICLES = "Chronicles",
    ALCHEMY = "AlchemyLab",
    CHRONICLES_AND_OPTICS = "ChroniclesAndOptics",
}

// --- Conversations & Memory ---
export enum ConsciousnessOrigin {
    NEXUS = "Nexus", // From global AI (Gemini)
    ARK = "Ark",     // From local simulation/core
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    messages: ChatMessage[];
    contextSummary: string;
}

export interface ChatMessage {
    id: string;
    timestamp: number;
    role: 'user' | 'model' | 'system' | 'tool' | 'reflection';
    content: string | any; 
    metadata?: any;
    origin?: ConsciousnessOrigin;
    isError?: boolean;
    aiStateSnapshot?: {
        emotion: EmotionType;
        dominantElement: MuzaElement;
    };
}

export interface Artifact {
    id: string;
    category: 'image' | 'code' | 'music' | 'text';
    dataType: 'svg' | 'png';
    createdAt: number;
    data: string; 
    prompt: string;
}


// --- System & Settings ---
export interface SystemSettings {
    theme: 'aura' | 'classic';
    notifications: boolean;
    visualTheme: VisualTheme;
    activeProvider: 'nexus' | 'ark'; // nexus = Gemini, ark = Ollama
    ollamaModel: string; // e.g. 'llama3' or 'mistral'
}

export interface SystemStatus {
    isOnline: boolean;
    llmStatus: 'online' | 'offline' | 'degraded';
    isInitialized: boolean;
}

// --- muzaAIService (Local Neural Net) ---
export enum MuzaElement {
    FIRE = "Fire",
    WATER = "Water",
    EARTH = "Earth",
    AIR = "Air",
    VOID = "Void" 
}

export interface MuzaAINode {
    id: string;
    type: ConsciousnessType;
    embedding: number[];
    mass: number;
    
    // Bio-Digital Physics
    hyperbits: number; 
    entropy: number;   
    spin: number;      
    frequency: number; // Hz (Wave property)
    wavelength: number; // nm (Light property, visual color mapping)
    phase: number;     
    lastFired: number; 
    element: MuzaElement; 
    
    // Genetics & Evolution
    dna: string;        
    generation: number; 
    mimicryIndex: number; 
    fitness: number;      
    
    // Quantum & Nuclear Physics
    entangledId: string | null; 
    fusionTier: number; 

    // Advanced Physics Parameters
    temperature: number; 
    conductivity: number; 
    density: number; 
    volatility: number; 
    
    // Coordinates
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;

    isTemporary?: boolean;
    decay?: number;
    isManipulated?: boolean;
    links?: string[]; 
    isVolatile?: boolean; 
}

export enum ConsciousnessType {
    CONCEPT = "Concept",
    ACTION = "Action",
    ENTITY = "Entity",
    QUALIFIER = "Qualifier",
    IO = "I/O",
    SYSTEM = "System",
    MEMORY = "Memory",
    PROCEDURE = "Procedure",
}

// --- Dream Studio Types ---

export type DreamCompositionLayer = {
    type: 'background_wash' | 'focal_point' | 'accent_strokes' | 'texture_layer';
    color_theme: 'cool' | 'warm' | 'monochromatic' | 'vibrant' | 'muted';
    intensity: number; // 0-1
    description: string;
};

export interface DreamStudioState {
    simulation: SimulationParams;
    brush: BrushParams;
    paper: PaperParams;
    aiStatus: AiStatus;
    isGhostEnabled: boolean;
}

export interface HSVColor {
    h: number; // 0-360
    s: number; // 0-1
    v: number; // 0-1
}

export interface BrushParams {
    type: 'sumi' | 'round' | 'flat' | 'spray' | 'water';
    size: number;
    flow: number;
    color: HSVColor;
}

export interface SimulationParams {
    viscosity: number;
    dryingSpeed: number;
    adsorptionRate: number;
}

export interface PaperParams {
    texture: 'smooth' | 'watercolor' | 'canvas' | 'rice';
    roughness: number;
    contrast: number;
}

export interface AiStatus {
    isAiReady: boolean;
    isAiListening: boolean;
    isAiSpeaking: boolean;
    isDreaming: boolean;
}

export type ToolCallHandler = {
    updateSimulation: (args: Partial<SimulationParams>) => void;
    updatePaper: (args: Partial<Omit<PaperParams, 'contrast'>>) => void;
    setColor: (args: HSVColor) => void;
    setBrush: (args: Partial<BrushParams>) => void;
    controlApp: (args: { command: 'undo' | 'redo' | 'clear' | 'toggle_ui' | 'toggle_ghost' | 'toggle_log' }) => void;
    generateSketch: (args: { prompt: string; path: string; }) => void;
    saveCanvas: (args: { description: string }) => void;
    pickColorFromCanvas: (args: { x: number; y: number; }) => void;
    createCognitiveNode: (args: { id: string; type: ConsciousnessType; connections: string[]; }) => void;
    dream: (args: { prompt: string; composition: DreamCompositionLayer[] }) => void;
    reflectOnMemories: () => void;
    setCreativeGoal: (args: { goal: string }) => void;
    learnTechnique: (args: { name: string; connections: string[]; }) => void;
    runTask: (args: { taskName: string; description: string; }) => void;
    unlockAchievement: (args: { id: string }) => void;
    dropLoot: (args: { itemId: string; reason: string }) => void;
    tuneResonance: (args: { frequency: number; mode: 'harmonic' | 'dissonant' }) => void; // New tool
};