window.AIAggressive = class AIAggressive extends window.AIBase {
    constructor(player, config = null) {
        super(player, config);
        this.style = window.AI_STYLES.AGGRESSIVE;
        this.vpipTarget = 0.35;
        this.pfrTarget = 0.28;
        this.threeBetRange = ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo', 'KQs'];
        this.openRaiseRange = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'AQo', 'KQs', 'KJs', 'QJs', 'JTs'];
        this.squeezeRange = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo'];
        this.bluffFrequencyBase = 0.35;
        this.continuationBetPercentage = 0.85;
        this.doubleBarrelPercentage = 0.65;
        this.checkRaisePercentage = 0.4;
        this.stealAttempts = 0;
        this.stealSuccesses = 0;
    }

    getHandStrength(communityCards, gamePhase) {
        let strength = super.getHandStrength(communityCards, gamePhase);
        if (gamePhase === window.GamePhase.PREFLOP) {
            const handKey = this.getHandKey();
            if (this.isStrongHand(handKey)) strength = Math.max(strength, 0.85);
            else if (this.isPlayableHand(handKey)) strength = Math.max(strength, 0.55);
            else strength = Math.min(strength, 0.4);
        } else {
            if (strength > 0.4) strength *= 1.2;
            if (strength < 0.2 && this.getPositionCategory() === 'late') strength += 0.15;
        }
        return Math.min(0.98, strength);
    }

    getHandKey() {
        if (this.player.hand.length < 2) return '';
        const c1 = this.player.hand[0];
        const c2 = this.player.hand[1];
        const r1 = c1.rankValue;
        const r2 = c2.rankValue;
        const isPair = (r1 === r2);
        const isSuited = (c1.suit === c2.suit);
        const high = Math.max(r1, r2);
        const low = Math.min(r1, r2);
        if (isPair) return `${window.getRankSymbol(high)}${window.getRankSymbol(high)}`;
        return `${window.getRankSymbol(high)}${window.getRankSymbol(low)}${isSuited ? 's' : 'o'}`;
    }

    isStrongHand(handKey) {
        const strong = ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'];
        return strong.includes(handKey);
    }

    isPlayableHand(handKey) {
        const playable = ['99', '88', '77', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'AQo', 'KQo'];
        return playable.includes(handKey);
    }

    shouldStealBlind(position, opponentsRemaining) {
        if (position !== 'late' && position !== 'cutoff') return false;
        if (opponentsRemaining <= 2) return true;
        const stealSuccessRate = this.stealAttempts > 0 ? this.stealSuccesses / this.stealAttempts : 0.5;
        return Math.random() < (0.6 + stealSuccessRate * 0.3);
    }

    shouldContinuationBet(flopStrength, position, opponentsRemaining, potSize) {
        if (flopStrength > 0.6) return true;
        if (position === 'late' && opponentsRemaining === 1) return Math.random() < this.continuationBetPercentage;
        if (flopStrength > 0.3) return Math.random() < (this.continuationBetPercentage * 0.8);
        return Math.random() < (this.continuationBetPercentage * 0.5);
    }

    shouldDoubleBarrel(turnStrength, flopStrength, position, opponentsRemaining) {
        if (turnStrength > 0.7) return true;
        if (position === 'late' && opponentsRemaining === 1 && flopStrength > 0.3) return Math.random() < this.doubleBarrelPercentage;
        if (turnStrength > 0.4) return Math.random() < (this.doubleBarrelPercentage * 0.7);
        return false;
    }

    shouldCheckRaise(handStrength, position, opponentsRemaining) {
        if (handStrength > 0.8 && opponentsRemaining === 1) return Math.random() < this.checkRaisePercentage;
        if (handStrength > 0.6 && position === 'blind') return Math.random() < (this.checkRaisePercentage * 0.8);
        return false;
    }

    getBluffFrequency() {
        let bluff = this.bluffFrequencyBase;
        bluff += (this.stealAttempts > 0 ? (this.stealSuccesses / this.stealAttempts) * 0.2 : 0.1);
        bluff += this.player.consecutiveWins * 0.05;
        bluff -= this.player.consecutiveLosses * 0.03;
        return Math.min(0.65, Math.max(0.2, bluff));
    }

    getCallThreshold() {
        let threshold = super.getCallThreshold();
        threshold *= 0.6;
        return Math.min(0.5, threshold);
    }

    getRaiseThreshold() {
        let threshold = super.getRaiseThreshold();
        threshold *= 0.8;
        return Math.min(0.7, Math.max(0.3, threshold));
    }

    getAllInThreshold() {
        let threshold = super.getAllInThreshold();
        threshold *= 0.7;
        return Math.min(0.8, threshold);
    }

    getAggressionModifier() {
        let agg = super.getAggressionModifier();
        agg *= 1.5;
        return Math.min(2.8, Math.max(1.2, agg));
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        let amount = super.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
        amount = Math.min(amount, potSize * 1.2);
        if (this.shouldContinuationBet(handStrength, this.getPositionCategory(), 1, potSize)) {
            amount = Math.max(amount, potSize * 0.66);
        }
        return Math.max(minRaise, amount);
    }

    decideAction(communityCards, currentBet, potSize, gamePhase, availableActions, minRaise, opponents) {
        const handStrength = this.getHandStrength(communityCards, gamePhase);
        const potOdds = this.getPotOdds(currentBet, potSize);
        const position = this.getPositionCategory();
        const toCall = Math.max(0, currentBet - (this.player.currentBet || 0));
        const isPreflop = (gamePhase === window.GamePhase.PREFLOP);
        const activeOpponents = opponents.filter(o => !o.folded).length;
        let decision = { action: window.GameAction.FOLD, amount: 0 };
        if (toCall === 0) {
            if (isPreflop) {
                if (this.shouldStealBlind(position, activeOpponents) && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                    this.stealAttempts++;
                } else if (handStrength > 0.4 || this.openRaiseRange.includes(this.getHandKey())) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    if (raiseAmount > 0 && availableActions.includes(window.GameAction.RAISE)) {
                        decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                    } else {
                        decision = { action: window.GameAction.CHECK, amount: 0 };
                    }
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else {
                if (communityCards.length === 3 && this.shouldContinuationBet(handStrength, position, activeOpponents, potSize)) {
                    const cbetAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    if (cbetAmount > 0 && availableActions.includes(window.GameAction.RAISE)) {
                        decision = { action: window.GameAction.RAISE, amount: cbetAmount };
                    } else {
                        decision = { action: window.GameAction.CHECK, amount: 0 };
                    }
                } else if (handStrength > 0.5 && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (handStrength > 0.25) {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            }
        } else {
            if (isPreflop) {
                const raiseSize = (currentBet - (this.player.currentBet || 0)) / window.getBigBlind();
                if (handStrength > 0.6 || this.threeBetRange.includes(this.getHandKey())) {
                    const threeBetAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    if (threeBetAmount <= this.player.chips && availableActions.includes(window.GameAction.RAISE)) {
                        decision = { action: window.GameAction.RAISE, amount: threeBetAmount };
                    } else if (availableActions.includes(window.GameAction.CALL)) {
                        decision = { action: window.GameAction.CALL, amount: toCall };
                    }
                } else if (handStrength > 0.35 && potOdds > 1.5 && availableActions.includes(window.GameAction.CALL)) {
                    decision = { action: window.GameAction.CALL, amount: toCall };
                } else {
                    decision = { action: window.GameAction.FOLD, amount: 0 };
                }
            } else {
                if (handStrength > 0.6 && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (handStrength > 0.3 && availableActions.includes(window.GameAction.CALL)) {
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
        }
        if (decision.action === window.GameAction.RAISE && decision.amount === this.player.chips) {
            decision.action = window.GameAction.ALL_IN;
        }
        if (!availableActions.includes(decision.action)) {
            if (availableActions.includes(window.GameAction.CHECK)) decision = { action: window.GameAction.CHECK, amount: 0 };
            else if (availableActions.includes(window.GameAction.CALL)) decision = { action: window.GameAction.CALL, amount: toCall };
            else decision = { action: window.GameAction.FOLD, amount: 0 };
        }
        if (decision.action === window.GameAction.RAISE || decision.action === window.GameAction.ALL_IN) {
            if (toCall === 0 && decision.amount > 0 && decision.amount <= potSize * 1.5) {
                if (activeOpponents === 1 && Math.random() < 0.3) this.stealSuccesses++;
            }
        }
        this.lastDecision = decision;
        return decision;
    }

    updateExperience(result, potWon) {
        super.updateExperience(result, potWon);
        if (result === 'win') {
            this.vpipTarget = Math.min(0.45, this.vpipTarget * 1.02);
            this.pfrTarget = Math.min(0.38, this.pfrTarget * 1.03);
            this.bluffFrequencyBase = Math.min(0.5, this.bluffFrequencyBase * 1.02);
        } else if (result === 'loss' && potWon === 0) {
            this.vpipTarget = Math.max(0.28, this.vpipTarget * 0.98);
            this.pfrTarget = Math.max(0.22, this.pfrTarget * 0.97);
            this.bluffFrequencyBase = Math.max(0.25, this.bluffFrequencyBase * 0.98);
        }
    }

    getStats() {
        const base = super.getStats();
        return {
            ...base,
            style: 'Aggressive',
            vpipTarget: this.vpipTarget,
            pfrTarget: this.pfrTarget,
            continuationBetPercentage: this.continuationBetPercentage,
            doubleBarrelPercentage: this.doubleBarrelPercentage,
            checkRaisePercentage: this.checkRaisePercentage,
            stealAttempts: this.stealAttempts,
            stealSuccesses: this.stealSuccesses,
            stealSuccessRate: this.stealAttempts > 0 ? this.stealSuccesses / this.stealAttempts : 0
        };
    }

    clone() {
        const clone = new window.AIAggressive(this.player, { ...this.config });
        clone.decisionHistory = [...this.decisionHistory];
        clone.experience = { ...this.experience };
        clone.positionStats = JSON.parse(JSON.stringify(this.positionStats));
        clone.vpipTarget = this.vpipTarget;
        clone.pfrTarget = this.pfrTarget;
        clone.stealAttempts = this.stealAttempts;
        clone.stealSuccesses = this.stealSuccesses;
        return clone;
    }
};

window.AIAggressive = window.AIAggressive;

console.log('ai_Aggressive.js loaded');
