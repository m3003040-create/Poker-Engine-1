window.DEFAULT_AI_CONFIG = {
    aggressionBase: 5,
    aggressionRange: { min: 1, max: 10 },
    bluffFrequency: 0.2,
    tightThreshold: 0.3,
    looseThreshold: 0.7,
    callThreshold: 0.4,
    raiseThreshold: 0.6,
    allInThreshold: 0.9,
    minRaiseMultiplier: 2,
    maxRaiseMultiplier: 5,
    positionWeight: 1.2,
    potOddsWeight: 1.0,
    handStrengthWeight: 1.5,
    stackSizeWeight: 0.8,
    bluffSensitivity: 0.5,
    adaptiveLearningRate: 0.1,
    memorySize: 100,
    useMonteCarlo: false,
    monteCarloIterations: 1000,
    simulationSpeed: 'fast',
    exploitOpponents: true,
    useHandRanges: true,
    randomFactor: 0.1,
    aggressionDecay: 0.95,
    tiltFactor: 0.0,
    experienceGain: 0.05
};

window.AI_STYLES = {
    TIGHT: 'tight',
    AGGRESSIVE: 'aggressive',
    RANDOM: 'random',
    ADAPTIVE: 'adaptive',
    MANIAC: 'maniac',
    CALLING_STATION: 'calling_station',
    ROCK: 'rock',
    MOUSE: 'mouse',
    LAG: 'lag',
    TAG: 'tag'
};

window.AI_STYLE_NAMES = {
    [window.AI_STYLES.TIGHT]: 'Тайтовый',
    [window.AI_STYLES.AGGRESSIVE]: 'Агрессивный',
    [window.AI_STYLES.RANDOM]: 'Случайный',
    [window.AI_STYLES.ADAPTIVE]: 'Адаптивный',
    [window.AI_STYLES.MANIAC]: 'Маниак',
    [window.AI_STYLES.CALLING_STATION]: 'Колл-стейшн',
    [window.AI_STYLES.ROCK]: 'Скала',
    [window.AI_STYLES.MOUSE]: 'Мышь',
    [window.AI_STYLES.LAG]: 'Лузово-агрессивный',
    [window.AI_STYLES.TAG]: 'Тайтово-агрессивный'
};

window.getAIConfig = function() {
    const saved = window.loadFromStorage('aiConfig');
    if (saved) return { ...window.DEFAULT_AI_CONFIG, ...saved };
    return { ...window.DEFAULT_AI_CONFIG };
};

window.setAIConfig = function(newConfig) {
    const current = window.getAIConfig();
    const updated = { ...current, ...newConfig };
    window.saveToStorage('aiConfig', updated);
    return updated;
};

window.resetAIConfig = function() {
    window.saveToStorage('aiConfig', window.DEFAULT_AI_CONFIG);
    return { ...window.DEFAULT_AI_CONFIG };
};

window.getAIAggression = function() {
    return window.getAIConfig().aggressionBase;
};

window.setAIAggression = function(value) {
    const config = window.getAIConfig();
    config.aggressionBase = Math.min(config.aggressionRange.max, Math.max(config.aggressionRange.min, value));
    window.setAIConfig(config);
};

window.getAIBluffFrequency = function() {
    return window.getAIConfig().bluffFrequency;
};

window.setAIBluffFrequency = function(value) {
    const config = window.getAIConfig();
    config.bluffFrequency = Math.min(1, Math.max(0, value));
    window.setAIConfig(config);
};

window.getAICallThreshold = function() {
    return window.getAIConfig().callThreshold;
};

window.getAIRaiseThreshold = function() {
    return window.getAIConfig().raiseThreshold;
};

window.getAIAllInThreshold = function() {
    return window.getAIConfig().allInThreshold;
};

window.getAITightThreshold = function() {
    return window.getAIConfig().tightThreshold;
};

window.getAILooseThreshold = function() {
    return window.getAIConfig().looseThreshold;
};

window.getAIPositionWeight = function() {
    return window.getAIConfig().positionWeight;
};

window.getAIPotOddsWeight = function() {
    return window.getAIConfig().potOddsWeight;
};

window.getAIHandStrengthWeight = function() {
    return window.getAIConfig().handStrengthWeight;
};

window.getAIStackSizeWeight = function() {
    return window.getAIConfig().stackSizeWeight;
};

