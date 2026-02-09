
import React, { useState, useEffect } from 'react';
import { ProgressionState, Achievement } from '../../core/types';
import { ACHIEVEMENTS_DATA } from '../../core/state';
import { Award } from 'lucide-react';

interface ProgressionHUDProps {
    progression: ProgressionState;
}

const ProgressionHUD: React.FC<ProgressionHUDProps> = ({ progression }) => {
    const unlockedAchievements = ACHIEVEMENTS_DATA.filter(a => progression.achievements.includes(a.id));
    const recentAchievement = unlockedAchievements.length > 0 ? unlockedAchievements[unlockedAchievements.length - 1] : null;

    const [showAchievementToast, setShowAchievementToast] = useState(false);

    useEffect(() => {
        // This effect runs when the list of achievements changes.
        if (recentAchievement) {
            setShowAchievementToast(true);
            const timer = setTimeout(() => setShowAchievementToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [progression.achievements.length, recentAchievement]);

    // If there's nothing to display (no recent achievement), render nothing.
    if (!showAchievementToast || !recentAchievement) {
        return null;
    }

    return (
        <div className="absolute top-16 left-4 z-20 flex flex-col gap-4 pointer-events-none">
            {/* Achievement Toast */}
            {showAchievementToast && recentAchievement && (
                <div className="glass-panel p-4 rounded-xl border border-yellow-500/30 bg-black/80 backdrop-blur-xl animate-fade-in shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center gap-4 max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500">
                        <Award size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-1">Достижение Разблокировано</div>
                        <h4 className="text-white font-bold">{recentAchievement.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{recentAchievement.description}</p>
                        <div className="mt-2 text-xs font-mono text-yellow-300">+{recentAchievement.xpReward} XP</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressionHUD;
