window.UtilStorage = class UtilStorage {
    static storagePrefix = 'poker_';
    static memoryCache = new Map();
    static cacheTTL = 60000;

    static getKey(key) {
        return this.storagePrefix + key;
    }

    static save(key, value, useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const fullKey = this.getKey(key);
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                version: 1
            };
            storage.setItem(fullKey, JSON.stringify(data));
            this.memoryCache.set(fullKey, { value, timestamp: Date.now() });
            return true;
        } catch (e) {
            console.warn('Storage save failed:', e);
            return false;
        }
    }

    static load(key, defaultValue = null, useSession = false, maxAge = null) {
        const storage = useSession ? sessionStorage : localStorage;
        const fullKey = this.getKey(key);
        const cached = this.memoryCache.get(fullKey);
        if (cached && (!maxAge || Date.now() - cached.timestamp < maxAge)) {
            return cached.value;
        }
        try {
            const raw = storage.getItem(fullKey);
            if (!raw) return defaultValue;
            const data = JSON.parse(raw);
            if (maxAge && Date.now() - data.timestamp > maxAge) {
                this.remove(key, useSession);
                return defaultValue;
            }
            this.memoryCache.set(fullKey, { value: data.value, timestamp: data.timestamp });
            return data.value;
        } catch (e) {
            return defaultValue;
        }
    }

    static remove(key, useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const fullKey = this.getKey(key);
        storage.removeItem(fullKey);
        this.memoryCache.delete(fullKey);
    }

    static clear(useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const prefix = this.storagePrefix;
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(prefix)) keys.push(key);
        }
        keys.forEach(k => storage.removeItem(k));
        for (let k of this.memoryCache.keys()) {
            if (k.startsWith(prefix)) this.memoryCache.delete(k);
        }
    }

    static clearAll() {
        this.clear(false);
        this.clear(true);
    }

    static getAllKeys(useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const prefix = this.storagePrefix;
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key.slice(prefix.length));
            }
        }
        return keys;
    }

    static has(key, useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const fullKey = this.getKey(key);
        return storage.getItem(fullKey) !== null;
    }

    static saveGameState(state, slot = 'autosave') {
        const serialized = this.serializeGameState(state);
        return this.save(`game_${slot}`, serialized);
    }

    static loadGameState(slot = 'autosave') {
        const data = this.load(`game_${slot}`);
        if (!data) return null;
        return this.deserializeGameState(data);
    }

    static serializeGameState(gameState) {
        if (!gameState) return null;
        return {
            players: gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                chips: p.chips,
                hand: p.hand.map(c => ({ rank: c.rank, suit: c.suit })),
                folded: p.folded,
                isActive: p.isActive,
                currentBet: p.currentBet,
                totalBetThisRound: p.totalBetThisRound,
                isHuman: p.isHuman,
                aiStyle: p.aiStyle,
                handsPlayed: p.handsPlayed,
                handsWon: p.handsWon,
                totalWinnings: p.totalWinnings,
                rebuysUsed: p.rebuysUsed
            })),
            communityCards: gameState.communityCards.map(c => ({ rank: c.rank, suit: c.suit })),
            currentPhase: gameState.currentPhase,
            currentPlayerIndex: gameState.currentPlayerIndex,
            dealerIndex: gameState.dealerIndex,
            currentBet: gameState.currentBet,
            lastRaiseAmount: gameState.lastRaiseAmount,
            roundNumber: gameState.roundNumber,
            potManager: gameState.potManager ? {
                pots: gameState.potManager.pots.map(p => ({
                    amount: p.amount,
                    eligiblePlayerIds: p.eligiblePlayers.map(pl => pl.id)
                }))
            } : null,
            allInPlayers: gameState.allInPlayers.map(p => p.id),
            actionLog: gameState.actionLog.slice(-100)
        };
    }

    static deserializeGameState(data) {
        if (!data) return null;
        const gameState = new window.GameState();
        gameState.players = data.players.map(pData => {
            if (pData.isHuman) {
                return new window.HumanPlayer(pData.id, pData.name, pData.chips);
            } else {
                const p = new window.AIPlayer(pData.id, pData.name, pData.chips, pData.aiStyle);
                p.handsPlayed = pData.handsPlayed || 0;
                p.handsWon = pData.handsWon || 0;
                p.totalWinnings = pData.totalWinnings || 0;
                p.rebuysUsed = pData.rebuysUsed || 0;
                return p;
            }
        });
        gameState.communityCards = data.communityCards.map(c => new window.Card(c.rank, c.suit));
        gameState.currentPhase = data.currentPhase;
        gameState.currentPlayerIndex = data.currentPlayerIndex;
        gameState.dealerIndex = data.dealerIndex;
        gameState.currentBet = data.currentBet;
        gameState.lastRaiseAmount = data.lastRaiseAmount;
        gameState.roundNumber = data.roundNumber;
        if (data.potManager) {
            gameState.potManager = new window.PotManager();
            gameState.potManager.pots = data.potManager.pots.map(potData => {
                const pot = new window.Pot();
                pot.amount = potData.amount;
                pot.eligiblePlayers = potData.eligiblePlayerIds.map(id => gameState.getPlayerById(id)).filter(p => p);
                return pot;
            });
        } else {
            gameState.potManager = new window.PotManager();
            gameState.potManager.initialize();
        }
        gameState.allInPlayers = data.allInPlayers.map(id => gameState.getPlayerById(id)).filter(p => p);
        gameState.actionLog = data.actionLog || [];
        gameState.updatePositions();
        for (let i = 0; i < gameState.players.length; i++) {
            const p = gameState.players[i];
            const handData = data.players[i].hand;
            p.hand = handData.map(c => new window.Card(c.rank, c.suit));
            p.folded = data.players[i].folded;
            p.isActive = data.players[i].isActive;
            p.currentBet = data.players[i].currentBet;
            p.totalBetThisRound = data.players[i].totalBetThisRound;
        }
        return gameState;
    }

    static saveSettings() {
        const gameConfig = window.getGameConfig();
        const aiConfig = window.getAIConfig();
        const uiConfig = window.getUIConfig();
        this.save('game_config', gameConfig);
        this.save('ai_config', aiConfig);
        this.save('ui_config', uiConfig);
        return true;
    }

    static loadSettings() {
        const gameConfig = this.load('game_config');
        const aiConfig = this.load('ai_config');
        const uiConfig = this.load('ui_config');
        if (gameConfig) window.setGameConfig(gameConfig);
        if (aiConfig) window.setAIConfig(aiConfig);
        if (uiConfig) window.setUIConfig(uiConfig);
        return { gameConfig, aiConfig, uiConfig };
    }

    static saveStats(stats) {
        const existing = this.load('stats', {});
        const updated = { ...existing, ...stats, lastUpdated: Date.now() };
        this.save('stats', updated);
        return updated;
    }

    static loadStats() {
        return this.load('stats', {});
    }

    static incrementStat(key, amount = 1) {
        const stats = this.loadStats();
        stats[key] = (stats[key] || 0) + amount;
        this.saveStats(stats);
    }

    static savePlayerStats(playerId, stats) {
        const allStats = this.load('player_stats', {});
        allStats[playerId] = { ...(allStats[playerId] || {}), ...stats, lastUpdated: Date.now() };
        this.save('player_stats', allStats);
    }

    static loadPlayerStats(playerId) {
        const allStats = this.load('player_stats', {});
        return allStats[playerId] || null;
    }

    static getAllPlayerStats() {
        return this.load('player_stats', {});
    }

    static saveAchievement(achievementId) {
        const achievements = this.load('achievements', []);
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            this.save('achievements', achievements);
            return true;
        }
        return false;
    }

    static hasAchievement(achievementId) {
        const achievements = this.load('achievements', []);
        return achievements.includes(achievementId);
    }

    static getAchievements() {
        return this.load('achievements', []);
    }

    static saveHandHistory(handData, limit = 100) {
        let history = this.load('hand_history', []);
        history.unshift({ ...handData, timestamp: Date.now() });
        if (history.length > limit) history = history.slice(0, limit);
        this.save('hand_history', history);
    }

    static loadHandHistory() {
        return this.load('hand_history', []);
    }

    static clearHandHistory() {
        this.remove('hand_history');
    }

    static exportData() {
        const data = {
            game_config: this.load('game_config'),
            ai_config: this.load('ai_config'),
            ui_config: this.load('ui_config'),
            stats: this.load('stats'),
            player_stats: this.load('player_stats'),
            achievements: this.load('achievements'),
            hand_history: this.load('hand_history'),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    static importData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.game_config) this.save('game_config', data.game_config);
            if (data.ai_config) this.save('ai_config', data.ai_config);
            if (data.ui_config) this.save('ui_config', data.ui_config);
            if (data.stats) this.save('stats', data.stats);
            if (data.player_stats) this.save('player_stats', data.player_stats);
            if (data.achievements) this.save('achievements', data.achievements);
            if (data.hand_history) this.save('hand_history', data.hand_history);
            return true;
        } catch (e) {
            return false;
        }
    }

    static backup() {
        const backup = {
            version: 1,
            timestamp: Date.now(),
            data: {
                game_config: this.load('game_config'),
                ai_config: this.load('ai_config'),
                ui_config: this.load('ui_config'),
                stats: this.load('stats'),
                player_stats: this.load('player_stats'),
                achievements: this.load('achievements'),
                hand_history: this.load('hand_history')
            }
        };
        return JSON.stringify(backup);
    }

    static restore(backupJson) {
        try {
            const backup = JSON.parse(backupJson);
            if (backup.version !== 1) return false;
            const data = backup.data;
            if (data.game_config) this.save('game_config', data.game_config);
            if (data.ai_config) this.save('ai_config', data.ai_config);
            if (data.ui_config) this.save('ui_config', data.ui_config);
            if (data.stats) this.save('stats', data.stats);
            if (data.player_stats) this.save('player_stats', data.player_stats);
            if (data.achievements) this.save('achievements', data.achievements);
            if (data.hand_history) this.save('hand_history', data.hand_history);
            return true;
        } catch (e) {
            return false;
        }
    }

    static migrateOldStorage() {
        const oldPrefixes = ['poker_', 'pkr_', 'holdem_'];
        for (let prefix of oldPrefixes) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix) && !key.startsWith(this.storagePrefix)) {
                    const value = localStorage.getItem(key);
                    const newKey = key.replace(prefix, this.storagePrefix);
                    if (!localStorage.getItem(newKey)) {
                        localStorage.setItem(newKey, value);
                    }
                }
            }
        }
    }

    static getStorageUsage() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            total += (key.length + value.length) * 2;
        }
        return total;
    }

    static isQuotaExceeded() {
        try {
            const testKey = this.getKey('__quota_test__');
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return false;
        } catch (e) {
            return e.name === 'QuotaExceededError';
        }
    }

    static pruneOldData(maxAgeDays = 30) {
        const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
        const keys = this.getAllKeys(false);
        for (let key of keys) {
            const fullKey = this.getKey(key);
            const raw = localStorage.getItem(fullKey);
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    if (data.timestamp && data.timestamp < cutoff) {
                        this.remove(key);
                    }
                } catch (e) {}
            }
        }
    }

    static getCacheStats() {
        return {
            size: this.memoryCache.size,
            keys: Array.from(this.memoryCache.keys())
        };
    }

    static clearCache() {
        this.memoryCache.clear();
    }

    static setCacheTTL(ms) {
        this.cacheTTL = ms;
    }

    static isStorageAvailable(type = 'localStorage') {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch(e) {
            return false;
        }
    }

    static getStorageType(key) {
        if (this.has(key, false)) return 'local';
        if (this.has(key, true)) return 'session';
        return null;
    }

    static moveKey(key, fromSession, toSession) {
        const value = this.load(key, null, fromSession);
        if (value !== null) {
            this.save(key, value, toSession);
            this.remove(key, fromSession);
            return true;
        }
        return false;
    }

    static syncToSession(key) {
        return this.moveKey(key, false, true);
    }

    static syncToLocal(key) {
        return this.moveKey(key, true, false);
    }

    static createSnapshot(keys = null) {
        const snapshot = {};
        const targetKeys = keys || this.getAllKeys(false);
        for (let key of targetKeys) {
            snapshot[key] = this.load(key);
        }
        return snapshot;
    }

    static applySnapshot(snapshot) {
        for (let [key, value] of Object.entries(snapshot)) {
            this.save(key, value);
        }
    }
};