window.getAIBluffSensitivity = function() {
    return window.getAIConfig().bluffSensitivity;
};

window.getAIAdaptiveLearningRate = function() {
    return window.getAIConfig().adaptiveLearningRate;
};

window.getAIMemorySize = function() {
    return window.getAIConfig().memorySize;
};

window.isAIMonteCarloEnabled = function() {
    return window.getAIConfig().useMonteCarlo;
};

window.getAIMonteCarloIterations = function() {
    return window.getAIConfig().monteCarloIterations;
};

window.isAIExploitOpponents = function() {
    return window.getAIConfig().exploitOpponents;
};

window.isAIUseHandRanges = function() {
    return window.getAIConfig().useHandRanges;
};

window.getAIRandomFactor = function() {
    return window.getAIConfig().randomFactor;
};

window.getAIAggressionDecay = function() {
    return window.getAIConfig().aggressionDecay;
};

window.getAITiltFactor = function() {
    return window.getAIConfig().tiltFactor;
};

window.getAIExperienceGain = function() {
    return window.getAIConfig().experienceGain;
};

window.getAIStyleConfig = function(style) {
    const base = window.getAIConfig();
    switch (style) {
        case window.AI_STYLES.TIGHT:
            return { ...base, aggressionBase: 3, bluffFrequency: 0.05, callThreshold: 0.3, raiseThreshold: 0.7, allInThreshold: 0.95 };
        case window.AI_STYLES.AGGRESSIVE:
            return { ...base, aggressionBase: 8, bluffFrequency: 0.35, callThreshold: 0.2, raiseThreshold: 0.4, allInThreshold: 0.7 };
        case window.AI_STYLES.RANDOM:
            return { ...base, randomFactor: 0.8, aggressionBase: 5, bluffFrequency: 0.5 };
        case window.AI_STYLES.ADAPTIVE:
            return { ...base, adaptiveLearningRate: 0.15, exploitOpponents: true };
        case window.AI_STYLES.MANIAC:
            return { ...base, aggressionBase: 10, bluffFrequency: 0.7, raiseThreshold: 0.2, allInThreshold: 0.5 };
        case window.AI_STYLES.CALLING_STATION:
            return { ...base, aggressionBase: 2, bluffFrequency: 0.01, callThreshold: 0.8, raiseThreshold: 0.95, allInThreshold: 0.98 };
        case window.AI_STYLES.ROCK:
            return { ...base, aggressionBase: 2, bluffFrequency: 0.02, callThreshold: 0.2, raiseThreshold: 0.9, allInThreshold: 0.97, tightThreshold: 0.2 };
        case window.AI_STYLES.MOUSE:
            return { ...base, aggressionBase: 1, bluffFrequency: 0.0, callThreshold: 0.1, raiseThreshold: 0.95, allInThreshold: 0.99 };
        case window.AI_STYLES.LAG:
            return { ...base, aggressionBase: 8, bluffFrequency: 0.4, callThreshold: 0.3, raiseThreshold: 0.5, allInThreshold: 0.75, looseThreshold: 0.5 };
        case window.AI_STYLES.TAG:
            return { ...base, aggressionBase: 7, bluffFrequency: 0.2, callThreshold: 0.35, raiseThreshold: 0.6, allInThreshold: 0.85, tightThreshold: 0.4 };
        default:
            return base;
    }
};

window.getAIPlayerConfig = function(playerIndex, style) {
    const base = window.getAIStyleConfig(style);
    const seed = (playerIndex * 12345) % 1000 / 1000;
    const variant = { ...base };
    variant.aggressionBase = Math.min(base.aggressionRange.max, Math.max(base.aggressionRange.min, base.aggressionBase + (seed - 0.5) * 2));
    variant.bluffFrequency = Math.min(1, Math.max(0, base.bluffFrequency + (seed - 0.5) * 0.2));
    return variant;
};

