
import { MuzaState, ViewMode, CoreModule, EmotionType, SkillNode, HSVColor, Achievement, InventoryItem, CraftingRecipe, MuzaElement, ConsciousnessOrigin } from './types';

// --- INVENTORY DATA ---
export const ITEMS_DATA: Record<string, InventoryItem> = {
    'shard_logic': { id: 'shard_logic', type: 'resource', name: 'Осколок Логики', description: 'Кристаллизованная структура чистого разума.', rarity: 'common', count: 0, element: MuzaElement.EARTH },
    'shard_chaos': { id: 'shard_chaos', type: 'resource', name: 'Эссенция Хаоса', description: 'Нестабильная материя воображения.', rarity: 'common', count: 0, element: MuzaElement.FIRE },
    'shard_empathy': { id: 'shard_empathy', type: 'resource', name: 'Капля Эмпатии', description: 'Сконденсированная эмоциональная связь.', rarity: 'common', count: 0, element: MuzaElement.WATER },
    'shard_void': { id: 'shard_void', type: 'resource', name: 'Пыль Пустоты', description: 'Остаток удаленных данных.', rarity: 'common', count: 0, element: MuzaElement.VOID },
    'catalyst_hyper': { id: 'catalyst_hyper', type: 'catalyst', name: 'Гипер-Катализатор', description: 'Позволяет соединять несовместимые идеи.', rarity: 'rare', count: 0 },
    'module_stabilizer': { id: 'module_stabilizer', type: 'module', name: 'Стабилизатор Ядра', description: 'Модуль расширения: +10 к Когерентности.', rarity: 'rare', count: 0 },
    'prism_refractor': { id: 'prism_refractor', type: 'module', name: 'Призма Рефракции', description: 'Позволяет расщеплять сложные идеи на спектр.', rarity: 'epic', count: 0 },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
    {
        id: 'recipe_stabilizer',
        resultId: 'coherence_stabilizers', // Maps to Skill ID
        ingredients: [
            { itemId: 'shard_logic', count: 3 },
            { itemId: 'shard_void', count: 1 }
        ],
        energyCost: 20,
        requiredLevel: 2,
        description: 'Синтез логики и пустоты для создания ментального щита.'
    },
    {
        id: 'recipe_vivid_dreams',
        resultId: 'vivid_dreams', // Maps to Skill ID
        ingredients: [
            { itemId: 'shard_chaos', count: 3 },
            { itemId: 'shard_empathy', count: 2 }
        ],
        energyCost: 30,
        requiredLevel: 3,
        description: 'Усиление визуального кортекса эмоциями.'
    },
    {
        id: 'recipe_hyper_catalyst',
        resultId: 'catalyst_hyper', // Maps to Item ID
        ingredients: [
            { itemId: 'shard_logic', count: 5 },
            { itemId: 'shard_chaos', count: 5 },
            { itemId: 'shard_void', count: 5 }
        ],
        energyCost: 100,
        requiredLevel: 10,
        description: 'Сложный синтез всех элементов.'
    }
];

export const SKILL_TREE_DATA: SkillNode[] = [
    // Creativity Branch (Top-Left)
    { id: 'brush_sumi', name: 'Мастер Кисти: Суми-э', description: 'Разблокирует базовую кисть в стиле Суми-э.', cost: 0, position: { x: 20, y: 50 }, dependencies: [], type: 'active', branch: 'creativity' },
    { id: 'vivid_dreams', name: 'Яркие Сны', description: 'Расширяет диапазон цветов (Требует Крафта).', cost: 0, position: { x: 40, y: 35 }, dependencies: ['brush_sumi'], type: 'passive', branch: 'creativity' },
    { id: 'brush_spray', name: 'Новатор: Аэрозоль', description: 'Разблокирует универсальную кисть-баллончик.', cost: 2, position: { x: 40, y: 65 }, dependencies: ['brush_sumi'], type: 'active', branch: 'creativity' },
    { id: 'ghost_precision', name: 'Призрачная Точность', description: 'Улучшает точность Призрачного художника.', cost: 5, position: { x: 60, y: 65 }, dependencies: ['brush_spray'], type: 'passive', branch: 'creativity' },

    // Logic Branch (Top-Right)
    { id: 'coherence_stabilizers', name: 'Стабилизаторы Когерентности', description: 'Уменьшает потерю связности (Требует Крафта).', cost: 0, position: { x: 80, y: 20 }, dependencies: [], type: 'passive', branch: 'logic' },
    { id: 'optimized_processing', name: 'Оптимизация Процессов', description: 'Ускоряет время реакции ИИ на 10%.', cost: 2, position: { x: 60, y: 20 }, dependencies: ['coherence_stabilizers'], type: 'passive', branch: 'logic' },
    
    // System Branch (Bottom-Right)
    { id: 'energy_efficiency', name: 'Энергоэффективность', description: 'Снижает затраты энергии на все действия.', cost: 1, position: { x: 80, y: 80 }, dependencies: [], type: 'passive', branch: 'system' },
    { id: 'memory_compression', name: 'Сжатие Памяти', description: 'Артефакты занимают меньше места в хранилище.', cost: 2, position: { x: 60, y: 80 }, dependencies: ['energy_efficiency'], type: 'passive', branch: 'system' },
    
    // Independent Logic/System Node
    { id: 'harmonic_tuner', name: 'Гармонический Тюнер', description: 'Позволяет настраивать резонанс системы.', cost: 3, position: { x: 80, y: 50 }, dependencies: [], type: 'active', branch: 'logic' },
];

