window.AIPlayer = class AIPlayer extends window.Player {
    constructor(id, name, chips, style = null) {
        super(id, name, chips, false);
        this.isHuman = false;
        this.isAI = true;
        this.aiStyle = style || window.getAIPlayerStyleFromIndex(id);
        this.aiConfig = window.getAIConfigForPlayer(id, this.aiStyle);
        this.decisionDelay = 500;
        this.lastDecisionTime = 0;
        this.bluffCounter = 0;
        this.aggressionModifier = 1.0;
        this.tiltLevel = 0;
        this.consecutiveLosses = 0;
        this.consecutiveWins = 0;
        this.handHistory = [];
        this.opponentProfiles = new Map();
        this.positionalStats = {
            early: { hands: 0, vpip: 0, pfr: 0 },
            middle: { hands: 0, vpip: 0, pfr: 0 },
            late: { hands: 0, vpip: 0, pfr: 0 },
            blind: { hands: 0, vpip: 0, pfr: 0 }
        };
        this.handStrengthCache = new Map();
        this.lastHandStrength = 0;
        this.lastPotOdds = 0;
        this.lastDecision = null;
        this.experience = { hands: 0, wins: 0, losses: 0, winnings: 0 };
    }

    resetForNewHand() {
        super.resetForNewHand();
        this.bluffCounter = Math.max(0, this.bluffCounter - 0.1);
        this.aggressionModifier = Math.min(2.0, this.aggressionModifier + 0.02);
        if (this.consecutiveLosses > 3) this.tiltLevel = Math.min(0.3, this.tiltLevel + 0.05);
        else if (this.consecutiveWins > 2) this.tiltLevel = Math.max(0, this.tiltLevel - 0.03);
        this.handStrengthCache.clear();
    }

    updateExperience(result, potWon) {
        window.updateAIExperience(this, result, potWon);
        if (result === 'win') {
            this.consecutiveWins++;
            this.consecutiveLosses = 0;
            this.tiltLevel = Math.max(0, this.tiltLevel - 0.02);
        } else if (result === 'loss') {
            this.consecutiveLosses++;
            this.consecutiveWins = 0;
            this.tiltLevel = Math.min(0.5, this.tiltLevel + 0.03);
        }
        this.handsPlayed++;
        if (result === 'win') this.handsWon++;
    }

    getHandStrength(communityCards, gamePhase) {
        if (!this.hand.length) return 0;
        const cacheKey = `${this.hand[0].toString()}_${this.hand[1].toString()}_${communityCards.map(c=>c.toString()).join('_')}_${gamePhase}`;
        if (this.handStrengthCache.has(cacheKey)) return this.handStrengthCache.get(cacheKey);
        let strength = 0;
        if (gamePhase === window.GamePhase.PREFLOP) {
            strength = window.getAIHandStrengthFromPreflop(this.hand[0], this.hand[1]);
        } else {
            strength = window.getAIHandStrengthFromPostflop(this.hand, communityCards);
            if (window.isAIMonteCarloEnabled()) {
                const monteCarlo = window.getAIMonteCarloStrength(this.hand, communityCards, [], window.getAIMonteCarloIterations());
                if (monteCarlo !== null) strength = (strength + monteCarlo) / 2;
            }
        }
        strength = Math.min(1, Math.max(0, strength));
        this.handStrengthCache.set(cacheKey, strength);
        this.lastHandStrength = strength;
        return strength;
    }

    getPotOdds(currentBet, potSize) {
        const callAmount = window.getRequiredCallAmount(this, currentBet);
        if (callAmount <= 0) return Infinity;
        const odds = potSize / callAmount;
        this.lastPotOdds = odds;
        return odds;
    }

    getPositionCategory() {
        if (this.isDealer) return 'late';
        if (this.isSmallBlind || this.isBigBlind) return 'blind';
        if (this.position === 'early' || this.position === 'middle') return this.position;
        return 'middle';
    }

    getPositionWeight() {
        const pos = this.getPositionCategory();
        const weights = { early: 0.8, middle: 1.0, late: 1.3, blind: 0.9 };
        return weights[pos] * window.getAIPositionWeight();
    }

    getBluffAdjustment() {
        const baseBluff = this.aiConfig.bluffFrequency;
        let adj = baseBluff;
        adj += this.bluffCounter * 0.1;
        adj += this.tiltLevel * 0.2;
        adj += (1 - this.lastHandStrength) * 0.1;
        adj = Math.min(0.8, Math.max(0.05, adj));
        return adj;
    }

    getAggressionAdjustment() {
        let adj = this.aiConfig.aggressionBase / 5;
        adj *= this.aggressionModifier;
        adj *= (1 + this.tiltLevel * 0.5);
        adj *= (this.consecutiveWins > 2 ? 1.2 : 1);
        return Math.min(2.5, Math.max(0.5, adj));
    }

    getStackSizeFactor() {
        const bb = window.getBigBlind();
        const stack = this.chips;
        if (stack < bb * 10) return 1.5;
        if (stack < bb * 20) return 1.2;
        if (stack > bb * 80) return 0.8;
        return 1.0;
    }

    shouldBluff(handStrength, potOdds, position) {
        const bluffProb = this.getBluffAdjustment();
        if (handStrength > 0.7) return false;
        if (handStrength < 0.2 && potOdds > 2) return Math.random() < bluffProb * 0.8;
        if (position === 'late' && handStrength < 0.4) return Math.random() < bluffProb;
        if (this.consecutiveWins > 3 && handStrength < 0.5) return Math.random() < bluffProb * 1.2;
        return false;
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        let raiseMultiplier = this.aiConfig.minRaiseMultiplier;
        const aggAdj = this.getAggressionAdjustment();
        const stackFactor = this.getStackSizeFactor();
        const strengthFactor = 0.5 + handStrength * 1.5;
        let multiplier = raiseMultiplier * aggAdj * strengthFactor * stackFactor;
        multiplier = Math.min(this.aiConfig.maxRaiseMultiplier, Math.max(this.aiConfig.minRaiseMultiplier, multiplier));
        let raiseSize = (currentBet - this.currentBet) * multiplier;
        const maxBet = this.chips;
        const minTotal = currentBet + minRaise;
        raiseSize = Math.max(minTotal - this.currentBet, raiseSize);
        raiseSize = Math.min(raiseSize, maxBet);
        if (raiseSize === maxBet) return maxBet;
        if (raiseSize < minRaise) raiseSize = minRaise;
        return Math.floor(raiseSize);
    }

    decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const handStrength = this.getHandStrength(communityCards, gamePhase);
        const potOdds = this.getPotOdds(currentBet, potSize);
        const position = this.getPositionCategory();
        const positionWeight = this.getPositionWeight();
        const adjustedStrength = handStrength * positionWeight;
        const toCall = window.getRequiredCallAmount(this, currentBet);
        const stackSize = this.chips;
        const callThreshold = this.aiConfig.callThreshold;
        const raiseThreshold = this.aiConfig.raiseThreshold;
        const allInThreshold = this.aiConfig.allInThreshold;
        let decision = { action: window.GameAction.FOLD, amount: 0 };
        if (toCall === 0) {
            if (adjustedStrength > callThreshold * 0.6 || this.shouldBluff(handStrength, potOdds, position)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, adjustedStrength);
                if (raiseAmount >= this.chips && this.chips > 0 && adjustedStrength > 0.3) {
                    decision = { action: window.GameAction.ALL_IN, amount: this.chips };
                } else if (raiseAmount > 0 && availableActions.includes(window.GameAction.RAISE)) {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else {
                decision = { action: window.GameAction.CHECK, amount: 0 };
            }
        } else {
            if (adjustedStrength > allInThreshold || (toCall >= this.chips && adjustedStrength > 0.6)) {
                decision = { action: window.GameAction.ALL_IN, amount: this.chips };
            } else if (adjustedStrength > raiseThreshold && availableActions.includes(window.GameAction.RAISE)) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, adjustedStrength);
                if (raiseAmount >= this.chips) {
                    decision = { action: window.GameAction.ALL_IN, amount: this.chips };
                } else {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                }
            } else if (adjustedStrength > callThreshold && toCall <= this.chips) {
                decision = { action: window.GameAction.CALL, amount: toCall };
            } else if (this.shouldBluff(handStrength, potOdds, position) && toCall <= this.chips * 0.3) {
                const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, 0.2);
                if (raiseAmount <= this.chips) {
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else {
                    decision = { action: window.GameAction.FOLD, amount: 0 };
                }
            } else {
                decision = { action: window.GameAction.FOLD, amount: 0 };
            }
        }
        if (decision.action === window.GameAction.RAISE && decision.amount === this.chips) decision.action = window.GameAction.ALL_IN;
        if (!availableActions.includes(decision.action)) {
            if (availableActions.includes(window.GameAction.CHECK)) decision = { action: window.GameAction.CHECK, amount: 0 };
            else if (availableActions.includes(window.GameAction.CALL)) decision = { action: window.GameAction.CALL, amount: toCall };
            else decision = { action: window.GameAction.FOLD, amount: 0 };
        }
        this.lastDecision = decision;
        return decision;
    }

    async makeDecision(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        await this.delay(this.decisionDelay);
        const decision = this.decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents);
        if (decision.action === window.GameAction.RAISE || decision.action === window.GameAction.ALL_IN) {
            this.bluffCounter += (decision.action === window.GameAction.RAISE && this.lastHandStrength < 0.3) ? 0.1 : -0.05;
            this.bluffCounter = Math.max(0, Math.min(1, this.bluffCounter));
        }
        if (decision.action === window.GameAction.FOLD) this.aggressionModifier = Math.max(0.5, this.aggressionModifier - 0.02);
        else this.aggressionModifier = Math.min(2, this.aggressionModifier + 0.01);
        this.recordAction(decision.action, decision.amount, gamePhase);
        return decision;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateOpponentProfile(opponentId, action, result, betSize, stackSize) {
        if (!this.opponentProfiles.has(opponentId)) {
            this.opponentProfiles.set(opponentId, {
                handsSeen: 0, folds: 0, calls: 0, raises: 0, allIns: 0, wins: 0, losses: 0,
                avgBetSize: 0, totalBet: 0, aggression: 0.5, tightness: 0.5
            });
        }
        const profile = this.opponentProfiles.get(opponentId);
        profile.handsSeen++;
        if (action === window.GameAction.FOLD) profile.folds++;
        else if (action === window.GameAction.CALL) profile.calls++;
        else if (action === window.GameAction.RAISE) { profile.raises++; profile.totalBet += betSize; profile.avgBetSize = profile.totalBet / profile.raises; }
        else if (action === window.GameAction.ALL_IN) profile.allIns++;
        if (result === 'win') profile.wins++;
        else if (result === 'loss') profile.losses++;
        profile.aggression = (profile.raises + profile.allIns) / profile.handsSeen;
        profile.tightness = (profile.folds) / profile.handsSeen;
        this.opponentProfiles.set(opponentId, profile);
    }

    getOpponentAggression(opponentId) {
        const profile = this.opponentProfiles.get(opponentId);
        return profile ? profile.aggression : 0.5;
    }

    getOpponentTightness(opponentId) {
        const profile = this.opponentProfiles.get(opponentId);
        return profile ? profile.tightness : 0.5;
    }

    adjustForOpponents(opponents, handStrength) {
        let adjustment = 1.0;
        let avgOppAgg = 0;
        let count = 0;
        for (let opp of opponents) {
            if (opp !== this && !opp.folded) {
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

    getAdaptiveThresholds() {
        let call = this.aiConfig.callThreshold;
        let raise = this.aiConfig.raiseThreshold;
        let allIn = this.aiConfig.allInThreshold;
        call += (this.tiltLevel * 0.1);
        raise -= (this.tiltLevel * 0.05);
        allIn -= (this.tiltLevel * 0.1);
        call = Math.min(0.95, Math.max(0.05, call));
        raise = Math.min(0.95, Math.max(0.05, raise));
        allIn = Math.min(0.95, Math.max(0.05, allIn));
        return { call, raise, allIn };
    }

    getHandStrengthVsRange(communityCards, gamePhase) {
        const strength = this.getHandStrength(communityCards, gamePhase);
        if (gamePhase === window.GamePhase.PREFLOP) return strength;
        const potential = strength * 0.7 + (this.hand[0].rankValue + this.hand[1].rankValue) / 28 * 0.3;
        return Math.min(1, potential);
    }

    shouldFoldToAggression(opponentAgg, handStrength, potOdds) {
        if (opponentAgg > 0.8 && handStrength < 0.4) return true;
        if (opponentAgg > 0.6 && handStrength < 0.3) return true;
        if (potOdds < 0.5 && handStrength < 0.5) return true;
        return false;
    }

    getBluffSuccessEstimate(opponents, communityCards) {
        let successProb = 0.5;
        let aggressiveOpponents = 0;
        for (let opp of opponents) {
            if (opp !== this && !opp.folded && this.getOpponentAggression(opp.id) > 0.6) aggressiveOpponents++;
        }
        successProb -= aggressiveOpponents * 0.1;
        if (communityCards.length >= 3) {
            const boardTexture = communityCards.map(c => c.rankValue).reduce((a,b)=>a+b,0) / communityCards.length;
            if (boardTexture > 10) successProb -= 0.1;
        }
        return Math.max(0.2, Math.min(0.8, successProb));
    }

    getCbetProbability(flopStrength, position, opponentsRemaining) {
        let prob = 0.7;
        if (flopStrength > 0.7) prob = 0.9;
        else if (flopStrength < 0.3) prob = 0.3;
        if (position === 'late') prob += 0.1;
        if (opponentsRemaining > 2) prob -= 0.2;
        return Math.min(0.95, Math.max(0.1, prob));
    }

    decideCbet(flopStrength, position, opponentsRemaining, potSize, currentBet) {
        const prob = this.getCbetProbability(flopStrength, position, opponentsRemaining);
        if (Math.random() < prob) {
            let cbetSize = potSize * (0.5 + flopStrength * 0.3);
            cbetSize = Math.min(cbetSize, this.chips);
            return { action: window.GameAction.RAISE, amount: cbetSize };
        }
        return { action: window.GameAction.CHECK, amount: 0 };
    }

    getTiltAdjustedDecision(baseDecision) {
        if (this.tiltLevel <= 0.1) return baseDecision;
        const tiltFactor = this.tiltLevel;
        if (baseDecision.action === window.GameAction.FOLD && Math.random() < tiltFactor * 0.5) {
            return { action: window.GameAction.CALL, amount: window.getRequiredCallAmount(this, baseDecision.amount) };
        }
        if ((baseDecision.action === window.GameAction.CALL || baseDecision.action === window.GameAction.CHECK) && Math.random() < tiltFactor * 0.3) {
            const raiseAmount = Math.min(this.chips, window.getBigBlind() * 4);
            return { action: window.GameAction.RAISE, amount: raiseAmount };
        }
        return baseDecision;
    }

    toJSON() {
        const base = super.toJSON();
        return {
            ...base,
            aiStyle: this.aiStyle,
            aiConfig: this.aiConfig,
            decisionDelay: this.decisionDelay,
            bluffCounter: this.bluffCounter,
            aggressionModifier: this.aggressionModifier,
            tiltLevel: this.tiltLevel,
            consecutiveLosses: this.consecutiveLosses,
            consecutiveWins: this.consecutiveWins,
            experience: this.experience
        };
    }

    static fromJSON(data) {
        const player = new window.AIPlayer(data.id, data.name, data.chips, data.aiStyle);
        player.aiConfig = data.aiConfig;
        player.decisionDelay = data.decisionDelay || 500;
        player.bluffCounter = data.bluffCounter || 0;
        player.aggressionModifier = data.aggressionModifier || 1.0;
        player.tiltLevel = data.tiltLevel || 0;
        player.consecutiveLosses = data.consecutiveLosses || 0;
        player.consecutiveWins = data.consecutiveWins || 0;
        player.experience = data.experience || { hands: 0, wins: 0, losses: 0, winnings: 0 };
        player.handsPlayed = data.handsPlayed || 0;
        player.handsWon = data.handsWon || 0;
        player.totalWinnings = data.totalWinnings || 0;
        player.hand = (data.hand || []).map(c => new window.Card(c.rank, c.suit));
        player.folded = data.folded;
        player.isActive = data.isActive;
        player.currentBet = data.currentBet;
        player.totalBetThisRound = data.totalBetThisRound;
        player.position = data.position;
        player.isDealer = data.isDealer;
        player.isSmallBlind = data.isSmallBlind;
        player.isBigBlind = data.isBigBlind;
        player.rebuysUsed = data.rebuysUsed;
        player.sitOut = data.sitOut;
        player.disconnected = data.disconnected;
        return player;
    }
};

window.AIPlayer = window.AIPlayer;
window.createAIPlayer = function(id, name, chips, style = null) {
    return new window.AIPlayer(id, name, chips, style);
};

console.log('model_AIPlayer.js loaded');
