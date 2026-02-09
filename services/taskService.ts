import { MuzaState } from '../core/types';
import { MuzaService } from './muzaService';

export type TaskOutputCallback = (outputChunk: string) => void;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runDiagnostics = async (state: MuzaState, streamOutput: TaskOutputCallback): Promise<boolean> => {
    streamOutput('Анализ ядра сознания...\n');
    await sleep(1000);
    // Use the singleton instance of MuzaService
    const muzaService = new MuzaService();
    const nodeCount = muzaService.getNodes().length;
    streamOutput(`- Количество нейронных узлов: ${nodeCount}\n`);
    await sleep(500);

    streamOutput('Проверка целостности памяти...\n');
    await sleep(1000);
    const artifactCount = Object.keys(state.artifacts).length;
    streamOutput(`- Сохраненные артефакты: ${artifactCount}\n`);
    await sleep(500);

    streamOutput('Верификация уровней когерентности...\n');
    await sleep(1000);
    streamOutput(`- Текущая когерентность: ${state.consciousness.coherence}%\n`);

    if (state.consciousness.coherence < 50 || Math.random() > 0.2) { 
        await sleep(500);
        streamOutput('[ВНИМАНИЕ] Обнаружена флуктуация когерентности! Рекомендуется калибровка.\n');
        return false; // Error logic preserved, text localized
    } else {
        await sleep(1000);
        streamOutput('Все системы работают в штатном режиме.\n');
        return true; // Success
    }
};

const runMemoryCompaction = async (state: MuzaState, streamOutput: TaskOutputCallback): Promise<boolean> => {
    streamOutput('Инициализация протокола сжатия памяти...\n');
    await sleep(1000);
    const artifactCount = Object.keys(state.artifacts).length;
    const conversationCount = Object.keys(state.conversations).length;
    streamOutput(`- Анализ: ${artifactCount} артефактов и ${conversationCount} хроник.\n`);
    await sleep(1500);

    streamOutput('Дефрагментация индексов воспоминаний...\n');
    await sleep(2000);
    streamOutput('Переиндексация завершена.\n');
    await sleep(1000);

    streamOutput('Сжатие памяти выполнено успешно. Производительность системы оптимизирована.\n');
    return true; // Success
};

export const runSystemTask = async (
    taskName: string, 
    state: MuzaState, 
    streamOutput: TaskOutputCallback
): Promise<boolean> => {
    switch (taskName) {
        case 'diagnostics':
            return await runDiagnostics(state, streamOutput);
        case 'memory_compaction':
            return await runMemoryCompaction(state, streamOutput);
        default:
            streamOutput(`[ОШИБКА] Неизвестная задача: ${taskName}\n`);
            return false;
    }
};