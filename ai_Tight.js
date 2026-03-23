window.AITight = class AITight extends window.AIBase {
    constructor(player, config = null) {
        super(player, config);
        this.style = window.AI_STYLES.TIGHT;
        this.vpipTarget = 0.15;
        this.pfrTarget = 0.08;
        this.threeBetRange = ['AA', 'KK', 'QQ', 'AKs'];
        this.openRaiseRange = ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'];
        this.callRange = ['99', '88', '77', 'AJs', 'ATs', 'KQs', 'AQo'];
        this.bluffRange = [];
        this.handRangeCache = new Map();
    }

    getHandStrength(communityCards, gamePhase) {
        let strength = super.getHandStrength(communityCards, gamePhase);
        if (gamePhase === window.GamePhase.PREFLOP) {
            const handKey = this.getHandKey();
            if (this.isPremiumHand(handKey)) strength = Math.max(strength, 0.8);
            else if (this.isSpeculativeHand(handKey)) strength = Math.min(strength, 0.4);
            else strength = Math.min(strength, 0.3);
        } else {
            if (strength < 0.5) strength *= 0.7;
            if (strength > 0.8) strength = Math.min(0.95, strength * 1.1);
        }
        return strength;
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

    isPremiumHand(handKey) {
        const premiums = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo'];
        return premiums.includes(handKey);
    }

    isSpeculativeHand(handKey) {
        const speculative = ['TT', '99', '88', 'AJs', 'ATs', 'KQs', 'AQo'];
        return speculative.includes(handKey);
    }

    shouldOpenRaise(handStrength, position) {
        const handKey = this.getHandKey();
        if (this.openRaiseRange.includes(handKey)) return true;
        if (position === 'late' && this.isSpeculativeHand(handKey)) return true;
        return false;
    }

    shouldCallRaise(handStrength, position, raiseSize, potOdds) {
        const handKey = this.getHandKey();
        if (this.callRange.includes(handKey)) return true;
        if (position === 'blind' && raiseSize <= 3 && this.isSpeculativeHand(handKey)) return true;
        if (potOdds > 3 && handStrength > 0.3) return true;
        return false;
    }

    shouldThreeBet(handStrength, position, initialRaise) {
        const handKey = this.getHandKey();
        if (this.threeBetRange.includes(handKey)) return true;
        if (position === 'late' && handStrength > 0.7 && initialRaise <= 3) return true;
        return false;
    }

    shouldFoldToRaise(handStrength, position, raiseSize, potOdds) {
        if (handStrength > 0.6) return false;
        if (raiseSize > 4 && handStrength < 0.4) return true;
        if (potOdds < 1.5 && handStrength < 0.5) return true;
        return false;
    }

    getBluffFrequency() {
        return Math.min(0.05, super.getBluffFrequency() * 0.3);
    }

    getCallThreshold() {
        let threshold = super.getCallThreshold();
        threshold *= 0.7;
        return Math.min(0.6, threshold);
    }

    getRaiseThreshold() {
        let threshold = super.getRaiseThreshold();
        threshold *= 1.2;
        return Math.min(0.9, Math.max(0.6, threshold));
    }

    getAllInThreshold() {
        let threshold = super.getAllInThreshold();
        threshold *= 1.1;
        return Math.min(0.95, threshold);
    }

    getAggressionModifier() {
        let agg = super.getAggressionModifier();
        agg *= 0.6;
        return Math.min(1.2, agg);
    }

    getRaiseAmount(currentBet, minRaise, potSize, handStrength) {
        let amount = super.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
        amount = Math.min(amount, potSize * 0.8);
        return Math.max(minRaise, amount);
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
                if (this.shouldOpenRaise(handStrength, position) && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (handStrength > 0.3) {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            } else {
                if (handStrength > 0.6 && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (handStrength > 0.3) {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                } else {
                    decision = { action: window.GameAction.CHECK, amount: 0 };
                }
            }
        } else {
            if (isPreflop) {
                const raiseSize = (currentBet - (this.player.currentBet || 0)) / window.getBigBlind();
                if (this.shouldThreeBet(handStrength, position, raiseSize) && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (this.shouldCallRaise(handStrength, position, raiseSize, potOdds) && availableActions.includes(window.GameAction.CALL)) {
                    decision = { action: window.GameAction.CALL, amount: toCall };
                } else if (this.shouldFoldToRaise(handStrength, position, raiseSize, potOdds)) {
                    decision = { action: window.GameAction.FOLD, amount: 0 };
                } else {
                    decision = { action: window.GameAction.FOLD, amount: 0 };
                }
            } else {
                if (handStrength > 0.7 && availableActions.includes(window.GameAction.RAISE)) {
                    const raiseAmount = this.getRaiseAmount(currentBet, minRaise, potSize, handStrength);
                    decision = { action: window.GameAction.RAISE, amount: raiseAmount };
                } else if (handStrength > 0.4 && availableActions.includes(window.GameAction.CALL)) {
                    decision = { action: window.GameAction.CALL, amount: toCall };
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
        this.lastDecision = decision;
        return decision;
    }

    updateExperience(result, potWon) {
        super.updateExperience(result, potWon);
        if (result === 'win') {
            this.vpipTarget *= 0.99;
            this.pfrTarget *= 0.98;
        } else if (result === 'loss' && potWon === 0) {
            this.vpipTarget *= 1.02;
            this.pfrTarget *= 1.01;
        }
        this.vpipTarget = Math.min(0.25, Math.max(0.1, this.vpipTarget));
        this.pfrTarget = Math.min(0.15, Math.max(0.05, this.pfrTarget));
    }

    getStats() {
        const base = super.getStats();
        return {
            ...base,
            style: 'Tight',
            vpipTarget: this.vpipTarget,
            pfrTarget: this.pfrTarget,
            openRaiseRange: this.openRaiseRange,
            threeBetRange: this.threeBetRange,
            callRange: this.callRange
        };
    }

    clone() {
        const clone = new window.AITight(this.player, { ...this.config });
        clone.decisionHistory = [...this.decisionHistory];
        clone.experience = { ...this.experience };
        clone.positionStats = JSON.parse(JSON.stringify(this.positionStats));
        clone.vpipTarget = this.vpipTarget;
        clone.pfrTarget = this.pfrTarget;
        return clone;
    }
};

window.AITight = window.AITight;

console.log('ai_Tight.js loaded');