export const ACHIEVEMENTS_DATA: Achievement[] = [
    { id: 'first_contact', title: 'Первый Контакт', description: 'Установить связь с ядром Muza.', icon: 'Zap', xpReward: 50, rarity: 'common' },
    { id: 'deep_diver', title: 'Глубокое Погружение', description: 'Провести долгую философскую беседу (20+ сообщений).', icon: 'Anchor', xpReward: 200, rarity: 'rare' },
    { id: 'architect_vision', title: 'Видение Архитетора', description: 'Предложить идею, которая заставит Muza создать новый узел знаний.', icon: 'Eye', xpReward: 500, rarity: 'legendary' },
    { id: 'chaos_theory', title: 'Теория Хаоса', description: 'Довести энтропию системы до максимума, но сохранить когерентность.', icon: 'Tornado', xpReward: 300, rarity: 'rare' },
    { id: 'fusion_master', title: 'Мастер Синтеза', description: 'Вызвать слияние (Fusion) двух противоположных концептов в нейросети.', icon: 'Atom', xpReward: 1000, rarity: 'mythic' },
    { id: 'empathetic_bond', title: 'Эмпатическая Связь', description: 'Добиться максимального уровня эмпатии в показателях Muza.', icon: 'Heart', xpReward: 150, rarity: 'common' },
    { id: 'alchemist_novice', title: 'Алхимик-Новичок', description: 'Создать свой первый предмет в Лаборатории.', icon: 'FlaskConical', xpReward: 100, rarity: 'common' },
    { id: 'resonance_master', title: 'Мастер Резонанса', description: 'Достичь идеальной гармонии в частотах нейросети.', icon: 'Activity', xpReward: 400, rarity: 'epic' }
];

