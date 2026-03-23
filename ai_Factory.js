window.AIFactory = class AIFactory {
    constructor() {
        this.aiInstances = new Map();
        this.defaultConfig = window.getAIConfig();
        this.styleConstructors = {
            [window.AI_STYLES.TIGHT]: window.AITight,
            [window.AI_STYLES.AGGRESSIVE]: window.AIAggressive,
            [window.AI_STYLES.RANDOM]: window.AIRandom,
            [window.AI_STYLES.ADAPTIVE]: window.AIAdaptive,
            [window.AI_STYLES.MANIAC]: null,
            [window.AI_STYLES.CALLING_STATION]: null,
            [window.AI_STYLES.ROCK]: null,
            [window.AI_STYLES.MOUSE]: null,
            [window.AI_STYLES.LAG]: null,
            [window.AI_STYLES.TAG]: null
        };
        this.styleFallbacks = {
            [window.AI_STYLES.MANIAC]: window.AIAggressive,
            [window.AI_STYLES.CALLING_STATION]: window.AITight,
            [window.AI_STYLES.ROCK]: window.AITight,
            [window.AI_STYLES.MOUSE]: window.AITight,
            [window.AI_STYLES.LAG]: window.AIAggressive,
            [window.AI_STYLES.TAG]: window.AIAdaptive
        };
    }

    createAI(player, style = null, config = null) {
        if (!player) return null;
        const aiStyle = style || player.aiStyle || window.getAIPlayerStyleFromIndex(player.id);
        let Constructor = this.styleConstructors[aiStyle];
        if (!Constructor) {
            Constructor = this.styleFallbacks[aiStyle];
            if (!Constructor) Constructor = window.AIBase;
        }
        const aiConfig = config || player.aiConfig || window.getAIConfigForPlayer(player.id, aiStyle);
        const ai = new Constructor(player, aiConfig);
        ai.style = aiStyle;
        this.aiInstances.set(player.id, ai);
        return ai;
    }

    getAIForPlayer(player) {
        if (!player) return null;
        if (this.aiInstances.has(player.id)) return this.aiInstances.get(player.id);
        return this.createAI(player);
    }

    removeAIForPlayer(playerId) {
        this.aiInstances.delete(playerId);
    }

    clearAllAI() {
        this.aiInstances.clear();
    }

    createAIPlayer(id, name, chips, style = null, config = null) {
        const player = new window.AIPlayer(id, name, chips, style);
        const ai = this.createAI(player, style, config);
        player.ai = ai;
        return player;
    }

    createAIPlayers(count, startChips, baseNames = ['AI']) {
        const players = [];
        const styles = Object.values(window.AI_STYLES).filter(s => s !== window.AI_STYLES.ADAPTIVE);
        for (let i = 0; i < count; i++) {
            const style = styles[i % styles.length];
            const name = `${baseNames[i % baseNames.length]}${Math.floor(i / baseNames.length) + 1} (${window.AI_STYLE_NAMES[style]})`;
            const player = this.createAIPlayer(i + 1, name, startChips, style);
            players.push(player);
        }
        return players;
    }

    createMixedAIPlayers(count, startChips) {
        const players = [];
        const styleDistribution = [
            window.AI_STYLES.TIGHT,
            window.AI_STYLES.AGGRESSIVE,
            window.AI_STYLES.RANDOM,
            window.AI_STYLES.ADAPTIVE,
            window.AI_STYLES.LAG,
            window.AI_STYLES.TAG,
            window.AI_STYLES.MANIAC,
            window.AI_STYLES.CALLING_STATION
        ];
        for (let i = 0; i < count; i++) {
            const style = styleDistribution[i % styleDistribution.length];
            const name = `AI ${i + 1} (${window.AI_STYLE_NAMES[style] || style})`;
            const player = this.createAIPlayer(i + 1, name, startChips, style);
            players.push(player);
        }
        return players;
    }

    createTournamentAIPlayers(count, startChips, level = 'medium') {
        const players = [];
        let styles = [];
        if (level === 'easy') {
            styles = [window.AI_STYLES.RANDOM, window.AI_STYLES.CALLING_STATION, window.AI_STYLES.MOUSE];
        } else if (level === 'medium') {
            styles = [window.AI_STYLES.TIGHT, window.AI_STYLES.AGGRESSIVE, window.AI_STYLES.RANDOM];
        } else if (level === 'hard') {
            styles = [window.AI_STYLES.ADAPTIVE, window.AI_STYLES.TAG, window.AI_STYLES.LAG];
        } else {
            styles = [window.AI_STYLES.TIGHT, window.AI_STYLES.AGGRESSIVE, window.AI_STYLES.ADAPTIVE];
        }
        for (let i = 0; i < count; i++) {
            const style = styles[i % styles.length];
            const name = `AI ${i + 1} (${window.AI_STYLE_NAMES[style] || style})`;
            const player = this.createAIPlayer(i + 1, name, startChips, style);
            players.push(player);
        }
        return players;
    }

    createCustomAIPlayer(id, name, chips, customConfig) {
        const style = customConfig.style || window.AI_STYLES.ADAPTIVE;
        const player = new window.AIPlayer(id, name, chips, style);
        const baseConfig = window.getAIConfigForPlayer(id, style);
        const mergedConfig = { ...baseConfig, ...customConfig };
        player.aiConfig = mergedConfig;
        const ai = this.createAI(player, style, mergedConfig);
        player.ai = ai;
        return player;
    }

    registerAIStyle(styleName, constructor, fallback = null) {
        this.styleConstructors[styleName] = constructor;
        if (fallback) this.styleFallbacks[styleName] = fallback;
    }

    getAvailableStyles() {
        return Object.keys(this.styleConstructors).filter(s => this.styleConstructors[s] !== null);
    }

    getStyleDescription(style) {
        const descriptions = {
            [window.AI_STYLES.TIGHT]: 'Играет только сильные руки, редко блефует.',
            [window.AI_STYLES.AGGRESSIVE]: 'Часто рейзит, активно блефует, агрессивный стиль.',
            [window.AI_STYLES.RANDOM]: 'Принимает случайные решения, непредсказуем.',
            [window.AI_STYLES.ADAPTIVE]: 'Адаптируется под оппонентов, учится на ошибках.',
            [window.AI_STYLES.MANIAC]: 'Экстремально агрессивный, почти всегда рейзит.',
            [window.AI_STYLES.CALLING_STATION]: 'Часто коллирует, редко рейзит.',
            [window.AI_STYLES.ROCK]: 'Очень тайтовый, играет только премиум руки.',
            [window.AI_STYLES.MOUSE]: 'Пасcивный, часто сбрасывает.',
            [window.AI_STYLES.LAG]: 'Лузово-агрессивный, играет много рук агрессивно.',
            [window.AI_STYLES.TAG]: 'Тайтово-агрессивный, сильный стиль.'
        };
        return descriptions[style] || 'Неизвестный стиль';
    }

    getStyleDifficulty(style) {
        const difficulties = {
            [window.AI_STYLES.RANDOM]: 1,
            [window.AI_STYLES.CALLING_STATION]: 1,
            [window.AI_STYLES.MOUSE]: 1,
            [window.AI_STYLES.TIGHT]: 2,
            [window.AI_STYLES.AGGRESSIVE]: 2,
            [window.AI_STYLES.ROCK]: 2,
            [window.AI_STYLES.LAG]: 3,
            [window.AI_STYLES.TAG]: 3,
            [window.AI_STYLES.ADAPTIVE]: 4,
            [window.AI_STYLES.MANIAC]: 3
        };
        return difficulties[style] || 2;
    }

    getStyleRecommendationForLevel(level) {
        if (level === 'beginner') return [window.AI_STYLES.RANDOM, window.AI_STYLES.CALLING_STATION];
        if (level === 'intermediate') return [window.AI_STYLES.TIGHT, window.AI_STYLES.AGGRESSIVE];
        if (level === 'advanced') return [window.AI_STYLES.ADAPTIVE, window.AI_STYLES.TAG, window.AI_STYLES.LAG];
        return [window.AI_STYLES.TIGHT, window.AI_STYLES.AGGRESSIVE, window.AI_STYLES.ADAPTIVE];
    }

    getStyleAggression(style) {
        const aggression = {
            [window.AI_STYLES.MOUSE]: 0.1,
            [window.AI_STYLES.CALLING_STATION]: 0.2,
            [window.AI_STYLES.ROCK]: 0.3,
            [window.AI_STYLES.TIGHT]: 0.4,
            [window.AI_STYLES.TAG]: 0.6,
            [window.AI_STYLES.RANDOM]: 0.5,
            [window.AI_STYLES.AGGRESSIVE]: 0.7,
            [window.AI_STYLES.LAG]: 0.8,
            [window.AI_STYLES.MANIAC]: 0.95,
            [window.AI_STYLES.ADAPTIVE]: 0.6
        };
        return aggression[style] || 0.5;
    }

    getStyleTightness(style) {
        const tightness = {
            [window.AI_STYLES.MANIAC]: 0.1,
            [window.AI_STYLES.LAG]: 0.3,
            [window.AI_STYLES.AGGRESSIVE]: 0.4,
            [window.AI_STYLES.RANDOM]: 0.5,
            [window.AI_STYLES.ADAPTIVE]: 0.5,
            [window.AI_STYLES.TAG]: 0.6,
            [window.AI_STYLES.TIGHT]: 0.7,
            [window.AI_STYLES.ROCK]: 0.85,
            [window.AI_STYLES.MOUSE]: 0.9,
            [window.AI_STYLES.CALLING_STATION]: 0.3
        };
        return tightness[style] || 0.5;
    }

    async makeAIDecision(ai, communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        if (!ai) return { action: window.GameAction.FOLD, amount: 0 };
        const decision = await ai.makeDecision(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents);
        return decision;
    }

    updateAIExperience(ai, result, potWon) {
        if (ai && ai.updateExperience) {
            ai.updateExperience(result, potWon);
        }
    }

    updateAIOpponentProfile(ai, opponent, action, betSize, result, handStrength) {
        if (ai && ai.updateOpponentProfile) {
            ai.updateOpponentProfile(opponent, action, betSize, result, handStrength);
        }
    }

    getAIStats(ai) {
        if (ai && ai.getStats) return ai.getStats();
        return null;
    }

    getAIRecommendation(ai) {
        if (ai && ai.getExploitRecommendation) return ai.getExploitRecommendation();
        return 'N/A';
    }

    serializeAI(ai) {
        if (!ai) return null;
        return {
            style: ai.style,
            config: ai.config,
            experience: ai.experience,
            decisionHistory: ai.decisionHistory,
            positionStats: ai.positionStats,
            strategyProfile: ai.strategyProfile,
            performanceHistory: ai.performanceHistory
        };
    }

    deserializeAI(player, data) {
        if (!data) return null;
        const style = data.style || player.aiStyle;
        const ai = this.createAI(player, style, data.config);
        if (data.experience) ai.experience = { ...data.experience };
        if (data.decisionHistory) ai.decisionHistory = [...data.decisionHistory];
        if (data.positionStats) ai.positionStats = JSON.parse(JSON.stringify(data.positionStats));
        if (data.strategyProfile && ai.strategyProfile) ai.strategyProfile = { ...ai.strategyProfile, ...data.strategyProfile };
        if (data.performanceHistory && ai.performanceHistory) ai.performanceHistory = { ...ai.performanceHistory, ...data.performanceHistory };
        return ai;
    }

    createAIPlayerWithMemory(id, name, chips, style, memoryData) {
        const player = this.createAIPlayer(id, name, chips, style);
        if (memoryData && player.ai) {
            this.deserializeAI(player.ai, memoryData);
        }
        return player;
    }

    getAIPlayerSummary(player) {
        if (!player.ai) return null;
        const stats = this.getAIStats(player.ai);
        return {
            id: player.id,
            name: player.name,
            style: player.aiStyle,
            styleName: window.AI_STYLE_NAMES[player.aiStyle] || player.aiStyle,
            aggression: stats ? stats.aggression : null,
            tightness: stats ? stats.tightness : null,
            winRate: stats ? stats.winRate : null,
            handsPlayed: stats ? stats.handsPlayed : null,
            recommendation: this.getAIRecommendation(player.ai)
        };
    }

    getAllAIPlayersSummary(players) {
        const summaries = [];
        for (let p of players) {
            if (p.isAI) {
                summaries.push(this.getAIPlayerSummary(p));
            }
        }
        return summaries;
    }

    static getInstance() {
        if (!window._aiFactoryInstance) {
            window._aiFactoryInstance = new window.AIFactory();
        }
        return window._aiFactoryInstance;
    }
};

window.AIFactory = window.AIFactory;
window.aiFactory = window.AIFactory.getInstance();

console.log('ai_Factory.js loaded');
