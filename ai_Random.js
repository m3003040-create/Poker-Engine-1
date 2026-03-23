window.AIRandom = class AIRandom extends window.AIBase {
    constructor(player, config = null) {
        super(player, config);
        this.style = window.AI_STYLES.RANDOM;
        this.randomFactor = config ? (config.randomFactor || 0.8) : 0.8;
        this.actionWeights = {
            fold: 0.2,
            check: 0.2,
            call: 0.3,
            raise: 0.2,
            all_in: 0.1
        };
        this.lastRandomSeed = 0;
        this.decisionRandomness = 0.7;
        this.bluffProbability = 0.4;
        this.aggressiveBias = 0.5;
        this.passiveBias = 0.5;
        this.randomHistory = [];
    }

    getRandomValue(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomActionFromWeights(availableActions) {
        let weights = { ...this.actionWeights };
        if (!availableActions.includes(window.GameAction.FOLD)) weights.fold = 0;
        if (!availableActions.includes(window.GameAction.CHECK)) weights.check = 0;
        if (!availableActions.includes(window.GameAction.CALL)) weights.call = 0;
        if (!availableActions.includes(window.GameAction.RAISE)) weights.raise = 0;
        if (!availableActions.includes(window.GameAction.ALL_IN)) weights.all_in = 0;
        const total = Object.values(weights).reduce((a,b) => a + b, 0);
        if (total === 0) return window.GameAction.FOLD;
        let rand = Math.random() * total;
        for (let [action, weight] of Object.entries(weights)) {
            if (weight === 0) continue;
            if (rand < weight) return action;
            rand -= weight;
        }
        return availableActions[0] || window.GameAction.FOLD;
    }

    getRandomRaiseAmount(currentBet, minRaise, potSize, maxBet) {
        const minAmount = Math.max(minRaise, 1);
        const maxAmount = maxBet;
        if (minAmount >= maxAmount) return maxAmount;
        let raiseAmount = 0;
        const rand = Math.random();
        if (rand < 0.33) {
            raiseAmount = minAmount;
        } else if (rand < 0.66) {
            raiseAmount = Math.floor(minAmount + (maxAmount - minAmount) * 0.5);
        } else {
            raiseAmount = maxAmount;
        }
        return Math.min(maxAmount, Math.max(minAmount, raiseAmount));
    }

    getHandStrength(communityCards, gamePhase) {
        let strength = super.getHandStrength(communityCards, gamePhase);
        const noise = (Math.random() - 0.5) * 0.4;
        strength += noise;
        return Math.min(0.99, Math.max(0.01, strength));
    }

    getBluffFrequency() {
        let bluff = this.bluffProbability;
        bluff += (Math.random() - 0.5) * 0.3;
        return Math.min(0.7, Math.max(0.1, bluff));
    }

    getCallThreshold() {
        let threshold = this.getRandomValue(0.2, 0.8);
        threshold += (Math.random() - 0.5) * 0.2;
        return Math.min(0.9, Math.max(0.1, threshold));
    }

    getRaiseThreshold() {
        let threshold = this.getRandomValue(0.3, 0.9);
        threshold += (Math.random() - 0.5) * 0.2;
        return Math.min(0.95, Math.max(0.15, threshold));
    }

    getAllInThreshold() {
        let threshold = this.getRandomValue(0.6, 0.98);
        threshold += (Math.random() - 0.5) * 0.15;
        return Math.min(0.99, Math.max(0.3, threshold));
    }

    getAggressionModifier() {
        let agg = this.getRandomValue(0.5, 2.5);
        agg += (Math.random() - 0.5) * 0.8;
        return Math.min(3.0, Math.max(0.3, agg));
    }

    getPositionWeight() {
        let weight = super.getPositionWeight();
        weight += (Math.random() - 0.5) * 0.6;
        return Math.min(1.8, Math.max(0.6, weight));
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        const maxBet = this.player.chips;
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        if (maxBet === 0) return 0;
        let amount = 0;
        const rand = Math.random();
        if (rand < 0.4) {
            amount = minRaise;
        } else if (rand < 0.7) {
            amount = Math.floor(minRaise + (maxBet - minRaise) * 0.5);
        } else {
            amount = maxBet;
        }
        if (amount >= maxBet) amount = maxBet;
        if (amount < minRaise && amount < maxBet) amount = minRaise;
        return Math.min(maxBet, amount);
    }

    decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        const isPreflop = (gamePhase === window.GamePhase.PREFLOP);
        let decision = { action: window.GameAction.FOLD, amount: 0 };
        const randSeed = Math.random();
        this.lastRandomSeed = randSeed;
        if (toCall === 0) {
            if (availableActions.includes(window.GameAction.RAISE) && randSeed < 0.4) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, 0.5);
                if (raiseAmount > 0) {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else if (availableActions.includes(window.GameAction.CHECK)) {
                decision = { action: window.GameAction.CHECK, amount: 0 };
            } else {
                decision = { action: window.GameAction.FOLD, amount: 0 };
            }
        } else {
            const callAction = window.GameAction.CALL;
            const raiseAction = window.GameAction.RAISE;
            const allInAction = window.GameAction.ALL_IN;
            const foldAction = window.GameAction.FOLD;
            const rand = Math.random();
            if (rand < 0.2 && availableActions.includes(allInAction)) {
                decision = { action: allInAction, amount: this.player.chips };
            } else if (rand < 0.45 && availableActions.includes(raiseAction)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, 0.5);
                if (raiseAmount >= this.player.chips && this.player.chips > 0) {
                    decision = { action: allInAction, amount: this.player.chips };
                } else if (raiseAmount > 0) {
                    decision = { action: raiseAction, amount: raiseAmount };
                } else if (availableActions.includes(callAction)) {
                    decision = { action: callAction, amount: toCall };
                } else {
                    decision = { action: foldAction, amount: 0 };
                }
            } else if (rand < 0.75 && availableActions.includes(callAction)) {
                decision = { action: callAction, amount: toCall };
            } else {
                decision = { action: foldAction, amount: 0 };
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
        this.randomHistory.push({
            seed: randSeed,
            action: decision.action,
            amount: decision.amount,
            toCall: toCall,
            phase: gamePhase,
            timestamp: Date.now()
        });
        if (this.randomHistory.length > 100) this.randomHistory.shift();
        this.lastDecision = decision;
        return decision;
    }

    setRandomSeed(seed) {
        if (seed !== undefined) {
            Math.random = (function() {
                let s = seed;
                return function() {
                    s = (s * 1103515245 + 12345) & 0x7fffffff;
                    return s / 0x7fffffff;
                };
            })();
        } else {
            Math.random = function() { return Math.random(); };
        }
    }

    resetRandomness() {
        this.decisionRandomness = 0.7;
        this.bluffProbability = 0.4;
        this.actionWeights = {
            fold: 0.2,
            check: 0.2,
            call: 0.3,
            raise: 0.2,
            all_in: 0.1
        };
    }

    setActionWeights(weights) {
        this.actionWeights = { ...this.actionWeights, ...weights };
        let total = Object.values(this.actionWeights).reduce((a,b) => a + b, 0);
        if (total > 0) {
            for (let key in this.actionWeights) {
                this.actionWeights[key] /= total;
            }
        }
    }

    getActionWeights() {
        return { ...this.actionWeights };
    }

    getRandomHistory() {
        return [...this.randomHistory];
    }

    getRandomnessStats() {
        const actions = this.randomHistory.map(h => h.action);
        const counts = {
            fold: actions.filter(a => a === window.GameAction.FOLD).length,
            check: actions.filter(a => a === window.GameAction.CHECK).length,
            call: actions.filter(a => a === window.GameAction.CALL).length,
            raise: actions.filter(a => a === window.GameAction.RAISE).length,
            all_in: actions.filter(a => a === window.GameAction.ALL_IN).length
        };
        const total = this.randomHistory.length;
        return {
            totalDecisions: total,
            distribution: {
                fold: total ? counts.fold / total : 0,
                check: total ? counts.check / total : 0,
                call: total ? counts.call / total : 0,
                raise: total ? counts.raise / total : 0,
                all_in: total ? counts.all_in / total : 0
            },
            targetWeights: this.actionWeights,
            decisionRandomness: this.decisionRandomness,
            bluffProbability: this.bluffProbability
        };
    }

    updateExperience(result, potWon) {
        super.updateExperience(result, potWon);
        if (result === 'win') {
            this.actionWeights.call *= 0.98;
            this.actionWeights.raise *= 1.02;
            this.actionWeights.all_in *= 1.01;
            this.bluffProbability = Math.min(0.6, this.bluffProbability * 1.02);
        } else if (result === 'loss') {
            this.actionWeights.call *= 1.02;
            this.actionWeights.raise *= 0.98;
            this.actionWeights.all_in *= 0.99;
            this.bluffProbability = Math.max(0.2, this.bluffProbability * 0.98);
        }
        let total = Object.values(this.actionWeights).reduce((a,b) => a + b, 0);
        for (let key in this.actionWeights) {
            this.actionWeights[key] /= total;
        }
        this.decisionRandomness = Math.min(0.95, Math.max(0.3, this.decisionRandomness + (Math.random() - 0.5) * 0.05));
    }

    clone() {
        const clone = new window.AIRandom(this.player, { ...this.config });
        clone.decisionHistory = [...this.decisionHistory];
        clone.experience = { ...this.experience };
        clone.positionStats = JSON.parse(JSON.stringify(this.positionStats));
        clone.actionWeights = { ...this.actionWeights };
        clone.randomHistory = [...this.randomHistory];
        clone.decisionRandomness = this.decisionRandomness;
        clone.bluffProbability = this.bluffProbability;
        clone.randomFactor = this.randomFactor;
        return clone;
    }

    getStats() {
        const base = super.getStats();
        return {
            ...base,
            style: 'Random',
            randomFactor: this.randomFactor,
            decisionRandomness: this.decisionRandomness,
            bluffProbability: this.bluffProbability,
            actionWeights: this.actionWeights,
            randomDecisions: this.randomHistory.length,
            lastRandomSeed: this.lastRandomSeed
        };
    }
};

window.AIRandom = window.AIRandom;

console.log('ai_Random.js loaded');
