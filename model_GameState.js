window.GameState = class GameState {
    constructor() {
        this.players = [];
        this.deck = null;
        this.communityCards = [];
        this.currentPhase = window.GamePhase.PREFLOP;
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.smallBlindIndex = 0;
        this.bigBlindIndex = 0;
        this.currentBet = 0;
        this.lastRaiseAmount = 0;
        this.lastRaiserIndex = -1;
        this.potManager = null;
        this.bettingComplete = false;
        this.handHistory = [];
        this.roundNumber = 0;
        this.gameActive = true;
        this.winners = [];
        this.allInPlayers = [];
        this.sidePotsCreated = false;
        this.actionLog = [];
        this.startTime = Date.now();
        this.blindLevelTimer = null;
        this.blindLevelStartTime = 0;
        this.timeBankRemaining = {};
        this.playerTimeouts = {};
    }

    initialize(players, dealerIndex) {
        this.players = players;
        this.dealerIndex = dealerIndex;
        this.updatePositions();
        this.potManager = new window.PotManager();
        this.potManager.initialize();
        this.currentBet = 0;
        this.lastRaiseAmount = 0;
        this.lastRaiserIndex = -1;
        this.bettingComplete = false;
        this.communityCards = [];
        this.currentPhase = window.GamePhase.PREFLOP;
        this.roundNumber++;
        this.actionLog = [];
        this.winners = [];
        this.allInPlayers = [];
        this.sidePotsCreated = false;
        for (let p of players) {
            p.resetForNewHand();
            this.timeBankRemaining[p.id] = window.getTimeBank();
        }
    }

    updatePositions() {
        const count = this.players.length;
        for (let i = 0; i < count; i++) {
            const p = this.players[i];
            p.isDealer = (i === this.dealerIndex);
            p.isSmallBlind = (i === (this.dealerIndex + 1) % count);
            p.isBigBlind = (i === (this.dealerIndex + 2) % count);
            if (p.isDealer) p.position = 'dealer';
            else if (p.isSmallBlind) p.position = 'smallBlind';
            else if (p.isBigBlind) p.position = 'bigBlind';
            else if (i === (this.dealerIndex + 3) % count) p.position = 'early';
            else if (i === (this.dealerIndex + count - 2) % count) p.position = 'cutoff';
            else if (i === (this.dealerIndex + count - 1) % count) p.position = 'button';
            else p.position = 'middle';
        }
        this.smallBlindIndex = (this.dealerIndex + 1) % count;
        this.bigBlindIndex = (this.dealerIndex + 2) % count;
    }

    getNextPlayerIndex(startIndex = null, skipFolded = true, skipAllIn = true, skipSitOut = true) {
        let idx = (startIndex !== null) ? startIndex : this.currentPlayerIndex;
        if (idx === -1) idx = 0;
        const start = idx;
        do {
            idx = (idx + 1) % this.players.length;
            const p = this.players[idx];
            if (!p) continue;
            if (skipFolded && p.folded) continue;
            if (skipAllIn && p.isAllIn()) continue;
            if (skipSitOut && p.sitOut) continue;
            return idx;
        } while (idx !== start);
        return -1;
    }

    getFirstActivePlayerAfterButton() {
        let idx = (this.dealerIndex + 1) % this.players.length;
        while (true) {
            const p = this.players[idx];
            if (!p.folded && !p.isAllIn() && !p.sitOut) return idx;
            idx = (idx + 1) % this.players.length;
            if (idx === this.dealerIndex) break;
        }
        return -1;
    }

    isBettingRoundComplete() {
        const active = this.players.filter(p => !p.folded && !p.isAllIn() && !p.sitOut);
        if (active.length === 0) return true;
        for (let p of active) {
            if (p.currentBet !== this.currentBet) return false;
        }
        return true;
    }

    advanceToNextPlayer() {
        const next = this.getNextPlayerIndex(this.currentPlayerIndex);
        if (next !== -1) {
            this.currentPlayerIndex = next;
            return true;
        }
        return false;
    }

    setCurrentPlayer(index) {
        if (index >= 0 && index < this.players.length) {
            this.currentPlayerIndex = index;
            return true;
        }
        return false;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getActivePlayersCount() {
        return this.players.filter(p => !p.folded && !p.sitOut).length;
    }

    getPlayersInHand() {
        return this.players.filter(p => !p.folded && p.isActive);
    }

    getPlayersWithChips() {
        return this.players.filter(p => p.chips > 0);
    }

    isHeadsUp() {
        return this.getActivePlayersCount() === 2;
    }

    canProceedToNextPhase() {
        if (this.currentPhase === window.GamePhase.SHOWDOWN) return true;
        const activePlayers = this.getActivePlayersCount();
        if (activePlayers === 1) return true;
        if (this.allInPlayers.length === this.players.filter(p => !p.folded).length) return true;
        return this.isBettingRoundComplete();
    }

    proceedToNextPhase() {
        if (!this.canProceedToNextPhase()) return false;
        const nextPhase = window.getNextPhase(this.currentPhase);
        if (!nextPhase) return false;
        this.currentPhase = nextPhase;
        this.bettingComplete = false;
        this.currentBet = 0;
        this.lastRaiseAmount = 0;
        for (let p of this.players) {
            p.resetBet();
        }
        if (this.currentPhase === window.GamePhase.SHOWDOWN) {
            this.determineWinners();
        } else {
            this.setFirstPlayerForPhase();
        }
        return true;
    }

    setFirstPlayerForPhase() {
        if (this.currentPhase === window.GamePhase.PREFLOP) {
            let first = (this.bigBlindIndex + 1) % this.players.length;
            while (this.players[first].folded || this.players[first].isAllIn() || this.players[first].sitOut) {
                first = (first + 1) % this.players.length;
                if (first === this.bigBlindIndex) break;
            }
            this.currentPlayerIndex = first;
        } else {
            let first = (this.dealerIndex + 1) % this.players.length;
            while (this.players[first].folded || this.players[first].isAllIn() || this.players[first].sitOut) {
                first = (first + 1) % this.players.length;
                if (first === this.dealerIndex) break;
            }
            this.currentPlayerIndex = first;
        }
        if (this.currentPlayerIndex === -1) this.currentPlayerIndex = 0;
    }

    applyBlinds() {
        const sb = window.getSmallBlind();
        const bb = window.getBigBlind();
        const sbPlayer = this.players[this.smallBlindIndex];
        const bbPlayer = this.players[this.bigBlindIndex];
        if (sbPlayer) {
            const sbAmount = Math.min(sb, sbPlayer.chips);
            this.potManager.addFromPlayer(sbPlayer, sbAmount);
            sbPlayer.currentBet = sbAmount;
            this.currentBet = sbAmount;
        }
        if (bbPlayer) {
            const bbAmount = Math.min(bb, bbPlayer.chips);
            this.potManager.addFromPlayer(bbPlayer, bbAmount);
            bbPlayer.currentBet = bbAmount;
            this.currentBet = bbAmount;
        }
        if (window.isAnteEnabled()) {
            const ante = window.getAnte();
            for (let p of this.players) {
                if (p.chips > 0) {
                    const anteAmount = Math.min(ante, p.chips);
                    this.potManager.addFromPlayer(p, anteAmount);
                }
            }
        }
    }

    dealCards() {
        if (!this.deck) this.deck = new window.Deck();
        else this.deck.resetAndShuffle();
        for (let p of this.players) {
            p.clearHand();
            p.receiveCards(this.deck.drawMultiple(2));
        }
    }

    dealCommunityCards() {
        const toDeal = window.getCommunityCardsToDeal(this.currentPhase);
        if (toDeal === 0) return;
        const cards = this.deck.drawMultiple(toDeal);
        this.communityCards.push(...cards);
    }

    addCommunityCard(card) {
        this.communityCards.push(card);
    }

    getCommunityCards() {
        return [...this.communityCards];
    }

    getCommunityCardsCount() {
        return this.communityCards.length;
    }

    getPot() {
        return this.potManager ? this.potManager.getTotal() : 0;
    }

    getPotManager() {
        return this.potManager;
    }

    updatePot() {
        if (!this.potManager) return;
        this.potManager.createSidePotsFromPlayers(this.players);
    }

    recordAction(player, action, amount) {
        const entry = {
            playerId: player.id,
            playerName: player.name,
            action: action,
            amount: amount,
            phase: this.currentPhase,
            timestamp: Date.now(),
            chips: player.chips,
            currentBet: player.currentBet,
            round: this.roundNumber
        };
        this.actionLog.push(entry);
        player.recordAction(action, amount, this.currentPhase);
        if (action === window.GameAction.RAISE || action === window.GameAction.ALL_IN) {
            this.lastRaiseAmount = amount;
            this.lastRaiserIndex = player.id;
            this.currentBet = player.currentBet;
        } else if (action === window.GameAction.CALL) {
            this.currentBet = player.currentBet;
        }
        if (player.isAllIn() && !this.allInPlayers.includes(player)) {
            this.allInPlayers.push(player);
        }
    }

    determineWinners() {
        this.updatePot();
        const pots = this.potManager.getAllPots();
        const winnersByPot = [];
        for (let pot of pots) {
            const eligible = pot.getEligiblePlayers();
            if (eligible.length === 0) {
                winnersByPot.push([]);
                continue;
            }
            if (eligible.length === 1) {
                winnersByPot.push(eligible);
                continue;
            }
            const evaluated = [];
            for (let player of eligible) {
                const allCards = [...player.hand, ...this.communityCards];
                const evaluation = window.getBestHandFromCards(allCards);
                evaluated.push({ player, evaluation });
            }
            evaluated.sort((a,b) => {
                if (!a.evaluation) return 1;
                if (!b.evaluation) return -1;
                return b.evaluation.compareTo(a.evaluation);
            });
            const bestEval = evaluated[0].evaluation;
            const winners = evaluated.filter(e => e.evaluation && e.evaluation.compareTo(bestEval) === 0).map(e => e.player);
            winnersByPot.push(winners);
        }
        this.winners = [];
        for (let i = 0; i < pots.length; i++) {
            const winners = winnersByPot[i];
            const pot = pots[i];
            if (winners.length === 0) continue;
            const share = Math.floor(pot.amount / winners.length);
            const remainder = pot.amount % winners.length;
            for (let j = 0; j < winners.length; j++) {
                const add = share + (j < remainder ? 1 : 0);
                winners[j].addWinnings(add);
                if (!this.winners.includes(winners[j])) this.winners.push(winners[j]);
            }
        }
        return this.winners;
    }

    getWinnerNames() {
        return this.winners.map(w => w.name);
    }

    getWinners() {
        return [...this.winners];
    }

    isGameOver() {
        const active = this.players.filter(p => p.chips > 0).length;
        return active < 2;
    }

    getGameSummary() {
        return {
            round: this.roundNumber,
            phase: this.currentPhase,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                chips: p.chips,
                folded: p.folded,
                currentBet: p.currentBet,
                hand: p.hand.map(c => c.toString())
            })),
            communityCards: this.communityCards.map(c => c.toString()),
            pot: this.getPot(),
            currentBet: this.currentBet,
            currentPlayer: this.getCurrentPlayer()?.id,
            dealerIndex: this.dealerIndex
        };
    }

    reset() {
        this.players = [];
        this.deck = null;
        this.communityCards = [];
        this.currentPhase = window.GamePhase.PREFLOP;
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.currentBet = 0;
        this.lastRaiseAmount = 0;
        this.lastRaiserIndex = -1;
        this.potManager = null;
        this.bettingComplete = false;
        this.handHistory = [];
        this.roundNumber = 0;
        this.gameActive = true;
        this.winners = [];
        this.allInPlayers = [];
        this.sidePotsCreated = false;
        this.actionLog = [];
        this.startTime = Date.now();
        this.blindLevelTimer = null;
        this.blindLevelStartTime = 0;
        this.timeBankRemaining = {};
        this.playerTimeouts = {};
    }

    setDealer(dealerIndex) {
        this.dealerIndex = dealerIndex;
        this.updatePositions();
    }

    rotateDealer() {
        let next = (this.dealerIndex + 1) % this.players.length;
        while (this.players[next].chips === 0 || this.players[next].sitOut) {
            next = (next + 1) % this.players.length;
            if (next === this.dealerIndex) break;
        }
        this.dealerIndex = next;
        this.updatePositions();
    }

    getPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    getPlayerIndexById(playerId) {
        return this.players.findIndex(p => p.id === playerId);
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(playerId) {
        const idx = this.getPlayerIndexById(playerId);
        if (idx !== -1) this.players.splice(idx, 1);
    }

    getPlayersOrderedByPosition() {
        const order = [];
        const start = this.dealerIndex;
        for (let i = 0; i < this.players.length; i++) {
            const idx = (start + i) % this.players.length;
            order.push(this.players[idx]);
        }
        return order;
    }

    getPlayersInBettingOrder() {
        if (this.currentPhase === window.GamePhase.PREFLOP) {
            let start = (this.bigBlindIndex + 1) % this.players.length;
            const order = [];
            for (let i = 0; i < this.players.length; i++) {
                const idx = (start + i) % this.players.length;
                if (!this.players[idx].folded && !this.players[idx].isAllIn()) order.push(this.players[idx]);
            }
            return order;
        } else {
            let start = (this.dealerIndex + 1) % this.players.length;
            const order = [];
            for (let i = 0; i < this.players.length; i++) {
                const idx = (start + i) % this.players.length;
                if (!this.players[idx].folded && !this.players[idx].isAllIn()) order.push(this.players[idx]);
            }
            return order;
        }
    }

    toJSON() {
        return {
            players: this.players.map(p => p.toJSON()),
            communityCards: this.communityCards.map(c => ({ rank: c.rank, suit: c.suit })),
            currentPhase: this.currentPhase,
            currentPlayerIndex: this.currentPlayerIndex,
            dealerIndex: this.dealerIndex,
            smallBlindIndex: this.smallBlindIndex,
            bigBlindIndex: this.bigBlindIndex,
            currentBet: this.currentBet,
            lastRaiseAmount: this.lastRaiseAmount,
            lastRaiserIndex: this.lastRaiserIndex,
            roundNumber: this.roundNumber,
            gameActive: this.gameActive,
            actionLog: this.actionLog,
            allInPlayers: this.allInPlayers.map(p => p.id),
            winners: this.winners.map(p => p.id)
        };
    }

    static fromJSON(data, playersMap) {
        const state = new window.GameState();
        state.players = data.players.map(pData => {
            if (pData.isHuman) return window.HumanPlayer.fromJSON(pData);
            else return window.AIPlayer.fromJSON(pData);
        });
        state.communityCards = data.communityCards.map(c => new window.Card(c.rank, c.suit));
        state.currentPhase = data.currentPhase;
        state.currentPlayerIndex = data.currentPlayerIndex;
        state.dealerIndex = data.dealerIndex;
        state.smallBlindIndex = data.smallBlindIndex;
        state.bigBlindIndex = data.bigBlindIndex;
        state.currentBet = data.currentBet;
        state.lastRaiseAmount = data.lastRaiseAmount;
        state.lastRaiserIndex = data.lastRaiserIndex;
        state.roundNumber = data.roundNumber;
        state.gameActive = data.gameActive;
        state.actionLog = data.actionLog;
        state.allInPlayers = data.allInPlayers.map(id => state.getPlayerById(id)).filter(p => p);
        state.winners = data.winners.map(id => state.getPlayerById(id)).filter(p => p);
        state.potManager = new window.PotManager();
        state.potManager.initialize();
        return state;
    }

    clone() {
        const cloneState = new window.GameState();
        cloneState.players = this.players.map(p => p.clone ? p.clone() : p);
        cloneState.communityCards = this.communityCards.map(c => c.clone());
        cloneState.currentPhase = this.currentPhase;
        cloneState.currentPlayerIndex = this.currentPlayerIndex;
        cloneState.dealerIndex = this.dealerIndex;
        cloneState.smallBlindIndex = this.smallBlindIndex;
        cloneState.bigBlindIndex = this.bigBlindIndex;
        cloneState.currentBet = this.currentBet;
        cloneState.lastRaiseAmount = this.lastRaiseAmount;
        cloneState.lastRaiserIndex = this.lastRaiserIndex;
        cloneState.roundNumber = this.roundNumber;
        cloneState.gameActive = this.gameActive;
        cloneState.actionLog = [...this.actionLog];
        cloneState.allInPlayers = [...this.allInPlayers];
        cloneState.winners = [...this.winners];
        cloneState.potManager = this.potManager ? this.potManager.clone() : null;
        return cloneState;
    }
};

window.GameState = window.GameState;

console.log('model_GameState.js loaded');