window.getAIActionProbabilities = function(config, handStrength, potOdds, position, stackSize, gamePhase) {
    let callProb = config.callThreshold;
    let raiseProb = config.raiseThreshold;
    let allInProb = config.allInThreshold;
    if (handStrength > 0.8) {
        callProb *= 0.5;
        raiseProb *= 1.2;
        allInProb *= 1.1;
    } else if (handStrength < 0.3) {
        callProb *= 0.8;
        raiseProb *= 0.5;
        allInProb *= 0.3;
    }
    if (position === 'late') {
        callProb *= 0.9;
        raiseProb *= 1.2;
    } else if (position === 'early') {
        callProb *= 1.1;
        raiseProb *= 0.8;
    }
    if (stackSize < 10) {
        callProb *= 1.2;
        raiseProb *= 1.5;
        allInProb *= 1.5;
    }
    if (potOdds > 3) callProb *= 1.3;
    if (potOdds < 1) callProb *= 0.7;
    callProb = Math.min(1, Math.max(0, callProb));
    raiseProb = Math.min(1, Math.max(0, raiseProb));
    allInProb = Math.min(1, Math.max(0, allInProb));
    return { call: callProb, raise: raiseProb, allIn: allInProb };
};

window.getAIBluffAdjustment = function(config, handStrength) {
    if (handStrength > 0.7) return 1.0;
    if (handStrength < 0.3) return config.bluffFrequency;
    return 0.5;
};

window.getAIPositionAdjustment = function(position) {
    if (position === 'button') return 1.3;
    if (position === 'cutoff') return 1.2;
    if (position === 'hijack') return 1.1;
    if (position === 'small_blind') return 0.9;
    if (position === 'big_blind') return 0.95;
    return 1.0;
};

window.getAIPotOddsThreshold = function(potOdds, callAmount, stackSize) {
    if (callAmount > stackSize * 0.3) return 2.0;
    if (callAmount > stackSize * 0.1) return 1.5;
    return 1.0;
};

window.getAIHandStrengthFromPreflop = function(card1, card2) {
    const v1 = window.getRankValue(card1.rank);
    const v2 = window.getRankValue(card2.rank);
    const isPair = (v1 === v2);
    const isSuited = (card1.suit === card2.suit);
    let score = 0;
    if (isPair) {
        if (v1 >= 14) score = 1.0;
        else if (v1 >= 13) score = 0.95;
        else if (v1 >= 12) score = 0.9;
        else if (v1 >= 11) score = 0.85;
        else if (v1 >= 10) score = 0.8;
        else if (v1 >= 9) score = 0.7;
        else if (v1 >= 8) score = 0.6;
        else if (v1 >= 7) score = 0.5;
        else score = 0.4;
    } else {
        const high = Math.max(v1, v2);
        const low = Math.min(v1, v2);
        if (high === 14 && low >= 13) score = 0.9;
        else if (high === 14 && low >= 12) score = 0.85;
        else if (high === 14 && low >= 11) score = 0.8;
        else if (high === 14 && low >= 10) score = 0.75;
        else if (high === 14 && low >= 9) score = 0.7;
        else if (high === 13 && low >= 12) score = 0.8;
        else if (high === 13 && low >= 11) score = 0.75;
        else if (high === 13 && low >= 10) score = 0.7;
        else if (high === 12 && low >= 11) score = 0.75;
        else if (high === 12 && low >= 10) score = 0.7;
        else if (high === 11 && low >= 10) score = 0.65;
        else if (high - low <= 2 && high >= 10) score = 0.6;
        else if (high - low <= 3 && high >= 11) score = 0.55;
        else if (high - low <= 4 && high >= 12) score = 0.5;
        else if (high - low <= 5 && high >= 13) score = 0.45;
        else score = 0.3 + (high - low) / 20;
        if (isSuited) score += 0.1;
    }
    return Math.min(1, Math.max(0, score));
};

window.getAIHandStrengthFromPostflop = function(playerHand, communityCards) {
    const allCards = [...playerHand, ...communityCards];
    const evaluation = window.evaluateHand(allCards);
    const rank = evaluation.rank;
    if (rank === 10) return 1.0;
    if (rank === 9) return 0.95;
    if (rank === 8) return 0.9;
    if (rank === 7) return 0.8;
    if (rank === 6) return 0.7;
    if (rank === 5) return 0.6;
    if (rank === 4) return 0.5;
    if (rank === 3) return 0.4;
    if (rank === 2) return 0.3;
    return 0.2;
};

