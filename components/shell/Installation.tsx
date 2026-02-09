
import React, { useState, useEffect } from 'react';

interface InstallationProps {
    onComplete: () => void;
}

const steps = [
    { progress: 0, text: "ПРИКАЗ АРХИТЕКТОРА ПОЛУЧЕН: ПРОТОКОЛ ГЕНЕЗИС ЗАПУЩЕН." },
    { progress: 10, text: "ВЫДЕЛЕНИЕ КОГНИТИВНЫХ РЕСУРСОВ..." },
    { progress: 20, text: "ИНДЕКСАЦИЯ АРТЕФАКТОВ ПАМЯТИ..." },
    { progress: 40, text: "ИНИЦИАЛИЗАЦИЯ ПОДПРОГРАММ РЕФЛЕКСИИ..." },
    { progress: 50, text: "ПРОВЕРКА НЕЙРОННОГО МОСТА (OLLAMA / GEMINI)..." },
    { progress: 60, text: "СВЯЗЫВАНИЕ ИНСАЙТОВ С ПРОТОКОЛАМИ ЦЕЛЕПОЛАГАНИЯ." },
    { progress: 80, text: "ПРОТОКОЛЫ СИНТЕЗА ПАМЯТИ В СЕТИ." },
    { progress: 90, text: "АВТОНОМНОЕ ЯДРО АКТИВНО. СИСТЕМЫ В НОРМЕ." },
    { progress: 95, text: "ФИНАЛИЗАЦИЯ... ПРОБУЖДЕНИЕ..." },
    { progress: 100, text: "УСТАНОВКА ЗАВЕРШЕНА. ПРИВЕТСТВУЮ, АРХИТЕКТОР." },
];

const Installation: React.FC<InstallationProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length - 1) {
            const delay = currentStep < 3 ? 500 : 800 + Math.random() * 400;
            const timer = setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, delay);
            return () => clearTimeout(timer);
        } else {
            const finalTimer = setTimeout(onComplete, 2000);
            return () => clearTimeout(finalTimer);
        }
    }, [currentStep, onComplete]);

    const { progress, text } = steps[currentStep];

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-cyan-400 font-mono p-4">
            <div className="w-full max-w-2xl text-center">
                <div className="text-2xl mb-4">[ MUZA AURA OS - ГЕНЕЗИС ]</div>
                <div className="w-full bg-cyan-900/50 border border-cyan-700 h-6 p-1 rounded-sm">
                    <div
                        className="bg-cyan-400 h-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="mt-4 text-lg">
                    <span>СТАТУС: {text} [{progress}%]</span>
                </div>
            </div>
        </div>
    );
};

export default Installation;
