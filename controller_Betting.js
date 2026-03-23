window.BettingController = class BettingController {
    constructor(gameState) {
        this.gameState = gameState;
        this.currentBet = 0;
        this.lastRaise = 0;
        this.lastRaiser = null;
        this.minRaise = 0;
        this.bettingRoundComplete = false;
        this.actionHistory = [];
    }

    initialize() {
        this.currentBet = 0;
        this.lastRaise = 0;
        this.lastRaiser = null;
        this.minRaise = window.getBigBlind();
        this.bettingRoundComplete = false;
        this.actionHistory = [];
    }

    reset() {
        this.initialize();
        if (this.gameState) {
            for (let p of this.gameState.players) {
                p.resetBet();
            }
            this.currentBet = 0;
        }
    }

    getCurrentBet() {
        return this.currentBet;
    }

    getLastRaise() {
        return this.lastRaise;
    }

    getMinRaise() {
        return this.minRaise;
    }

    isBettingComplete() {
        if (!this.gameState) return true;
        const activePlayers = this.gameState.players.filter(p => !p.folded && !p.isAllIn() && p.chips > 0);
        if (activePlayers.length <= 1) return true;
        for (let p of activePlayers) {
            if (p.currentBet !== this.currentBet) return false;
        }
        return true;
    }

    getPlayerToCall(player) {
        return Math.max(0, this.currentBet - (player.currentBet || 0));
    }

    canPlayerCheck(player) {
        return this.getPlayerToCall(player) === 0;
    }

    canPlayerCall(player) {
        const toCall = this.getPlayerToCall(player);
        return toCall > 0 && toCall <= player.chips;
    }

    canPlayerRaise(player) {
        const toCall = this.getPlayerToCall(player);
        const minRaiseAmount = this.getMinRaiseAmount(player);
        if (toCall >= player.chips) return false;
        if (toCall + minRaiseAmount > player.chips) {
            return player.chips > toCall;
        }
        return true;
    }

    canPlayerAllIn(player) {
        return player.chips > 0;
    }

    getMinRaiseAmount(player) {
        const toCall = this.getPlayerToCall(player);
        const baseMin = this.minRaise;
        if (toCall + baseMin <= player.chips) return baseMin;
        return player.chips - toCall;
    }

    getMaxRaiseAmount(player) {
        return player.chips;
    }

    getRaiseOptions(player) {
        const minRaise = this.getMinRaiseAmount(player);
        const maxRaise = this.getMaxRaiseAmount(player);
        const toCall = this.getPlayerToCall(player);
        const options = [];
        if (toCall < maxRaise) {
            if (minRaise <= maxRaise) {
                options.push({
                    amount: toCall + minRaise,
                    description: `Минимальный рейз (${toCall + minRaise})`
                });
                const potSize = this.gameState ? this.gameState.potManager.getTotal() : 0;
                const halfPot = toCall + Math.floor(potSize / 2);
                if (halfPot > toCall + minRaise && halfPot <= player.chips + player.currentBet) {
                    options.push({
                        amount: halfPot,
                        description: `Половина банка (${halfPot})`
                    });
                }
                const potBet = toCall + potSize;
                if (potBet > toCall + minRaise && potBet <= player.chips + player.currentBet) {
                    options.push({
                        amount: potBet,
                        description: `Размер банка (${potBet})`
                    });
                }
                options.push({
                    amount: maxRaise,
                    description: `Максимальный рейз (${maxRaise})`
                });
            }
        }
        return options;
    }

    processAction(player, action, amount = 0) {
        if (!player || player.folded) return { success: false, error: 'Player is folded' };
        const toCall = this.getPlayerToCall(player);
        let result = { success: false, action, amount: 0, allIn: false };
        switch (action) {
            case window.GameAction.FOLD:
                player.fold();
                result.success = true;
                result.amount = 0;
                this.recordAction(player, action, 0);
                break;
            case window.GameAction.CHECK:
                if (!this.canPlayerCheck(player)) {
                    return { success: false, error: 'Cannot check' };
                }
                result.success = true;
                result.amount = 0;
                this.recordAction(player, action, 0);
                break;
            case window.GameAction.CALL:
                if (!this.canPlayerCall(player)) {
                    return { success: false, error: 'Cannot call' };
                }
                const callAmount = Math.min(toCall, player.chips);
                const actualCall = this.gameState.potManager.addFromPlayer(player, callAmount);
                result.success = true;
                result.amount = actualCall;
                result.allIn = (player.chips === 0);
                this.currentBet = Math.max(this.currentBet, player.currentBet);
                this.recordAction(player, action, actualCall);
                break;
            case window.GameAction.RAISE:
                if (!this.canPlayerRaise(player)) {
                    return { success: false, error: 'Cannot raise' };
                }
                const minRaiseAmount = this.getMinRaiseAmount(player);
                let raiseAmount = amount;
                if (raiseAmount < minRaiseAmount) raiseAmount = minRaiseAmount;
                if (raiseAmount > player.chips) raiseAmount = player.chips;
                const totalBet = player.currentBet + raiseAmount;
                const actualRaise = this.gameState.potManager.addFromPlayer(player, raiseAmount);
                if (actualRaise > 0) {
                    this.currentBet = player.currentBet;
                    this.lastRaise = raiseAmount;
                    this.lastRaiser = player;
                    this.minRaise = this.lastRaise;
                    result.success = true;
                    result.amount = actualRaise;
                    result.allIn = (player.chips === 0);
                    this.recordAction(player, action, actualRaise);
                } else {
                    return { success: false, error: 'Raise amount invalid' };
                }
                break;
            case window.GameAction.ALL_IN:
                if (!this.canPlayerAllIn(player)) {
                    return { success: false, error: 'Cannot go all-in' };
                }
                const allInAmount = player.chips;
                const actualAllIn = this.gameState.potManager.addFromPlayer(player, allInAmount);
                result.success = true;
                result.amount = actualAllIn;
                result.allIn = true;
                if (player.currentBet > this.currentBet) {
                    this.currentBet = player.currentBet;
                    this.lastRaise = allInAmount;
                    this.lastRaiser = player;
                    this.minRaise = this.lastRaise;
                }
                this.recordAction(player, action, actualAllIn);
                break;
            default:
                return { success: false, error: 'Unknown action' };
        }
        if (result.success && this.gameState) {
            this.gameState.recordAction(player, action, result.amount);
        }
        return result;
    }

    recordAction(player, action, amount) {
        this.actionHistory.push({
            playerId: player.id,
            playerName: player.name,
            action: action,
            amount: amount,
            timestamp: Date.now(),
            currentBet: this.currentBet,
            playerChips: player.chips,
            playerBet: player.currentBet
        });
        if (this.actionHistory.length > 200) this.actionHistory.shift();
    }

    getLastActions(count = 10) {
        return this.actionHistory.slice(-count);
    }

    getPlayerActionSummary(player) {
        const playerActions = this.actionHistory.filter(a => a.playerId === player.id);
        const actions = {
            fold: 0,
            check: 0,
            call: 0,
            raise: 0,
            allIn: 0,
            total: playerActions.length
        };
        for (let a of playerActions) {
            switch (a.action) {
                case window.GameAction.FOLD: actions.fold++; break;
                case window.GameAction.CHECK: actions.check++; break;
                case window.GameAction.CALL: actions.call++; break;
                case window.GameAction.RAISE: actions.raise++; break;
                case window.GameAction.ALL_IN: actions.allIn++; break;
            }
        }
        return actions;
    }

    getAggressionFactor(player) {
        const summary = this.getPlayerActionSummary(player);
        const aggressive = summary.raise + summary.allIn;
        const passive = summary.call + summary.check;
        if (passive === 0) return aggressive > 0 ? 10 : 0;
        return aggressive / passive;
    }

    getVpip(player) {
        const summary = this.getPlayerActionSummary(player);
        const total = summary.total;
        if (total === 0) return 0;
        const vpipActions = summary.call + summary.raise + summary.allIn;
        return vpipActions / total;
    }

    getPfr(player) {
        const summary = this.getPlayerActionSummary(player);
        const total = summary.total;
        if (total === 0) return 0;
        const pfrActions = summary.raise + summary.allIn;
        return pfrActions / total;
    }

    resetRound() {
        this.currentBet = 0;
        this.lastRaise = 0;
        this.lastRaiser = null;
        this.minRaise = window.getBigBlind();
        this.bettingRoundComplete = false;
        if (this.gameState) {
            for (let p of this.gameState.players) {
                p.resetBet();
            }
        }
    }

    setGameState(gameState) {
        this.gameState = gameState;
    }

    getCurrentBetFromPlayers() {
        if (!this.gameState) return 0;
        let max = 0;
        for (let p of this.gameState.players) {
            if (!p.folded && p.currentBet > max) max = p.currentBet;
        }
        return max;
    }

    syncWithGameState() {
        if (!this.gameState) return;
        this.currentBet = this.gameState.currentBet;
        this.lastRaise = this.gameState.lastRaiseAmount;
        this.minRaise = this.lastRaise > 0 ? this.lastRaise : window.getBigBlind();
    }

    isPlayerAllIn(player) {
        return player.chips === 0 && !player.folded;
    }

    getPlayersStillInHand() {
        if (!this.gameState) return [];
        return this.gameState.players.filter(p => !p.folded && p.chips > 0);
    }

    getPlayersWithActionPending() {
        const stillIn = this.getPlayersStillInHand();
        return stillIn.filter(p => p.currentBet !== this.currentBet);
    }

    getNextPlayerToAct(currentPlayerIndex) {
        if (!this.gameState) return -1;
        let idx = (currentPlayerIndex + 1) % this.gameState.players.length;
        const start = idx;
        while (true) {
            const p = this.gameState.players[idx];
            if (!p.folded && !this.isPlayerAllIn(p)) {
                return idx;
            }
            idx = (idx + 1) % this.gameState.players.length;
            if (idx === start) break;
        }
        return -1;
    }

    getFirstPlayerToActAfterBlinds() {
        if (!this.gameState) return -1;
        let start = (this.gameState.bigBlindIndex + 1) % this.gameState.players.length;
        for (let i = 0; i < this.gameState.players.length; i++) {
            const idx = (start + i) % this.gameState.players.length;
            const p = this.gameState.players[idx];
            if (!p.folded && !this.isPlayerAllIn(p) && p.chips > 0) {
                return idx;
            }
        }
        return -1;
    }

    getFirstPlayerToActPostflop() {
        if (!this.gameState) return -1;
        let start = (this.gameState.dealerIndex + 1) % this.gameState.players.length;
        for (let i = 0; i < this.gameState.players.length; i++) {
            const idx = (start + i) % this.gameState.players.length;
            const p = this.gameState.players[idx];
            if (!p.folded && !this.isPlayerAllIn(p) && p.chips > 0) {
                return idx;
            }
        }
        return -1;
    }

    getPotOdds(player, potSize) {
        const toCall = this.getPlayerToCall(player);
        if (toCall <= 0) return Infinity;
        return potSize / toCall;
    }

    getRequiredEquity(player, potSize) {
        const toCall = this.getPlayerToCall(player);
        if (toCall <= 0) return 0;
        return toCall / (potSize + toCall);
    }

    getMinimumDefenseFrequency(potSize, betSize) {
        return betSize / (potSize + betSize);
    }

    getMaximumBetSize(player) {
        return player.chips;
    }

    getMinimumBetSize(player) {
        return this.minRaise;
    }

    getRaiseSizeFromPot(potSize, multiplier = 1) {
        return Math.floor(potSize * multiplier);
    }

    getStandardRaiseSize(potSize, currentBet) {
        const potRaise = potSize + currentBet;
        return potRaise;
    }

    getThreeBetSize(initialRaise, potSize) {
        return Math.floor(potSize * 1.2);
    }

    getFourBetSize(threeBetSize, potSize) {
        return Math.floor(potSize * 1.5);
    }

    isValueBet(handStrength, potOdds, position) {
        if (handStrength > 0.7) return true;
        if (handStrength > 0.5 && position === 'late') return true;
        return false;
    }

    isBluff(handStrength, potOdds, position, opponentsRemaining) {
        if (handStrength < 0.3 && potOdds > 2) return true;
        if (handStrength < 0.2 && opponentsRemaining === 1) return true;
        return false;
    }

    getBluffSuccessProbability(opponentsRemaining, boardTexture, playerImage) {
        let prob = 0.5;
        if (opponentsRemaining === 1) prob += 0.2;
        else if (opponentsRemaining > 2) prob -= 0.2;
        if (boardTexture === 'dry') prob += 0.1;
        else if (boardTexture === 'wet') prob -= 0.1;
        if (playerImage === 'aggressive') prob += 0.1;
        else if (playerImage === 'passive') prob -= 0.1;
        return Math.min(0.9, Math.max(0.1, prob));
    }

    evaluateBoardTexture(communityCards) {
        if (communityCards.length < 3) return 'preflop';
        const ranks = communityCards.map(c => c.rankValue);
        const suits = communityCards.map(c => c.suit);
        const isMonotone = new Set(suits).size === 1;
        const isPaired = new Set(ranks).size < ranks.length;
        const isConnected = false;
        let straightDrawPossible = false;
        if (isMonotone && isPaired) return 'very_wet';
        if (isMonotone || isPaired) return 'wet';
        return 'dry';
    }

    calculatePotControl(player, potSize, stackSize) {
        const stackToPot = stackSize / potSize;
        if (stackToPot < 1) return 'committed';
        if (stackToPot < 3) return 'medium';
        return 'deep';
    }

    getCBetSize(potSize, boardTexture, position) {
        let size = Math.floor(potSize * 0.66);
        if (boardTexture === 'dry') size = Math.floor(potSize * 0.5);
        if (boardTexture === 'wet') size = Math.floor(potSize * 0.75);
        if (position === 'late') size = Math.floor(potSize * 0.8);
        return Math.min(size, potSize * 2);
    }

    getCheckRaiseSize(potSize, betSize) {
        return Math.floor(potSize * 0.75);
    }

    getDonkBetSize(potSize) {
        return Math.floor(potSize * 0.5);
    }

    getFloatBetSize(potSize) {
        return Math.floor(potSize * 0.33);
    }

    validateBetSize(player, betAmount, isRaise = false) {
        if (betAmount > player.chips) return false;
        if (isRaise) {
            const toCall = this.getPlayerToCall(player);
            const minRaise = this.getMinRaiseAmount(player);
            if (betAmount < minRaise && betAmount < player.chips) return false;
        }
        return true;
    }

    calculateSidePots() {
        if (!this.gameState) return [];
        const allInPlayers = this.gameState.players.filter(p => !p.folded && p.isAllIn());
        if (allInPlayers.length === 0) return [];
        const players = this.gameState.players.filter(p => !p.folded);
        const bets = players.map(p => p.currentBet);
        const uniqueBets = [...new Set(bets)].sort((a,b)=>a-b);
        const sidePots = [];
        let prevBet = 0;
        for (let bet of uniqueBets) {
            const eligible = players.filter(p => p.currentBet >= bet);
            const amount = (bet - prevBet) * eligible.length;
            if (amount > 0) {
                sidePots.push({
                    amount: amount,
                    eligiblePlayers: eligible
                });
            }
            prevBet = bet;
        }
        return sidePots;
    }

    getEligiblePlayersForPot(potIndex) {
        const sidePots = this.calculateSidePots();
        if (potIndex < 0 || potIndex >= sidePots.length) return [];
        return sidePots[potIndex].eligiblePlayers;
    }

    getTotalCommitted(player) {
        return player.currentBet;
    }

    getRemainingStack(player) {
        return player.chips;
    }

    getStackToPotRatio(player, potSize) {
        if (potSize === 0) return Infinity;
        return player.chips / potSize;
    }

    getFoldEquity(player, betSize, potSize) {
        const foldProbability = 1 - (player.currentBet / (player.currentBet + player.chips));
        const equity = foldProbability * potSize;
        return equity;
    }

    getExpectedValue(player, action, amount, winProbability, potSize) {
        if (action === window.GameAction.FOLD) return 0;
        if (action === window.GameAction.CALL) {
            const toCall = this.getPlayerToCall(player);
            const ev = (winProbability * (potSize + toCall)) - ((1 - winProbability) * toCall);
            return ev;
        }
        if (action === window.GameAction.RAISE) {
            const toCall = this.getPlayerToCall(player);
            const totalBet = toCall + amount;
            const foldEquity = this.getFoldEquity(player, totalBet, potSize);
            const ev = (winProbability * (potSize + totalBet)) - ((1 - winProbability) * totalBet) + foldEquity;
            return ev;
        }
        return 0;
    }

    getOptimalBetSize(player, handStrength, potSize, stackSize) {
        if (handStrength > 0.8) {
            const bet = Math.min(stackSize, potSize);
            return Math.max(this.minRaise, bet);
        } else if (handStrength > 0.5) {
            const bet = Math.floor(potSize * 0.66);
            return Math.max(this.minRaise, bet);
        } else {
            const bet = Math.floor(potSize * 0.33);
            return Math.max(this.minRaise, bet);
        }
    }

    getMDF(potSize, betSize) {
        return betSize / (potSize + betSize);
    }

    getAlpha(betSize, potSize) {
        return betSize / (potSize + betSize);
    }

    getBeta(potSize, callSize) {
        return callSize / (potSize + callSize);
    }

    getBluffToValueRatio(betSize, potSize) {
        const alpha = this.getAlpha(betSize, potSize);
        return alpha / (1 - alpha);
    }

    getMinDefenseFrequency(potSize, betSize) {
        return 1 - this.getAlpha(betSize, potSize);
    }

    isPolarizedBet(betSize, potSize) {
        return betSize > potSize * 0.8;
    }

    isLinearBet(betSize, potSize) {
        return betSize <= potSize * 0.5;
    }

    getBetSizingStrategy(handStrength, boardTexture, stackToPot) {
        if (handStrength > 0.8) {
            if (stackToPot < 1) return 'all_in';
            if (boardTexture === 'wet') return 'large';
            return 'medium';
        } else if (handStrength > 0.5) {
            if (boardTexture === 'dry') return 'small';
            return 'medium';
        } else {
            if (boardTexture === 'dry') return 'small';
            return 'check';
        }
    }

    reset() {
        this.initialize();
    }

    getSummary() {
        return {
            currentBet: this.currentBet,
            lastRaise: this.lastRaise,
            minRaise: this.minRaise,
            bettingRoundComplete: this.bettingRoundComplete,
            actionCount: this.actionHistory.length,
            lastRaiser: this.lastRaiser ? this.lastRaiser.name : null
        };
    }
};

window.BettingController = window.BettingController;

console.log('controller_Betting.js loaded');