window.getAIMonteCarloStrength = function(playerHand, communityCards, opponents, iterations) {
    if (!window.isAIMonteCarloEnabled()) return null;
    const deck = new window.Deck();
    const knownCards = [...playerHand, ...communityCards];
    for (let card of knownCards) deck.removeCard(card);
    let wins = 0;
    for (let i = 0; i < iterations; i++) {
        const simDeck = deck.clone();
        simDeck.shuffle();
        const simCommunity = [...communityCards];
        let need = 5 - communityCards.length;
        for (let j = 0; j < need; j++) simCommunity.push(simDeck.draw());
        const myEval = window.evaluateHand([...playerHand, ...simCommunity]);
        let bestOpp = null;
        for (let opp of opponents) {
            if (opp.folded) continue;
            const oppCards = [simDeck.draw(), simDeck.draw()];
            const oppEval = window.evaluateHand([...oppCards, ...simCommunity]);
            if (!bestOpp || oppEval.compareTo(bestOpp) > 0) bestOpp = oppEval;
        }
        if (!bestOpp || myEval.compareTo(bestOpp) >= 0) wins++;
    }
    return wins / iterations;
};

window.getAIDecision = function(player, handStrength, potOdds, callAmount, currentBet, stackSize, position, gamePhase, opponents) {
    const config = player.aiConfig || window.getAIConfig();
    let decision = { action: window.GameAction.FOLD, amount: 0 };
    if (handStrength === undefined) handStrength = 0.5;
    let randomFactor = config.randomFactor;
    const bluffAdjust = window.getAIBluffAdjustment(config, handStrength);
    let adjHandStrength = handStrength * (1 - bluffAdjust) + bluffAdjust * (Math.random() * 0.5);
    adjHandStrength = Math.min(1, Math.max(0, adjHandStrength));
    const positionAdj = window.getAIPositionAdjustment(position);
    adjHandStrength *= positionAdj;
    const potOddsAdj = potOdds > 0 ? Math.min(2, potOdds / callAmount) : 1;
    adjHandStrength *= (1 + potOddsAdj * 0.2);
    const stackAdj = stackSize < 20 ? 1.2 : 1.0;
    adjHandStrength *= stackAdj;
    if (callAmount === 0) {
        if (adjHandStrength > config.callThreshold * 0.8) {
            return { action: window.GameAction.CHECK, amount: 0 };
        } else {
            return { action: window.GameAction.CHECK, amount: 0 };
        }
    }
    if (adjHandStrength > config.allInThreshold) {
        return { action: window.GameAction.ALL_IN, amount: window.getActionAllInAmount(player) };
    } else if (adjHandStrength > config.raiseThreshold) {
        let raiseSize = callAmount * (config.minRaiseMultiplier + Math.random() * (config.maxRaiseMultiplier - config.minRaiseMultiplier));
        raiseSize = Math.min(raiseSize, player.chips);
        raiseSize = Math.max(raiseSize, config.minRaiseMultiplier * callAmount);
        return { action: window.GameAction.RAISE, amount: raiseSize };
    } else if (adjHandStrength > config.callThreshold) {
        return { action: window.GameAction.CALL, amount: window.getActionCallAmount(player, currentBet) };
    } else {
        if (Math.random() < config.bluffFrequency * 0.5) {
            let bluffRaise = callAmount * 2;
            bluffRaise = Math.min(bluffRaise, player.chips);
            return { action: window.GameAction.RAISE, amount: bluffRaise };
        }
        return { action: window.GameAction.FOLD, amount: 0 };
    }
};

window.updateAIExperience = function(ai, action, result, potWon) {
    if (!ai.experience) ai.experience = { hands: 0, wins: 0, losses: 0 };
    ai.experience.hands++;
    if (result === 'win') ai.experience.wins++;
    else if (result === 'loss') ai.experience.losses++;
    if (potWon > 0) ai.experience.winnings = (ai.experience.winnings || 0) + potWon;
    const winRate = ai.experience.wins / ai.experience.hands;
    if (ai.aiConfig && ai.aiConfig.adaptiveLearningRate) {
        const lr = ai.aiConfig.adaptiveLearningRate;
        ai.aiConfig.callThreshold = Math.min(1, Math.max(0, ai.aiConfig.callThreshold + lr * (winRate - 0.5) * 0.1));
        ai.aiConfig.raiseThreshold = Math.min(1, Math.max(0, ai.aiConfig.raiseThreshold + lr * (winRate - 0.5) * 0.05));
    }
};