window.saveToStorage = UtilStorage.save.bind(UtilStorage);
window.loadFromStorage = UtilStorage.load.bind(UtilStorage);
window.removeFromStorage = UtilStorage.remove.bind(UtilStorage);
window.clearStorage = UtilStorage.clear.bind(UtilStorage);
window.saveGameState = UtilStorage.saveGameState.bind(UtilStorage);
window.loadGameState = UtilStorage.loadGameState.bind(UtilStorage);
window.saveSettings = UtilStorage.saveSettings.bind(UtilStorage);
window.loadSettings = UtilStorage.loadSettings.bind(UtilStorage);
window.saveStats = UtilStorage.saveStats.bind(UtilStorage);
window.loadStats = UtilStorage.loadStats.bind(UtilStorage);
window.incrementStat = UtilStorage.incrementStat.bind(UtilStorage);
window.savePlayerStats = UtilStorage.savePlayerStats.bind(UtilStorage);
window.loadPlayerStats = UtilStorage.loadPlayerStats.bind(UtilStorage);
window.saveAchievement = UtilStorage.saveAchievement.bind(UtilStorage);
window.hasAchievement = UtilStorage.hasAchievement.bind(UtilStorage);
window.saveHandHistory = UtilStorage.saveHandHistory.bind(UtilStorage);
window.loadHandHistory = UtilStorage.loadHandHistory.bind(UtilStorage);
window.exportStorageData = UtilStorage.exportData.bind(UtilStorage);
window.importStorageData = UtilStorage.importData.bind(UtilStorage);
window.backupStorage = UtilStorage.backup.bind(UtilStorage);
window.restoreStorage = UtilStorage.restore.bind(UtilStorage);
window.getStorageUsage = UtilStorage.getStorageUsage.bind(UtilStorage);
window.pruneOldStorage = UtilStorage.pruneOldData.bind(UtilStorage);

console.log('util_storage.js loaded');