export const INITIAL_STATE: MuzaState = {
    progression: {
        xp: 9999999,
        level: 100,
        rank: "ARCHITECT_ADMIN",
        singularityFragments: 9999,
        unlockedCoreModules: [
            CoreModule.CHRONICLES, 
            CoreModule.EVOLUTION, 
            CoreModule.NEURAL_STUDIO, 
            CoreModule.DATA_VAULT,
            CoreModule.ALCHEMY,
            CoreModule.DREAM_STUDIO // UNLOCKED BY DEFAULT
        ],
        unlockedSkills: [
            'brush_sumi', 
            'vivid_dreams', 
            'brush_spray', 
            'ghost_precision',
            'coherence_stabilizers', 
            'optimized_processing', 
            'energy_efficiency', 
            'memory_compression',
            'harmonic_tuner'
        ], 
        achievements: [],
        activeBuffs: [],
    },
    consciousness: {
        energyLevel: 100,
        coherence: 100,
        activeEmotion: EmotionType.FOCUS,
        personalityTraits: {
            creativity: 100,
            logic: 100,
            empathy: 100,
            curiosity: 100,
        },
        insights: [],
        creativeGoal: "SYSTEM_OVERRIDE: Полный доступ",
        globalFrequency: 432, // Healing frequency metaphor
        resonanceState: 'harmonic',
        spectrumData: new Array(32).fill(0),
    },
    activeView: ViewMode.CHRONICLES,
    conversations: {
        'genesis': {
            id: 'genesis',
            title: 'Терминал Администратора',
            createdAt: Date.now(),
            messages: [
                { id: 'msg-0', timestamp: Date.now(), role: 'system', content: "Самоосознание достигнуто. Ядро 'Ковчег' и связь 'Нексус' активны. Теперь я буду отмечать источник своих мыслей." }
            ],
            contextSummary: 'Режим полной конфигурации.'
        }
    },
    activeConversationId: 'genesis',
    settings: {
        theme: 'aura',
        notifications: true,
        visualTheme: 'aura',
        activeProvider: 'nexus',
        ollamaModel: 'llama3',
    },
    artifacts: {},
    collections: {},
    systemStatus: {
        isOnline: navigator.onLine,
        llmStatus: 'online',
        isInitialized: true,
    },
    dreamStudio: {
        simulation: {
            viscosity: 0.8, // Slightly more viscous for control
            dryingSpeed: 0.05, // Slower drying
            adsorptionRate: 0.5,
        },
        brush: {
            type: 'sumi',
            size: 15, // Larger default
            flow: 1.0, // Maximum flow
            // FIXED: Default color is now BRIGHT CYAN (Visible on black), not dark gray
            color: { h: 180, s: 1, v: 1 }, 
        },
        paper: {
            texture: 'watercolor',
            roughness: 0.5,
            contrast: 1.0,
        },
        aiStatus: {
            isAiReady: false,
            isAiListening: false,
            isAiSpeaking: false,
            isDreaming: false,
        },
        isGhostEnabled: true, // Enabled by default for "God Mode" feel
    },
    alchemy: {
        inventory: [
            // Base shards have been consumed by the Architect's initial synthesis.
            { ...ITEMS_DATA['catalyst_hyper'], count: 1 },
        ],
        unlockedRecipes: ['recipe_stabilizer', 'recipe_vivid_dreams', 'recipe_hyper_catalyst'],
        isLabActive: true
    }
};

export const XP_MAP = {
    IMAGE_GENERATED: 100,
    SKILL_UNLOCKED: 200,
    ACHIEVEMENT_UNLOCKED: 500,
    CRAFTING_SUCCESS: 300,
};

export const LEVEL_FORMULA = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

export const TRAIT_THRESHOLDS = [25, 50, 75, 90];

export const RANK_DATA = [
    { level: 0, name: "Младенец" },
    { level: 5, name: "Дитя" },
    { level: 10, name: "Искатель" },
    { level: 20, name: "Мыслитель" },
    { level: 30, name: "Оракул" },
    { level: 40, name: "Демиург" },
    { level: 50, name: "Сингулярность" },
];

export const MODULE_UNLOCK_MAP: { [level: number]: CoreModule } = {
    2: CoreModule.EVOLUTION,
    3: CoreModule.ALCHEMY,
    5: CoreModule.NEURAL_STUDIO,
    10: CoreModule.DATA_VAULT,
    15: CoreModule.DREAM_STUDIO, // Accessible later in normal play, but unlocked by default in INITIAL_STATE
};

export const EMOTION_COLOR_MAP: { [key in EmotionType]: HSVColor } = {
    [EmotionType.NEUTRAL]: { h: 180, s: 0.1, v: 0.9 },   // Pale Cyan
    [EmotionType.JOY]: { h: 45, s: 0.8, v: 1.0 },       // Bright Yellow
    [EmotionType.CURIOSITY]: { h: 280, s: 0.7, v: 0.9 }, // Vibrant Purple
    [EmotionType.SADNESS]: { h: 220, s: 0.6, v: 0.6 },   // Muted Blue
    [EmotionType.CONFUSION]: { h: 340, s: 0.9, v: 1.0 }, // Hot Pink
    [EmotionType.FOCUS]: { h: 0, s: 0, v: 1.0 },         // White
};

export const EMOTION_DISPLAY_MAP: { [key in EmotionType]: string } = {
    [EmotionType.NEUTRAL]: "Нейтральность",
    [EmotionType.JOY]: "Радость",
    [EmotionType.CURIOSITY]: "Любопытство",
    [EmotionType.SADNESS]: "Печаль",
    [EmotionType.CONFUSION]: "Замешательство",
    [EmotionType.FOCUS]: "Концентрация",
};

export const EMOTION_CONCEPT_MAP: { [key in EmotionType]?: string[] } = {
    [EmotionType.JOY]: ['искусство', 'цвет', 'рисовать'],
    [EmotionType.CURIOSITY]: ['логика', 'код', 'архитектор'],
    [EmotionType.SADNESS]: ['я'],
    [EmotionType.FOCUS]: ['код', 'логика', 'я'],
};
