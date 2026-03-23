window.HumanPlayer = class HumanPlayer extends window.Player {
    constructor(id, name, chips) {
        super(id, name, chips, true);
        this.isHuman = true;
        this.isAI = false;
        this.pendingAction = null;
        this.actionResolve = null;
        this.actionReject = null;
        this.timeoutId = null;
        this.autoActionEnabled = false;
        this.autoActionDelay = 10;
    }

    requestAction(availableActions, currentBet, minRaise, gamePhase, timeBank) {
        return new Promise((resolve, reject) => {
            this.pendingAction = { availableActions, currentBet, minRaise, gamePhase, resolve, reject };
            this.actionResolve = resolve;
            this.actionReject = reject;
            if (timeBank > 0) {
                this.timeoutId = setTimeout(() => {
                    this.onTimeout();
                }, timeBank * 1000);
            }
            this.triggerUI();
        });
    }

    triggerUI() {
        if (window.view_ActionButtons && window.view_ActionButtons.showButtons) {
            window.view_ActionButtons.showButtons(this.pendingAction.availableActions, this.pendingAction.currentBet, this.pendingAction.minRaise, this.pendingAction.gamePhase);
        }
        if (window.view_Game && window.view_Game.highlightPlayer) {
            window.view_Game.highlightPlayer(this.id, true);
        }
    }

    onTimeout() {
        if (this.pendingAction && this.pendingAction.resolve) {
            const autoAction = this.getAutoAction();
            if (autoAction) {
                this.resolveAction(autoAction.action, autoAction.amount);
            } else {
                this.resolveAction(window.GameAction.FOLD, 0);
            }
        }
    }

    getAutoAction() {
        if (this.autoActionEnabled) {
            const available = this.pendingAction.availableActions;
            if (available.includes(window.GameAction.CHECK)) return { action: window.GameAction.CHECK, amount: 0 };
            if (available.includes(window.GameAction.CALL)) {
                const callAmount = window.getActionCallAmount(this, this.pendingAction.currentBet);
                return { action: window.GameAction.CALL, amount: callAmount };
            }
            if (available.includes(window.GameAction.FOLD)) return { action: window.GameAction.FOLD, amount: 0 };
        }
        return null;
    }

    resolveAction(action, amount) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.actionResolve) {
            this.actionResolve({ action, amount });
            this.pendingAction = null;
            this.actionResolve = null;
            this.actionReject = null;
        }
    }

    rejectAction(error) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.actionReject) {
            this.actionReject(error);
            this.pendingAction = null;
            this.actionResolve = null;
            this.actionReject = null;
        }
    }

    setAutoAction(enabled, delaySeconds = 10) {
        this.autoActionEnabled = enabled;
        this.autoActionDelay = delaySeconds;
    }

    cancelPendingAction() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.actionReject) {
            this.actionReject(new Error('Action cancelled'));
            this.pendingAction = null;
            this.actionResolve = null;
            this.actionReject = null;
        }
    }

    isWaitingForAction() {
        return this.pendingAction !== null;
    }

    getPendingActionInfo() {
        if (!this.pendingAction) return null;
        return {
            availableActions: this.pendingAction.availableActions,
            currentBet: this.pendingAction.currentBet,
            minRaise: this.pendingAction.minRaise,
            gamePhase: this.pendingAction.gamePhase
        };
    }

    performFold() {
        if (this.isWaitingForAction()) {
            this.resolveAction(window.GameAction.FOLD, 0);
            return true;
        }
        return false;
    }

    performCheck() {
        if (this.isWaitingForAction() && this.pendingAction.availableActions.includes(window.GameAction.CHECK)) {
            this.resolveAction(window.GameAction.CHECK, 0);
            return true;
        }
        return false;
    }

    performCall() {
        if (this.isWaitingForAction() && this.pendingAction.availableActions.includes(window.GameAction.CALL)) {
            const callAmount = window.getActionCallAmount(this, this.pendingAction.currentBet);
            this.resolveAction(window.GameAction.CALL, callAmount);
            return true;
        }
        return false;
    }

    performRaise(amount) {
        if (this.isWaitingForAction() && this.pendingAction.availableActions.includes(window.GameAction.RAISE)) {
            const validAmount = Math.min(amount, this.chips);
            const minRaiseAmount = window.getActionMinRaiseAmount(this, this.pendingAction.currentBet, this.pendingAction.minRaise);
            if (validAmount >= minRaiseAmount || validAmount === this.chips) {
                this.resolveAction(window.GameAction.RAISE, validAmount);
                return true;
            }
        }
        return false;
    }

    performAllIn() {
        if (this.isWaitingForAction() && this.pendingAction.availableActions.includes(window.GameAction.ALL_IN)) {
            this.resolveAction(window.GameAction.ALL_IN, this.chips);
            return true;
        }
        return false;
    }

    performActionByName(actionName, amount = null) {
        const actionMap = {
            'fold': () => this.performFold(),
            'check': () => this.performCheck(),
            'call': () => this.performCall(),
            'raise': () => amount !== null ? this.performRaise(amount) : false,
            'all_in': () => this.performAllIn(),
            'allin': () => this.performAllIn()
        };
        const fn = actionMap[actionName.toLowerCase()];
        return fn ? fn() : false;
    }

    resetForNewHand() {
        super.resetForNewHand();
        this.cancelPendingAction();
    }

    getActionButtonsConfig() {
        if (!this.pendingAction) return null;
        const actions = this.pendingAction.availableActions;
        const config = {};
        for (let act of actions) {
            config[act] = {
                enabled: true,
                text: window.getActionName(act),
                icon: window.getActionIcon(act),
                color: window.getActionColor(act)
            };
            if (act === window.GameAction.RAISE) {
                config[act].minAmount = window.getActionMinRaiseAmount(this, this.pendingAction.currentBet, this.pendingAction.minRaise);
                config[act].maxAmount = window.getActionMaxRaiseAmount(this, this.pendingAction.currentBet);
                config[act].defaultAmount = Math.min(config[act].maxAmount, config[act].minAmount * 3);
            }
            if (act === window.GameAction.CALL) {
                config[act].amount = window.getActionCallAmount(this, this.pendingAction.currentBet);
            }
            if (act === window.GameAction.ALL_IN) {
                config[act].amount = this.chips;
            }
        }
        return config;
    }

    static createDefaultHuman(id = 0, chips = 1000) {
        return new window.HumanPlayer(id, 'Вы', chips);
    }

    static fromJSON(data) {
        const player = new window.HumanPlayer(data.id, data.name, data.chips);
        player.startChips = data.startChips;
        player.hand = data.hand.map(c => new window.Card(c.rank, c.suit));
        player.folded = data.folded;
        player.isActive = data.isActive;
        player.currentBet = data.currentBet;
        player.totalBetThisRound = data.totalBetThisRound;
        player.position = data.position;
        player.isDealer = data.isDealer;
        player.isSmallBlind = data.isSmallBlind;
        player.isBigBlind = data.isBigBlind;
        player.rebuysUsed = data.rebuysUsed;
        player.handsPlayed = data.handsPlayed;
        player.handsWon = data.handsWon;
        player.totalWinnings = data.totalWinnings;
        player.sitOut = data.sitOut;
        player.disconnected = data.disconnected;
        player.autoActionEnabled = data.autoActionEnabled || false;
        player.autoActionDelay = data.autoActionDelay || 10;
        return player;
    }

    toJSON() {
        const base = super.toJSON();
        return {
            ...base,
            autoActionEnabled: this.autoActionEnabled,
            autoActionDelay: this.autoActionDelay
        };
    }
};

window.HumanPlayer = window.HumanPlayer;
window.createHumanPlayer = function(id, name, chips) {
    return new window.HumanPlayer(id, name, chips);
};

console.log('model_HumanPlayer.js loaded');
