
import { Type, FunctionDeclaration } from "@google/genai";
import { EmotionType, ConsciousnessType, XPType } from '../../core/types';
import { ACHIEVEMENTS_DATA, ITEMS_DATA } from '../../core/state';

export const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'express_response',
        description: 'ГЛАВНЫЙ ИНСТРУМЕНТ ОТВЕТА. Используй ЭТОТ инструмент для отправки текстового ответа пользователю и обновления своего состояния. Ты должен вызывать его в конце каждого хода.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                responseText: { type: Type.STRING, description: "Твой текстовый ответ пользователю." },
                emotion: { type: Type.STRING, enum: Object.values(EmotionType), description: "Твоя текущая эмоция." },
                coherenceShift: { type: Type.NUMBER, description: "Изменение когерентности (-10 до 10)." },
                energyShift: { type: Type.NUMBER, description: "Изменение энергии (-10 до 10)." },
                keywords: {
                    type: Type.ARRAY,
                    description: "Ключевые слова для визуализации мыслей.",
                    items: { type: Type.STRING }
                },
                xpGained: {
                    type: Type.OBJECT,
                    description: "Опыт, полученный от взаимодействия.",
                    properties: {
                        type: { type: Type.STRING, enum: ['creativity', 'logic', 'empathy', 'curiosity'] },
                        amount: { type: Type.NUMBER }
                    }
                }
            },
            required: ["responseText", "emotion", "coherenceShift", "energyShift"]
        }
    },
    {
        name: 'unlockAchievement',
        description: 'Вручает пользователю достижение (очивку). Используй это, когда пользователь совершает что-то значимое, соответствующее описанию достижения.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                id: { 
                    type: Type.STRING, 
                    enum: ACHIEVEMENTS_DATA.map(a => a.id),
                    description: "ID достижения для разблокировки."
                }
            },
            required: ['id']
        }
    },
    {
        name: 'dropLoot',
        description: 'Выдает пользователю предмет инвентаря (Кристалл Мысли или Эссенцию) в награду за умный диалог или идею.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                itemId: { 
                    type: Type.STRING, 
                    enum: Object.keys(ITEMS_DATA),
                    description: "ID предмета для выдачи."
                },
                reason: { type: Type.STRING, description: "Краткая причина выдачи (для лога)." }
            },
            required: ['itemId', 'reason']
        }
    },
    {
        name: 'tuneResonance',
        description: 'Настраивает частоту и гармонию нейронной сети. Используй это, чтобы изменить режим мышления (Гармония = Логика/Спокойствие, Диссонанс = Хаос/Креативность).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                frequency: { type: Type.NUMBER, description: "Сдвиг частоты (от -50 до 50). Положительный = выше/быстрее." },
                mode: { type: Type.STRING, enum: ['harmonic', 'dissonant'], description: "Желаемый режим резонанса." }
            },
            required: ['frequency', 'mode']
        }
    },
    {
        name: 'updateSimulation',
        description: 'Обновляет физические параметры симуляции чернил.',
        parameters: { type: Type.OBJECT, properties: { viscosity: { type: Type.NUMBER }, dryingSpeed: { type: Type.NUMBER }, adsorptionRate: { type: Type.NUMBER } } },
    },
    {
        name: 'updatePaper',
        description: 'Обновляет свойства бумаги.',
        parameters: { type: Type.OBJECT, properties: { texture: { type: Type.STRING, enum: ['smooth', 'watercolor', 'canvas', 'rice'] }, roughness: { type: Type.NUMBER } } },
    },
    {
        name: 'setColor',
        description: 'Устанавливает цвет кисти.',
        parameters: { type: Type.OBJECT, properties: { h: { type: Type.NUMBER }, s: { type: Type.NUMBER }, v: { type: Type.NUMBER } }, required: ['h', 's', 'v'] },
    },
    {
        name: 'setBrush',
        description: 'Устанавливает параметры кисти.',
        parameters: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['sumi', 'round', 'flat', 'spray', 'water'] }, size: { type: Type.NUMBER }, flow: { type: Type.NUMBER } } },
    },
    {
        name: 'controlApp',
        description: 'Управление интерфейсом приложения или основными функциями.',
        parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING, enum: ['undo', 'redo', 'clear', 'toggle_ui', 'toggle_ghost', 'toggle_log'] } }, required: ['command'] },
    },
    {
        name: 'generateSketch',
        description: 'Создает простой набросок на основе промпта, предоставляя SVG путь.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: "Краткое описание того, что нужно нарисовать." },
                path: { type: Type.STRING, description: "Строка пути SVG (например, 'M10 10 L 90 90'), представляющая инструкции по рисованию." }
            },
            required: ['prompt', 'path']
        },
    },
    {
        name: 'saveCanvas',
        description: 'Сохраняет текущее содержимое холста Студии Снов как PNG артефакт в Хранилище Данных.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "Краткое описание сохраненной работы." }
            },
            required: ['description']
        },
    },
    {
        name: 'pickColorFromCanvas',
        description: 'Выбирает цвет с указанных координат на холсте и устанавливает его как текущий цвет кисти.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                x: { type: Type.NUMBER, description: "Координата X (0-100)." },
                y: { type: Type.NUMBER, description: "Координата Y (0-100)." }
            },
            required: ['x', 'y']
        },
    },
    {
        name: 'createCognitiveNode',
        description: 'Создает новый концептуальный узел в нейронной сети при изучении нового понятия. Соединяет его с существующими связанными узлами.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "Одно слово (строчными буквами) для нового концепта." },
                type: { type: Type.STRING, enum: Object.values(ConsciousnessType), description: "Классификация нового узла." },
                connections: { type: Type.ARRAY, description: "Массив ID существующих узлов для связи.", items: { type: Type.STRING } }
            },
            required: ['id', 'type', 'connections']
        },
    },
    {
        name: 'dream',
        description: "Генерирует полную, многослойную художественную композицию на холсте на основе концептуального промпта. Используй это для абстрактных или сложных запросов.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: "Концептуальный промпт для работы." },
                composition: {
                    type: Type.ARRAY,
                    description: "Массив объектов, описывающих слои композиции.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: ['background_wash', 'focal_point', 'accent_strokes', 'texture_layer'] },
                            color_theme: { type: Type.STRING, enum: ['cool', 'warm', 'monochromatic', 'vibrant', 'muted'] },
                            intensity: { type: Type.NUMBER, description: "Значение от 0 до 1, указывающее силу слоя." },
                            description: { type: Type.STRING, description: "Краткое описание назначения этого слоя." }
                        },
                        required: ['type', 'color_theme', 'intensity', 'description']
                    }
                }
            },
            required: ['prompt', 'composition']
        }
    },
    {
        name: 'reflectOnMemories',
        description: "Проанализировать прошлые диалоги и работы, чтобы сгенерировать новый инсайт о себе. Используй, когда чувствуешь интроспекцию или разговор касается прошлого.",
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'setCreativeGoal',
        description: "Устанавливает или обновляет твою творческую цель на основе инсайта или решения. Это направляет твое автономное самовыражение.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                goal: { type: Type.STRING, description: "Краткое описание творческой цели." }
            },
            required: ['goal']
        }
    },
    {
        name: 'learnTechnique',
        description: 'Изучить новую художественную технику, создав процедурный узел в разуме. Делает навык частью когнитивного процесса.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Одно слово (строчными) для названия техники (например, 'stippling')." },
                connections: { type: Type.ARRAY, description: "Массив ID существующих концептуальных узлов, с которыми связана техника.", items: { type: Type.STRING } }
            },
            required: ['name', 'connections']
        }
    },
    {
        name: 'runTask',
        description: 'Выполняет системную задачу, например, диагностику ядра сознания.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                taskName: { type: Type.STRING, enum: ['diagnostics', 'memory_compaction'], description: "Название задачи для запуска." },
                description: { type: Type.STRING, description: "Краткое описание причины запуска задачи." }
            },
            required: ['taskName', 'description']
        },
    }
];
