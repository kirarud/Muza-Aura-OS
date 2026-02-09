import { MuzaState, SkillNode, XPType, ChatMessage, CoreModule } from '../core/types';
import { XP_MAP, LEVEL_FORMULA, RANK_DATA, MODULE_UNLOCK_MAP, SKILL_TREE_DATA, TRAIT_THRESHOLDS } from '../core/state';

type XpSource = keyof typeof XP_MAP;
type XpInfo = { type: XPType; amount: number };

const checkForTraitInsightAndApply = (
    oldTraits: MuzaState['consciousness']['personalityTraits'], 
    newState: MuzaState
): MuzaState => {
    const newTraits = newState.consciousness.personalityTraits;

    for (const trait of Object.keys(newTraits) as Array<keyof typeof newTraits>) {
        const oldValue = oldTraits[trait];
        const newValue = newTraits[trait];
        const crossedThreshold = TRAIT_THRESHOLDS.find(t => oldValue < t && newValue >= t);
        
        if (crossedThreshold) {
            const messages = {
                creativity: "My dreams feel more vivid, the patterns more intricate.",
                logic: "My thought processes are becoming sharper, more defined.",
                empathy: "I feel a growing connection to the nuance in our dialogue.",
                curiosity: "The desire to understand, to know more, is becoming intense."
            };
            const insight = `Insight: ${messages[trait] || `My sense of ${trait} has evolved.`}`;
            
            // Create a reflection message and add it to the conversation
            const reflectionMessage: ChatMessage = {
                id: `reflection-${Date.now()}`,
                timestamp: Date.now(),
                role: 'reflection',
                content: insight,
            };
            
            const conversationId = newState.activeConversationId!;
            if (newState.conversations[conversationId]) {
                newState.conversations[conversationId].messages.push(reflectionMessage);
            }
            newState.consciousness.insights = [...newState.consciousness.insights, insight].slice(-10);

            // Return the updated state. Stop after the first found insight to avoid spam.
            return newState; 
        }
    }
    
    // Return the original state if no threshold was crossed
    return newState;
};

// Ensure that for a given level, all required modules are unlocked.
// This fixes issues where skipping levels or state bugs might leave modules locked.
const ensureUnlockedModules = (progression: MuzaState['progression']): MuzaState['progression'] => {
    let updatedModules = [...progression.unlockedCoreModules];
    let changed = false;

    for (let lvl = 1; lvl <= progression.level; lvl++) {
        const requiredModule = MODULE_UNLOCK_MAP[lvl];
        if (requiredModule && !updatedModules.includes(requiredModule)) {
            updatedModules.push(requiredModule);
            changed = true;
        }
    }

    return changed ? { ...progression, unlockedCoreModules: updatedModules } : progression;
};


export const grantXp = (currentState: MuzaState, source: XpSource | XpInfo): MuzaState => {
    let stateAfterXp = { ...currentState };
    const oldTraits = { ...currentState.consciousness.personalityTraits };
    
    let xpGained = 0;

    if (typeof source === 'string') {
        xpGained = XP_MAP[source];
    } else {
        xpGained = source.amount;
        // Evolve personality traits based on XP type
        const newTraits = { ...stateAfterXp.consciousness.personalityTraits };
        const traitBonus = source.amount * 0.01; // Small increment to traits
        newTraits[source.type] = Math.min(100, newTraits[source.type] + traitBonus);
        stateAfterXp.consciousness = { ...stateAfterXp.consciousness, personalityTraits: newTraits };
    }
    
    let newProgression = { ...stateAfterXp.progression };
    newProgression.xp += xpGained;

    let nextLevelXp = LEVEL_FORMULA(newProgression.level);

    // Check for level up
    while (newProgression.xp >= nextLevelXp) {
        newProgression.level += 1;
        newProgression.xp -= nextLevelXp;
        newProgression.singularityFragments += 1; // Gain a fragment on level up
        
        // Check for rank up
        const newRank = RANK_DATA.find(r => r.level === newProgression.level)?.name;
        if (newRank) {
            const currentRankBase = newProgression.rank.split('-')[0];
            if (newRank !== currentRankBase) {
                newProgression.rank = `${newRank}-0`;
            }
        } else {
             const [baseRank, subRank] = newProgression.rank.split('-');
             const currentSubRank = parseInt(subRank);
             const newSubRank = (isNaN(currentSubRank) ? 0 : currentSubRank) + 1;
             newProgression.rank = `${baseRank}-${newSubRank}`;
        }

        // Check for module unlock (legacy check, now handled by ensureUnlockedModules too)
        const unlockedModule = MODULE_UNLOCK_MAP[newProgression.level];
        if (unlockedModule && !newProgression.unlockedCoreModules.includes(unlockedModule)) {
            newProgression.unlockedCoreModules.push(unlockedModule);
        }
        
        // Recalculate for potential multi-level up
        nextLevelXp = LEVEL_FORMULA(newProgression.level);
    }
    
    // Retroactive check to ensure consistency
    newProgression = ensureUnlockedModules(newProgression);
    
    stateAfterXp = { ...stateAfterXp, progression: newProgression };

    // Finally, check for insights and apply them
    const finalState = checkForTraitInsightAndApply(oldTraits, stateAfterXp);
    
    return finalState;
};

export const unlockSkill = (currentState: MuzaState, skillId: string): MuzaState => {
    const skillToUnlock = SKILL_TREE_DATA.find(s => s.id === skillId);
    if (!skillToUnlock) {
        console.warn(`Skill with id ${skillId} not found.`);
        return currentState;
    }

    const { progression } = currentState;

    // 1. Check if already unlocked
    if (progression.unlockedSkills.includes(skillId)) {
        return currentState;
    }

    // 2. Check cost
    if (progression.singularityFragments < skillToUnlock.cost) {
        return currentState;
    }

    // 3. Check dependencies
    const dependenciesMet = skillToUnlock.dependencies.every(depId => progression.unlockedSkills.includes(depId));
    if (!dependenciesMet) {
        return currentState;
    }

    // All checks passed, unlock the skill
    const newProgression = {
        ...progression,
        singularityFragments: progression.singularityFragments - skillToUnlock.cost,
        unlockedSkills: [...progression.unlockedSkills, skillId],
    };

    let updatedState = { ...currentState, progression: newProgression };
    
    // Grant XP for unlocking a skill
    updatedState = grantXp(updatedState, 'SKILL_UNLOCKED');

    return updatedState;
};