window.AIAdaptive = class AIAdaptive extends window.AIBase {
    constructor(player, config = null) {
        super(player, config);
        this.style = window.AI_STYLES.ADAPTIVE;
        this.learningRate = config ? config.adaptiveLearningRate : 0.15;
        this.memorySize = config ? config.memorySize : 100;
        this.exploitOpponents = config ? config.exploitOpponents : true;
        this.opponentProfiles = new Map();
        this.strategyProfile = {
            tightness: 0.5,
            aggression: 0.5,
            bluffFrequency: 0.25,
            positionAwareness: 0.7,
            callThreshold: 0.45,
            raiseThreshold: 0.55,
            allInThreshold: 0.85,
            threeBetFrequency: 0.15,
            continuationBetFrequency: 0.6
        };
        this.handHistory = [];
        this.strategyAdjustments = [];
        this.performanceHistory = {
            handsPlayed: 0,
            wins: 0,
            losses: 0,
            totalWinnings: 0,
            recentResults: []
        };
        this.adaptiveCache = new Map();
        this.exploitCache = new Map();
    }

    getHandStrength(communityCards, gamePhase) {
        let strength = super.getHandStrength(communityCards, gamePhase);
        const opponentAdjust = this.getOpponentAdjustment();
        const positionAdjust = this.getPositionWeight();
        strength = strength * (0.8 + opponentAdjust * 0.4) * (0.7 + positionAdjust * 0.6);
        strength = Math.min(0.98, Math.max(0.02, strength));
        return strength;
    }

    getOpponentAdjustment() {
        if (!this.exploitOpponents) return 0.5;
        const opponents = this.getCurrentOpponents();
        if (opponents.length === 0) return 0.5;
        let avgTightness = 0;
        let avgAggression = 0;
        let count = 0;
        for (let opp of opponents) {
            const profile = this.getOpponentProfile(opp.id);
            if (profile) {
                avgTightness += profile.tightness;
                avgAggression += profile.aggression;
                count++;
            }
        }
        if (count === 0) return 0.5;
        avgTightness /= count;
        avgAggression /= count;
        let adjustment = 0.5;
        if (avgTightness > 0.6) adjustment += 0.2;
        if (avgTightness < 0.3) adjustment -= 0.1;
        if (avgAggression > 0.6) adjustment -= 0.15;
        if (avgAggression < 0.3) adjustment += 0.1;
        return Math.min(0.9, Math.max(0.1, adjustment));
    }

    getOpponentProfile(opponentId) {
        return this.opponentProfiles.get(opponentId);
    }

    getCurrentOpponents() {
        if (!this.player || !this.player.gameState) return [];
        return this.player.gameState.players.filter(p => p !== this.player && !p.folded);
    }

    updateOpponentProfile(opponent, action, betSize, result, handStrength) {
        let profile = this.opponentProfiles.get(opponent.id);
        if (!profile) {
            profile = {
                id: opponent.id,
                name: opponent.name,
                handsSeen: 0,
                folds: 0,
                calls: 0,
                raises: 0,
                allIns: 0,
                wins: 0,
                losses: 0,
                totalBet: 0,
                avgBetSize: 0,
                aggression: 0.5,
                tightness: 0.5,
                positionStats: {},
                handStrengthHistory: [],
                bluffFrequency: 0.2,
                callFrequency: 0.5,
                raiseFrequency: 0.3,
                lastUpdate: Date.now()
            };
            this.opponentProfiles.set(opponent.id, profile);
        }
        profile.handsSeen++;
        switch (action) {
            case window.GameAction.FOLD: profile.folds++; break;
            case window.GameAction.CALL: profile.calls++; break;
            case window.GameAction.RAISE: profile.raises++; profile.totalBet += betSize; profile.avgBetSize = profile.totalBet / profile.raises; break;
            case window.GameAction.ALL_IN: profile.allIns++; break;
        }
        if (result === 'win') profile.wins++;
        else if (result === 'loss') profile.losses++;
        profile.aggression = (profile.raises + profile.allIns) / profile.handsSeen;
        profile.tightness = profile.folds / profile.handsSeen;
        profile.callFrequency = profile.calls / profile.handsSeen;
        profile.raiseFrequency = (profile.raises + profile.allIns) / profile.handsSeen;
        if (handStrength !== undefined) {
            profile.handStrengthHistory.push(handStrength);
            if (profile.handStrengthHistory.length > 50) profile.handStrengthHistory.shift();
            const avgStrength = profile.handStrengthHistory.reduce((a,b) => a + b, 0) / profile.handStrengthHistory.length;
            profile.bluffFrequency = Math.min(0.6, Math.max(0.05, 1 - avgStrength - profile.tightness * 0.5));
        }
        profile.lastUpdate = Date.now();
        this.opponentProfiles.set(opponent.id, profile);
    }

    adaptStrategy() {
        const recentHands = this.performanceHistory.recentResults.slice(-20);
        if (recentHands.length < 10) return;
        const winRate = recentHands.filter(r => r === 'win').length / recentHands.length;
        const expectedWinRate = 1 / (this.player.gameState ? this.player.gameState.players.filter(p => !p.folded).length : 2);
        const delta = winRate - expectedWinRate;
        const adjustment = delta * this.learningRate;
        if (Math.abs(adjustment) < 0.01) return;
        this.strategyProfile.tightness = Math.min(0.9, Math.max(0.1, this.strategyProfile.tightness - adjustment * 0.3));
        this.strategyProfile.aggression = Math.min(0.9, Math.max(0.1, this.strategyProfile.aggression + adjustment * 0.2));
        this.strategyProfile.bluffFrequency = Math.min(0.6, Math.max(0.05, this.strategyProfile.bluffFrequency + adjustment * 0.15));
        this.strategyProfile.callThreshold = Math.min(0.7, Math.max(0.2, this.strategyProfile.callThreshold - adjustment * 0.2));
        this.strategyProfile.raiseThreshold = Math.min(0.8, Math.max(0.3, this.strategyProfile.raiseThreshold - adjustment * 0.1));
        this.strategyProfile.allInThreshold = Math.min(0.95, Math.max(0.6, this.strategyProfile.allInThreshold - adjustment * 0.05));
        this.strategyProfile.threeBetFrequency = Math.min(0.4, Math.max(0.05, this.strategyProfile.threeBetFrequency + adjustment * 0.2));
        this.strategyProfile.continuationBetFrequency = Math.min(0.85, Math.max(0.3, this.strategyProfile.continuationBetFrequency + adjustment * 0.15));
        this.strategyAdjustments.push({
            timestamp: Date.now(),
            winRate: winRate,
            delta: delta,
            newStrategy: { ...this.strategyProfile }
        });
        if (this.strategyAdjustments.length > 50) this.strategyAdjustments.shift();
    }

    getCallThreshold() {
        let threshold = this.strategyProfile.callThreshold;
        threshold += (Math.random() - 0.5) * 0.05;
        const opponentAdjust = this.getOpponentAdjustment();
        threshold *= (1 + (opponentAdjust - 0.5) * 0.3);
        return Math.min(0.8, Math.max(0.2, threshold));
    }

    getRaiseThreshold() {
        let threshold = this.strategyProfile.raiseThreshold;
        threshold += (Math.random() - 0.5) * 0.05;
        const opponentAdjust = this.getOpponentAdjustment();
        threshold *= (1 - (opponentAdjust - 0.5) * 0.2);
        return Math.min(0.85, Math.max(0.25, threshold));
    }

    getAllInThreshold() {
        let threshold = this.strategyProfile.allInThreshold;
        threshold += (Math.random() - 0.5) * 0.03;
        return Math.min(0.98, Math.max(0.5, threshold));
    }

    getBluffFrequency() {
        let bluff = this.strategyProfile.bluffFrequency;
        const opponentAdjust = this.getOpponentAdjustment();
        if (opponentAdjust > 0.6) bluff *= 1.2;
        if (opponentAdjust < 0.4) bluff *= 0.8;
        const recentResults = this.performanceHistory.recentResults.slice(-5);
        const recentWins = recentResults.filter(r => r === 'win').length;
        if (recentWins >= 3) bluff *= 1.1;
        if (recentWins === 0) bluff *= 0.9;
        return Math.min(0.65, Math.max(0.08, bluff));
    }

    getAggressionModifier() {
        let agg = this.strategyProfile.aggression;
        agg += (Math.random() - 0.5) * 0.1;
        const opponentAdjust = this.getOpponentAdjustment();
        agg *= (0.8 + opponentAdjust * 0.4);
        return Math.min(2.2, Math.max(0.5, agg));
    }

    getPositionWeight() {
        let weight = this.strategyProfile.positionAwareness;
        weight += (Math.random() - 0.5) * 0.1;
        return Math.min(1.5, Math.max(0.7, weight));
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        const baseAmount = super.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
        let multiplier = 1.0;
        const opponentAdjust = this.getOpponentAdjustment();
        if (opponentAdjust > 0.6) multiplier *= 0.9;
        if (handStrength > 0.7) multiplier *= 1.2;
        if (this.strategyProfile.aggression > 0.7) multiplier *= 1.1;
        let amount = Math.floor(baseAmount * multiplier);
        amount = Math.min(amount, this.player.chips);
        amount = Math.max(minRaise, amount);
        return amount;
    }

    shouldThreeBet(handStrength, position, initialRaiseSize) {
        let prob = this.strategyProfile.threeBetFrequency;
        if (handStrength > 0.7) prob += 0.3;
        if (position === 'late') prob += 0.1;
        if (initialRaiseSize <= 3) prob += 0.1;
        const opponentAdjust = this.getOpponentAdjustment();
        if (opponentAdjust < 0.4) prob += 0.15;
        return Math.random() < prob;
    }

    shouldContinuationBet(flopStrength, position, opponentsRemaining) {
        let prob = this.strategyProfile.continuationBetFrequency;
        if (flopStrength > 0.6) prob += 0.2;
        if (position === 'late') prob += 0.1;
        if (opponentsRemaining === 1) prob += 0.1;
        return Math.random() < prob;
    }

    decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const handStrength = this.getHandStrength(communityCards, gamePhase);
        const potOdds = this.getPotOdds(currentBet, potSize);
        const position = this.getPositionCategory();
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        const isPreflop = (gamePhase === window.GamePhase.PREFLOP);
        let decision = { action: window.GameAction.FOLD, amount: 0 };
        if (toCall === 0) {
            if (isPreflop) {
                const shouldOpen = handStrength > this.getCallThreshold() || (position === 'late' && handStrength > 0.35);
                if (shouldOpen && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else {
                const shouldBet = this.shouldContinuationBet(handStrength, position, opponents.length);
                if (shouldBet && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            }
        } else {
            const raiseSizeRatio = (currentBet - (this.player.currentBet || 0)) / window.getBigBlind();
            if (isPreflop && this.shouldThreeBet(handStrength, position, raiseSizeRatio) && availableActions.includes(window.GameAction.RAISE)) {
                const threeBetAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                decision = { action: window.GameAction.RAISE, amount: threeBetAmount };
            } else if (handStrength > this.getRaiseThreshold() && availableActions.includes(window.GameAction.RAISE)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                decision = { action: window.GameAction.RAISE, amount: raiseAmount };
            } else if (handStrength > this.getCallThreshold() && availableActions.includes(window.GameAction.CALL)) {
                decision = { action: window.GameAction.CALL, amount: toCall };
            } else if (this.shouldBluff(handStrength, potOdds) && availableActions.includes(window.GameAction.RAISE)) {
                const bluffAmount = this.getRaiseAmount(currentBet, minRaise, potSize, 0.2);
                if (bluffAmount <= this.player.chips) {
                    decision = { action: window.GameAction.RAISE, amount: bluffAmount };
                } else {
                    decision = { action: window.GameAction.FOLD, amount: 0 };
                }
            } else {
                decision = { action: window.GameAction.FOLD, amount: 0 };
            }
        }
        if (decision.action === window.GameAction.RAISE && decision.amount === this.player.chips) {
            decision.action = window.GameAction.ALL_IN;
        }
        if (!availableActions.includes(decision.action)) {
            if (availableActions.includes(window.GameAction.CHECK)) decision = { action: window.GameAction.CHECK, amount: 0 };
            else if (availableActions.includes(window.GameAction.CALL)) decision = { action: window.GameAction.CALL, amount: toCall };
            else decision = { action: window.GameAction.FOLD, amount: 0 };
        }
        this.lastDecision = decision;
        return decision;
    }

    updateExperience(result, potWon) {
        super.updateExperience(result, potWon);
        this.performanceHistory.handsPlayed++;
        if (result === 'win') {
            this.performanceHistory.wins++;
            this.performanceHistory.totalWinnings += potWon;
        } else if (result === 'loss') {
            this.performanceHistory.losses++;
        }
        this.performanceHistory.recentResults.push(result);
        if (this.performanceHistory.recentResults.length > 100) this.performanceHistory.recentResults.shift();
        this.adaptStrategy();
    }

    recordOpponentAction(opponent, action, betSize, result) {
        if (!this.exploitOpponents) return;
        this.updateOpponentProfile(opponent, action, betSize, result);
    }

    getExploitRecommendation() {
        const opponents = this.getCurrentOpponents();
        if (opponents.length === 0) return 'No opponents';
        const tightOpponents = opponents.filter(o => {
            const p = this.getOpponentProfile(o.id);
            return p && p.tightness > 0.6;
        }).length;
        const aggressiveOpponents = opponents.filter(o => {
            const p = this.getOpponentProfile(o.id);
            return p && p.aggression > 0.6;
        }).length;
        if (tightOpponents > opponents.length / 2) return 'Increase bluff frequency, steal blinds more often';
        if (aggressiveOpponents > opponents.length / 2) return 'Tighten up, trap with strong hands';
        return 'Play balanced strategy';
    }

    getStats() {
        const base = super.getStats();
        return {
            ...base,
            style: 'Adaptive',
            learningRate: this.learningRate,
            strategyProfile: { ...this.strategyProfile },
            performanceHistory: {
                handsPlayed: this.performanceHistory.handsPlayed,
                wins: this.performanceHistory.wins,
                losses: this.performanceHistory.losses,
                winRate: this.performanceHistory.handsPlayed ? this.performanceHistory.wins / this.performanceHistory.handsPlayed : 0,
                recentWinRate: this.performanceHistory.recentResults.length ? this.performanceHistory.recentResults.filter(r => r === 'win').length / this.performanceHistory.recentResults.length : 0
            },
            opponentProfilesCount: this.opponentProfiles.size,
            strategyAdjustmentsCount: this.strategyAdjustments.length,
            exploitRecommendation: this.getExploitRecommendation()
        };
    }

    clone() {
        const clone = new window.AIAdaptive(this.player, { ...this.config });
        clone.decisionHistory = [...this.decisionHistory];
        clone.experience = { ...this.experience };
        clone.positionStats = JSON.parse(JSON.stringify(this.positionStats));
        clone.strategyProfile = JSON.parse(JSON.stringify(this.strategyProfile));
        clone.performanceHistory = JSON.parse(JSON.stringify(this.performanceHistory));
        clone.opponentProfiles = new Map();
        for (let [id, profile] of this.opponentProfiles) {
            clone.opponentProfiles.set(id, JSON.parse(JSON.stringify(profile)));
        }
        clone.strategyAdjustments = [...this.strategyAdjustments];
        clone.learningRate = this.learningRate;
        clone.exploitOpponents = this.exploitOpponents;
        return clone;
    }
};

window.AIAdaptive = window.AIAdaptive;

console.log('ai_Adaptive.js loaded');
