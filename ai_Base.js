window.AIBase = class AIBase {
    constructor(player, config = null) {
        this.player = player;
        this.config = config || window.getAIConfig();
        this.handStrengthCache = new Map();
        this.decisionHistory = [];
        this.bluffHistory = [];
        this.opponentModels = new Map();
        this.positionStats = {
            early: { hands: 0, vpip: 0, pfr: 0 },
            middle: { hands: 0, vpip: 0, pfr: 0 },
            late: { hands: 0, vpip: 0, pfr: 0 },
            blind: { hands: 0, vpip: 0, pfr: 0 }
        };
        this.experience = { hands: 0, wins: 0, losses: 0, winnings: 0 };
        this.lastDecision = null;
        this.lastHandStrength = 0;
        this.lastPotOdds = 0;
    }

    getHandStrength(communityCards, gamePhase) {
        if (!this.player.hand.length) return 0;
        const cacheKey = `${this.player.hand[0].toString()}_${this.player.hand[1].toString()}_${communityCards.map(c=>c.toString()).join('_')}_${gamePhase}`;
        if (this.handStrengthCache.has(cacheKey)) return this.handStrengthCache.get(cacheKey);
        let strength = 0;
        if (gamePhase === window.GamePhase.PREFLOP) {
            strength = window.getAIHandStrengthFromPreflop(this.player.hand[0], this.player.hand[1]);
        } else {
            strength = window.getAIHandStrengthFromPostflop(this.player.hand, communityCards);
            if (window.isAIMonteCarloEnabled()) {
                const monteCarlo = window.getAIMonteCarloStrength(this.player.hand, communityCards, [], window.getAIMonteCarloIterations());
                if (monteCarlo !== null) strength = (strength + monteCarlo) / 2;
            }
        }
        strength = Math.min(1, Math.max(0, strength));
        if (this.handStrengthCache.size > 500) {
            const first = this.handStrengthCache.keys().next().value;
            this.handStrengthCache.delete(first);
        }
        this.handStrengthCache.set(cacheKey, strength);
        this.lastHandStrength = strength;
        return strength;
    }

    getPotOdds(currentBet, potSize) {
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        if (toCall <= 0) return Infinity;
        const odds = potSize / toCall;
        this.lastPotOdds = odds;
        return odds;
    }

    getPositionCategory() {
        if (this.player.isDealer) return 'late';
        if (this.player.isSmallBlind || this.player.isBigBlind) return 'blind';
        if (this.player.position === 'early') return 'early';
        if (this.player.position === 'middle') return 'middle';
        if (this.player.position === 'cutoff') return 'late';
        if (this.player.position === 'button') return 'late';
        return 'middle';
    }

    getPositionWeight() {
        const pos = this.getPositionCategory();
        const weights = { early: 0.8, middle: 1.0, late: 1.3, blind: 0.9 };
        return weights[pos] * window.getAIPositionWeight();
    }

    getStackSizeFactor() {
        const bb = window.getBigBlind();
        const stack = this.player.chips;
        if (stack < bb * 10) return 1.5;
        if (stack < bb * 20) return 1.2;
        if (stack > bb * 80) return 0.8;
        return 1.0;
    }

    getBluffFrequency() {
        let bluff = this.config.bluffFrequency;
        const streak = this.player.consecutiveWins || 0;
        const lossStreak = this.player.consecutiveLosses || 0;
        if (streak > 2) bluff += 0.1;
        if (lossStreak > 2) bluff -= 0.05;
        if (this.lastHandStrength < 0.2) bluff += 0.1;
        if (this.lastHandStrength > 0.7) bluff -= 0.1;
        return Math.min(0.8, Math.max(0.05, bluff));
    }

    getAggressionModifier() {
        let agg = this.config.aggressionBase / 5;
        agg *= (1 + (this.player.tiltLevel || 0) * 0.5);
        if (this.player.consecutiveWins > 2) agg *= 1.2;
        if (this.player.consecutiveLosses > 2) agg *= 0.9;
        return Math.min(2.5, Math.max(0.5, agg));
    }

    getCallThreshold() {
        let threshold = this.config.callThreshold;
        const posWeight = this.getPositionWeight();
        threshold *= (1 + (posWeight - 1) * 0.2);
        threshold += (this.player.tiltLevel || 0) * 0.1;
        return Math.min(0.95, Math.max(0.05, threshold));
    }

    getRaiseThreshold() {
        let threshold = this.config.raiseThreshold;
        const posWeight = this.getPositionWeight();
        threshold *= (1 - (posWeight - 1) * 0.1);
        threshold -= (this.player.tiltLevel || 0) * 0.05;
        return Math.min(0.95, Math.max(0.05, threshold));
    }

    getAllInThreshold() {
        let threshold = this.config.allInThreshold;
        const stackFactor = this.getStackSizeFactor();
        threshold *= (1 - (stackFactor - 1) * 0.2);
        threshold -= (this.player.tiltLevel || 0) * 0.1;
        return Math.min(0.95, Math.max(0.05, threshold));
    }

    shouldBluff(handStrength, potOdds) {
        const bluffProb = this.getBluffFrequency();
        if (handStrength > 0.7) return false;
        if (handStrength < 0.2 && potOdds > 2) return Math.random() < bluffProb * 0.8;
        if (this.getPositionCategory() === 'late' && handStrength < 0.4) return Math.random() < bluffProb;
        return false;
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        const aggMod = this.getAggressionModifier();
        const stackFactor = this.getStackSizeFactor();
        const strengthFactor = 0.5 + handStrength * 1.5;
        let multiplier = this.config.minRaiseMultiplier * aggMod * strengthFactor * stackFactor;
        multiplier = Math.min(this.config.maxRaiseMultiplier, Math.max(this.config.minRaiseMultiplier, multiplier));
        let raiseSize = (currentBet - this.player.currentBet) * multiplier;
        const maxBet = this.player.chips;
        const minTotal = currentBet + minRaise;
        raiseSize = Math.max(minTotal - this.player.currentBet, raiseSize);
        raiseSize = Math.min(raiseSize, maxBet);
        if (raiseSize === maxBet) return maxBet;
        if (raiseSize < minRaise) raiseSize = minRaise;
        return Math.floor(raiseSize);
    }

    decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const handStrength = this.getHandStrength(communityCards, gamePhase);
        const potOdds = this.getPotOdds(currentBet, potSize);
        const positionWeight = this.getPositionWeight();
        const adjustedStrength = handStrength * positionWeight;
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        const callThreshold = this.getCallThreshold();
        const raiseThreshold = this.getRaiseThreshold();
        const allInThreshold = this.getAllInThreshold();
        let decision = { action: window.GameAction.FOLD, amount: 0 };
        if (toCall === 0) {
            if (adjustedStrength > callThreshold * 0.6 || this.shouldBluff(handStrength, potOdds)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, adjustedStrength);
                if (raiseAmount >= this.player.chips && this.player.chips > 0 && adjustedStrength > 0.3) {
                    decision = { action: window.GameAction.ALL_IN, amount: this.player.chips };
                } else if (raiseAmount > 0 && availableActions.includes(window.GameAction.RAISE)) {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else {
                decision = { action: window.GameAction.CHECK, amount: 0 };
            }
        } else {
            if (adjustedStrength > allInThreshold || (toCall >= this.player.chips && adjustedStrength > 0.6)) {
                decision = { action: window.GameAction.ALL_IN, amount: this.player.chips };
            } else if (adjustedStrength > raiseThreshold && availableActions.includes(window.GameAction.RAISE)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, adjustedStrength);
                if (raiseAmount >= this.player.chips) {
                    decision = { action: window.GameAction.ALL_IN, amount: this.player.chips };
                } else {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                }
            } else if (adjustedStrength > callThreshold && toCall <= this.player.chips) {
                decision = { action: window.GameAction.CALL, amount: toCall };
            } else if (this.shouldBluff(handStrength, potOdds) && toCall <= this.player.chips * 0.3) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, 0.2);
                if (raiseAmount <= this.player.chips) {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
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

    async makeDecision(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const decision = this.decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents);
        this.recordDecision(decision, communityCards, gamePhase);
        return decision;
    }

    recordDecision(decision, communityCards, gamePhase) {
        this.decisionHistory.push({
            decision: decision,
            handStrength: this.lastHandStrength,
            potOdds: this.lastPotOdds,
            communityCards: communityCards.map(c => c.toString()),
            gamePhase: gamePhase,
            timestamp: Date.now(),
            chips: this.player.chips,
            currentBet: this.player.currentBet
        });
        if (this.decisionHistory.length > 100) this.decisionHistory.shift();
    }

    updateExperience(result, potWon) {
        this.experience.hands++;
        if (result === 'win') {
            this.experience.wins++;
            this.experience.winnings += potWon;
        } else if (result === 'loss') {
            this.experience.losses++;
        }
        const winRate = this.experience.wins / this.experience.hands;
        if (this.config.adaptiveLearningRate) {
            const lr = this.config.adaptiveLearningRate;
            this.config.callThreshold = Math.min(0.95, Math.max(0.05, this.config.callThreshold + lr * (winRate - 0.5) * 0.1));
            this.config.raiseThreshold = Math.min(0.95, Math.max(0.05, this.config.raiseThreshold + lr * (winRate - 0.5) * 0.05));
        }
    }

    updateOpponentModel(opponent, action, betSize, result) {
        if (!this.opponentModels.has(opponent.id)) {
            this.opponentModels.set(opponent.id, {
                handsSeen: 0,
                folds: 0,
                calls: 0,
                raises: 0,
                allIns: 0,
                wins: 0,
                losses: 0,
                avgBetSize: 0,
                totalBet: 0,
                aggression: 0.5,
                tightness: 0.5
            });
        }
        const model = this.opponentModels.get(opponent.id);
        model.handsSeen++;
        switch (action) {
            case window.GameAction.FOLD: model.folds++; break;
            case window.GameAction.CALL: model.calls++; break;
            case window.GameAction.RAISE: model.raises++; model.totalBet += betSize; model.avgBetSize = model.totalBet / model.raises; break;
            case window.GameAction.ALL_IN: model.allIns++; break;
        }
        if (result === 'win') model.wins++;
        else if (result === 'loss') model.losses++;
        model.aggression = (model.raises + model.allIns) / model.handsSeen;
        model.tightness = model.folds / model.handsSeen;
        this.opponentModels.set(opponent.id, model);
    }

    getOpponentAggression(opponentId) {
        const model = this.opponentModels.get(opponentId);
        return model ? model.aggression : 0.5;
    }

    getOpponentTightness(opponentId) {
        const model = this.opponentModels.get(opponentId);
        return model ? model.tightness : 0.5;
    }

    adjustForOpponents(opponents, handStrength) {
        let adjustment = 1.0;
        let avgOppAgg = 0;
        let count = 0;
        for (let opp of opponents) {
            if (opp !== this.player && !opp.folded) {
                avgOppAgg += this.getOpponentAggression(opp.id);
                count++;
            }
        }
        if (count > 0) {
            avgOppAgg /= count;
            if (avgOppAgg > 0.7) adjustment *= 0.9;
            else if (avgOppAgg < 0.3) adjustment *= 1.1;
        }
        return adjustment;
    }

    updatePositionStats(gamePhase, action, amount) {
        const pos = this.getPositionCategory();
        const stat = this.positionStats[pos];
        stat.hands++;
        if (action === window.GameAction.CALL || action === window.GameAction.RAISE || action === window.GameAction.ALL_IN) {
            stat.vpip = (stat.vpip * (stat.hands - 1) + 1) / stat.hands;
        }
        if (action === window.GameAction.RAISE || action === window.GameAction.ALL_IN) {
            stat.pfr = (stat.pfr * (stat.hands - 1) + 1) / stat.hands;
        }
    }

    getPositionVPIP() {
        const pos = this.getPositionCategory();
        return this.positionStats[pos].vpip;
    }

    getPositionPFR() {
        const pos = this.getPositionCategory();
        return this.positionStats[pos].pfr;
    }

    resetForNewHand() {
        this.handStrengthCache.clear();
        this.lastDecision = null;
    }

    getStats() {
        return {
            handsPlayed: this.experience.hands,
            wins: this.experience.wins,
            losses: this.experience.losses,
            winnings: this.experience.winnings,
            winRate: this.experience.hands ? this.experience.wins / this.experience.hands : 0,
            aggression: this.getAggressionModifier(),
            bluffFrequency: this.getBluffFrequency(),
            positionStats: this.positionStats,
            lastHandStrength: this.lastHandStrength,
            lastPotOdds: this.lastPotOdds
        };
    }

    clone() {
        const clone = new window.AIBase(this.player, { ...this.config });
        clone.decisionHistory = [...this.decisionHistory];
        clone.experience = { ...this.experience };
        clone.positionStats = JSON.parse(JSON.stringify(this.positionStats));
        return clone;
    }
};

window.AIBase = window.AIBase;

console.log('ai_Base.js loaded');
