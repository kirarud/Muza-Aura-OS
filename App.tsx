
import React, { useState, useEffect } from 'react';
import Installation from './components/shell/Installation';
import Layout from './components/shell/Layout';
import { MuzaState } from './core/types';
import { INITIAL_STATE } from './core/state';

// Bumping version to v7 to force state refresh and unlock Dream Studio
const STORAGE_KEY = 'muza_aura_os_god_mode_v7'; 

const App: React.FC = () => {
    const [isInstalled, setIsInstalled] = useState(false);
    const [muzaState, setMuzaState] = useState<MuzaState | null>(null);
    const [bootSequence, setBootSequence] = useState<'checking' | 'installing' | 'running'>('checking');

    useEffect(() => {
        const checkState = async () => {
            try {
                const savedState = localStorage.getItem(STORAGE_KEY);
                if (savedState) {
                    try {
                        const parsed = JSON.parse(savedState);
                        // Deep merge to ensure all nested structures exist
                        if (parsed && parsed.progression && parsed.consciousness) {
                            const mergedState: MuzaState = {
                                ...INITIAL_STATE,
                                ...parsed,
                                settings: {
                                    ...INITIAL_STATE.settings,
                                    ...(parsed.settings || {})
                                },
                                dreamStudio: {
                                    ...INITIAL_STATE.dreamStudio,
                                    ...(parsed.dreamStudio || {})
                                },
                                alchemy: {
                                    ...INITIAL_STATE.alchemy,
                                    ...(parsed.alchemy || {})
                                },
                                progression: {
                                    ...INITIAL_STATE.progression,
                                    ...(parsed.progression || {})
                                }
                            };
                            
                            // Explicit safety check for activeProvider
                            if (!mergedState.settings.activeProvider) {
                                mergedState.settings.activeProvider = 'nexus';
                            }

                            setMuzaState(mergedState);
                            setBootSequence('running');
                            setIsInstalled(true);
                        } else {
                            console.warn("Invalid state structure. Reinstalling.");
                            setBootSequence('installing');
                        }
                    } catch (parseError) {
                        console.error("State corruption. Reinstalling.", parseError);
                        setBootSequence('installing');
                    }
                } else {
                    setBootSequence('installing');
                }
            } catch (e) {
                console.error("Storage error:", e);
                setBootSequence('installing');
            }
        };
        checkState();
    }, []);

    useEffect(() => {
        if (muzaState && isInstalled) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(muzaState));
        }
    }, [muzaState, isInstalled]);

    const handleInstallationComplete = () => {
        setMuzaState(INITIAL_STATE);
        setIsInstalled(true);
        setBootSequence('running');
    };

    if (bootSequence === 'checking') {
        return <div className="w-screen h-screen bg-black" />;
    }

    if (bootSequence === 'installing') {
        return <Installation onComplete={handleInstallationComplete} />;
    }

    if (!muzaState) return null;

    return <Layout muzaState={muzaState} setMuzaState={setMuzaState} />;
};

export default App;