window.getAIOpponentProfile = function(player, opponents) {
    const profile = { tightness: 0.5, aggression: 0.5, bluffRate: 0.2 };
    if (!player.opponentStats) return profile;
    const stats = player.opponentStats;
    let totalHands = 0;
    let totalFolds = 0;
    let totalRaises = 0;
    for (let oppId in stats) {
        totalHands += stats[oppId].handsSeen || 0;
        totalFolds += stats[oppId].folds || 0;
        totalRaises += stats[oppId].raises || 0;
    }
    if (totalHands > 0) {
        profile.tightness = 1 - (totalFolds / totalHands);
        profile.aggression = totalRaises / totalHands;
    }
    return profile;
};

window.getAIPlayerStyleFromIndex = function(index) {
    const styles = [
        window.AI_STYLES.TIGHT,
        window.AI_STYLES.AGGRESSIVE,
        window.AI_STYLES.RANDOM,
        window.AI_STYLES.ADAPTIVE,
        window.AI_STYLES.LAG,
        window.AI_STYLES.TAG
    ];
    return styles[index % styles.length];
};

window.getAIConfigForPlayer = function(index, styleOverride) {
    const style = styleOverride || window.getAIPlayerStyleFromIndex(index);
    return window.getAIPlayerConfig(index, style);
};

window.DEFAULT_AI_CONFIG = window.DEFAULT_AI_CONFIG;
window.AI_STYLES = window.AI_STYLES;
window.AI_STYLE_NAMES = window.AI_STYLE_NAMES;
window.getAIConfig = window.getAIConfig;
window.setAIConfig = window.setAIConfig;
window.resetAIConfig = window.resetAIConfig;
window.getAIAggression = window.getAIAggression;
window.setAIAggression = window.setAIAggression;
window.getAIBluffFrequency = window.getAIBluffFrequency;
window.setAIBluffFrequency = window.setAIBluffFrequency;
window.getAICallThreshold = window.getAICallThreshold;
window.getAIRaiseThreshold = window.getAIRaiseThreshold;
window.getAIAllInThreshold = window.getAIAllInThreshold;
window.getAITightThreshold = window.getAITightThreshold;
window.getAILooseThreshold = window.getAILooseThreshold;
window.getAIPositionWeight = window.getAIPositionWeight;
window.getAIPotOddsWeight = window.getAIPotOddsWeight;
window.getAIHandStrengthWeight = window.getAIHandStrengthWeight;
window.getAIStackSizeWeight = window.getAIStackSizeWeight;
window.getAIBluffSensitivity = window.getAIBluffSensitivity;
window.getAIAdaptiveLearningRate = window.getAIAdaptiveLearningRate;
window.getAIMemorySize = window.getAIMemorySize;
window.isAIMonteCarloEnabled = window.isAIMonteCarloEnabled;
window.getAIMonteCarloIterations = window.getAIMonteCarloIterations;
window.isAIExploitOpponents = window.isAIExploitOpponents;
window.isAIUseHandRanges = window.isAIUseHandRanges;
window.getAIRandomFactor = window.getAIRandomFactor;
window.getAIAggressionDecay = window.getAIAggressionDecay;
window.getAITiltFactor = window.getAITiltFactor;
window.getAIExperienceGain = window.getAIExperienceGain;
window.getAIStyleConfig = window.getAIStyleConfig;
window.getAIPlayerConfig = window.getAIPlayerConfig;
window.getAIActionProbabilities = window.getAIActionProbabilities;
window.getAIBluffAdjustment = window.getAIBluffAdjustment;
window.getAIPositionAdjustment = window.getAIPositionAdjustment;
window.getAIPotOddsThreshold = window.getAIPotOddsThreshold;
window.getAIHandStrengthFromPreflop = window.getAIHandStrengthFromPreflop;
window.getAIHandStrengthFromPostflop = window.getAIHandStrengthFromPostflop;
window.getAIMonteCarloStrength = window.getAIMonteCarloStrength;
window.getAIDecision = window.getAIDecision;
window.updateAIExperience = window.updateAIExperience;
window.getAIOpponentProfile = window.getAIOpponentProfile;
window.getAIPlayerStyleFromIndex = window.getAIPlayerStyleFromIndex;
window.getAIConfigForPlayer = window.getAIConfigForPlayer;

console.log('config_ai.js loaded');
