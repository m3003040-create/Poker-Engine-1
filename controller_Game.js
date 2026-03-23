window.GameController = class GameController {
    constructor() {
        this.gameState = null;
        this.deckManager = null;
        this.bettingController = null;
        this.handEvaluator = null;
        this.winnerController = null;
        this.viewGame = null;
        this.viewLog = null;
        this.viewActionButtons = null;
        this.viewPot = null;
        this.viewPlayer = null;
        this.isRunning = false;
        self = this;
        this.currentPromise = null;
        this.phaseTimeout = null;
        this.actionQueue = [];
        this.processingAction = false;
        this.gameLoopInterval = null;
        this.autoProceedDelay = 1000;
    }

    initialize(players, dealerIndex = 0) {
        this.gameState = new window.GameState();
        this.gameState.players = players;
        this.gameState.dealerIndex = dealerIndex;
        this.gameState.updatePositions();
        this.deckManager = new window.DeckManager();
        this.bettingController = new window.BettingController(this.gameState);
        this.handEvaluator = new window.HandEvaluator();
        this.winnerController = new window.WinnerController();
        this.viewGame = new window.ViewGame();
        this.viewLog = new window.ViewLog();
        this.viewActionButtons = new window.ViewActionButtons();
        this.viewPot = new window.ViewPot();
        this.viewPlayer = new window.ViewPlayer();
        this.isRunning = true;
        this.startGameLoop();
        return this;
    }

    startGameLoop() {
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => {
            if (!this.isRunning) return;
            if (this.processingAction) return;
            this.processNextAction();
        }, 100);
    }

    async processNextAction() {
        if (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift();
            await this.executeAction(action);
        } else if (this.gameState && this.gameState.gameActive) {
            await this.checkGameProgress();
        }
    }

    async executeAction(action) {
        this.processingAction = true;
        try {
            switch (action.type) {
                case 'startHand':
                    await this.startNewHand();
                    break;
                case 'dealCards':
                    await this.dealCards();
                    break;
                case 'applyBlinds':
                    await this.applyBlinds();
                    break;
                case 'playerAction':
                    await this.handlePlayerAction(action.playerIndex, action.action, action.amount);
                    break;
                case 'nextPhase':
                    await this.advanceToNextPhase();
                    break;
                case 'showdown':
                    await this.showdown();
                    break;
                case 'endHand':
                    await this.endHand();
                    break;
                default:
                    break;
            }
        } finally {
            this.processingAction = false;
        }
    }

    queueAction(action) {
        this.actionQueue.push(action);
    }

    async startNewHand() {
        if (!this.gameState) return;
        this.viewLog.addMessage('system', 'Начинается новая раздача');
        this.gameState.roundNumber++;
        this.gameState.currentPhase = window.GamePhase.PREFLOP;
        for (let p of this.gameState.players) {
            p.resetForNewHand();
        }
        this.deckManager.initializeDeck();
        this.gameState.deck = this.deckManager.getDeck();
        this.gameState.communityCards = [];
        this.gameState.potManager = new window.PotManager();
        this.gameState.potManager.initialize();
        this.gameState.currentBet = 0;
        this.gameState.lastRaiseAmount = 0;
        this.gameState.lastRaiserIndex = -1;
        this.gameState.bettingComplete = false;
        this.gameState.allInPlayers = [];
        this.gameState.sidePotsCreated = false;
        this.gameState.updatePositions();
        this.viewGame.updateCommunityCards([]);
        this.viewGame.updatePlayerList(this.gameState.players);
        this.viewPot.updatePot(0);
        this.viewLog.addMessage('system', `Дилер: ${this.gameState.players[this.gameState.dealerIndex].name}`);
        await this.dealCards();
        await this.applyBlinds();
        this.gameState.setFirstPlayerForPhase();
        this.viewGame.highlightPlayer(this.gameState.getCurrentPlayer().id);
        await this.startBettingRound();
    }

    async dealCards() {
        this.viewLog.addMessage('system', 'Раздача карт');
        this.gameState.deck = this.deckManager.getDeck();
        for (let i = 0; i < 2; i++) {
            for (let p of this.gameState.players) {
                if (p.chips > 0 && !p.sitOut) {
                    const card = this.gameState.deck.draw();
                    p.receiveCard(card);
                }
            }
        }
        this.viewGame.updatePlayerCards(this.gameState.players);
        await this.delay(window.getAnimationSpeed());
    }

    async applyBlinds() {
        const sb = window.getSmallBlind();
        const bb = window.getBigBlind();
        const sbPlayer = this.gameState.players[this.gameState.smallBlindIndex];
        const bbPlayer = this.gameState.players[this.gameState.bigBlindIndex];
        if (sbPlayer && sbPlayer.chips > 0) {
            const sbAmount = Math.min(sb, sbPlayer.chips);
            this.gameState.potManager.addFromPlayer(sbPlayer, sbAmount);
            this.viewLog.addMessage('player', `${sbPlayer.name} ставит малый блайнд ${sbAmount}`);
            this.viewGame.updatePlayerBet(sbPlayer.id, sbPlayer.currentBet);
        }
        if (bbPlayer && bbPlayer.chips > 0) {
            const bbAmount = Math.min(bb, bbPlayer.chips);
            this.gameState.potManager.addFromPlayer(bbPlayer, bbAmount);
            this.viewLog.addMessage('player', `${bbPlayer.name} ставит большой блайнд ${bbAmount}`);
            this.viewGame.updatePlayerBet(bbPlayer.id, bbPlayer.currentBet);
        }
        this.gameState.currentBet = bb;
        this.viewPot.updatePot(this.gameState.potManager.getTotal());
        if (window.isAnteEnabled()) {
            const ante = window.getAnte();
            for (let p of this.gameState.players) {
                if (p.chips > 0 && !p.sitOut) {
                    const anteAmount = Math.min(ante, p.chips);
                    this.gameState.potManager.addFromPlayer(p, anteAmount);
                    this.viewLog.addMessage('system', `${p.name} ставит анте ${anteAmount}`);
                }
            }
        }
        await this.delay(window.getAnimationSpeed());
    }

    async startBettingRound() {
        if (!this.gameState) return;
        this.gameState.bettingComplete = false;
        this.gameState.currentBet = this.getCurrentMaxBet();
        const activePlayers = this.gameState.players.filter(p => !p.folded && !p.isAllIn() && p.chips > 0);
        if (activePlayers.length === 1) {
            await this.advanceToNextPhase();
            return;
        }
        await this.processBettingRound();
    }

    async processBettingRound() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (!currentPlayer) {
            await this.advanceToNextPhase();
            return;
        }
        if (currentPlayer.folded || currentPlayer.isAllIn() || currentPlayer.chips === 0) {
            if (!this.gameState.advanceToNextPlayer()) {
                await this.advanceToNextPhase();
            } else {
                await this.processBettingRound();
            }
            return;
        }
        if (this.gameState.isBettingRoundComplete()) {
            await this.advanceToNextPhase();
            return;
        }
        const toCall = Math.max(0, this.gameState.currentBet - currentPlayer.currentBet);
        const minRaise = this.gameState.lastRaiseAmount > 0 ? this.gameState.lastRaiseAmount : window.getBigBlind();
        const availableActions = window.getAvailableActions(currentPlayer, this.gameState.currentBet, minRaise, this.gameState.currentPhase);
        if (currentPlayer.isHuman) {
            await this.waitForHumanAction(currentPlayer, availableActions, toCall, minRaise);
        } else {
            await this.processAIAction(currentPlayer, availableActions, toCall, minRaise);
        }
    }

    async waitForHumanAction(player, availableActions, toCall, minRaise) {
        this.viewActionButtons.showButtons(availableActions, this.gameState.currentBet, minRaise, this.gameState.currentPhase);
        this.viewGame.highlightPlayer(player.id, true);
        try {
            const action = await player.requestAction(availableActions, this.gameState.currentBet, minRaise, this.gameState.currentPhase, window.getTimeBank());
            await this.handlePlayerAction(player.id, action.action, action.amount);
        } catch (error) {
            this.viewLog.addMessage('system', `${player.name} не ответил вовремя, автоматический фолд`);
            await this.handlePlayerAction(player.id, window.GameAction.FOLD, 0);
        }
        this.viewActionButtons.hideButtons();
    }

    async processAIAction(player, availableActions, toCall, minRaise) {
        this.viewGame.highlightPlayer(player.id, true);
        await this.delay(player.decisionDelay || 500);
        const potSize = this.gameState.potManager.getTotal();
        const decision = await player.makeDecision(
            this.gameState.communityCards,
            this.gameState.currentBet,
            potSize,
            this.gameState.currentPhase,
            availableActions,
            minRaise,
            this.gameState.players.filter(p => p !== player && !p.folded)
        );
        await this.handlePlayerAction(player.id, decision.action, decision.amount);
    }

    async handlePlayerAction(playerId, action, amount) {
        const player = this.gameState.getPlayerById(playerId);
        if (!player || player.folded) return;
        const toCall = Math.max(0, this.gameState.currentBet - player.currentBet);
        let result = null;
        switch (action) {
            case window.GameAction.FOLD:
                player.fold();
                this.viewLog.addMessage('player', `${player.name} сбрасывает карты`);
                this.viewGame.updatePlayerStatus(player.id, 'folded');
                break;
            case window.GameAction.CHECK:
                this.viewLog.addMessage('player', `${player.name} чекает`);
                break;
            case window.GameAction.CALL:
                const callAmount = Math.min(toCall, player.chips);
                this.gameState.potManager.addFromPlayer(player, callAmount);
                this.viewLog.addMessage('player', `${player.name} коллирует ${callAmount}`);
                this.viewGame.updatePlayerBet(player.id, player.currentBet);
                if (player.chips === 0) this.gameState.allInPlayers.push(player);
                break;
            case window.GameAction.RAISE:
                const raiseAmount = Math.min(amount, player.chips);
                const newBet = player.currentBet + raiseAmount;
                this.gameState.potManager.addFromPlayer(player, raiseAmount);
                this.gameState.currentBet = newBet;
                this.gameState.lastRaiseAmount = raiseAmount;
                this.gameState.lastRaiserIndex = player.id;
                this.viewLog.addMessage('player', `${player.name} рейзит до ${newBet}`);
                this.viewGame.updatePlayerBet(player.id, player.currentBet);
                break;
            case window.GameAction.ALL_IN:
                const allInAmount = player.chips;
                this.gameState.potManager.addFromPlayer(player, allInAmount);
                this.gameState.allInPlayers.push(player);
                if (player.currentBet > this.gameState.currentBet) {
                    this.gameState.currentBet = player.currentBet;
                    this.gameState.lastRaiseAmount = allInAmount;
                    this.gameState.lastRaiserIndex = player.id;
                }
                this.viewLog.addMessage('player', `${player.name} идёт ва-банк (${allInAmount})`);
                this.viewGame.updatePlayerBet(player.id, player.currentBet);
                break;
        }
        this.gameState.recordAction(player, action, amount);
        this.viewPot.updatePot(this.gameState.potManager.getTotal());
        this.viewGame.updatePlayerChips(player.id, player.chips);
        if (!this.gameState.advanceToNextPlayer()) {
            await this.advanceToNextPhase();
        } else {
            await this.processBettingRound();
        }
    }

    getCurrentMaxBet() {
        let max = 0;
        for (let p of this.gameState.players) {
            if (!p.folded && p.currentBet > max) max = p.currentBet;
        }
        return max;
    }

    async advanceToNextPhase() {
        if (this.gameState.currentPhase === window.GamePhase.SHOWDOWN) {
            await this.showdown();
            return;
        }
        if (this.gameState.getActivePlayersCount() === 1) {
            await this.endHandEarly();
            return;
        }
        const nextPhase = window.getNextPhase(this.gameState.currentPhase);
        if (!nextPhase) {
            await this.showdown();
            return;
        }
        this.gameState.currentPhase = nextPhase;
        this.viewGame.updatePhase(nextPhase);
        this.viewLog.addMessage('system', window.getPhaseStartMessage(nextPhase));
        if (window.doesPhaseDealCommunityCards(nextPhase)) {
            const toDeal = window.getCommunityCardsToDeal(nextPhase);
            const cards = this.gameState.deck.drawMultiple(toDeal);
            this.gameState.communityCards.push(...cards);
            this.viewGame.updateCommunityCards(this.gameState.communityCards);
            this.viewLog.addMessage('system', `Общие карты: ${cards.map(c => c.toString()).join(', ')}`);
            await this.delay(window.getAnimationSpeed());
        }
        for (let p of this.gameState.players) {
            p.resetBet();
        }
        this.gameState.currentBet = 0;
        this.gameState.lastRaiseAmount = 0;
        this.gameState.bettingComplete = false;
        this.gameState.setFirstPlayerForPhase();
        this.viewGame.highlightPlayer(this.gameState.getCurrentPlayer().id);
        await this.startBettingRound();
    }

    async showdown() {
        this.viewLog.addMessage('system', 'Шоудаун! Определение победителя');
        this.gameState.updatePot();
        const winners = this.winnerController.determineWinners(this.gameState);
        for (let winner of winners) {
            this.viewLog.addMessage('winner', `${winner.name} выигрывает!`);
            this.viewGame.highlightWinner(winner.id);
        }
        await this.delay(window.getShowDownDelay());
        await this.endHand();
    }

    async endHandEarly() {
        const activePlayers = this.gameState.players.filter(p => !p.folded && p.chips > 0);
        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            const pot = this.gameState.potManager.getTotal();
            winner.addWinnings(pot);
            this.viewLog.addMessage('winner', `${winner.name} выигрывает банк ${pot} (все остальные сбросили)`);
            this.viewGame.highlightWinner(winner.id);
            await this.delay(window.getShowDownDelay());
        }
        await this.endHand();
    }

    async endHand() {
        this.viewLog.addMessage('system', 'Раздача окончена');
        this.gameState.gameActive = this.gameState.getPlayersWithChips().length >= 2;
        if (this.gameState.gameActive) {
            this.gameState.rotateDealer();
            this.viewGame.updateDealerButton(this.gameState.dealerIndex);
            await this.delay(2000);
            await this.startNewHand();
        } else {
            this.viewLog.addMessage('system', 'Игра окончена!');
            this.isRunning = false;
            if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
            this.viewGame.showGameOver();
        }
    }

    async checkGameProgress() {
        if (!this.gameState) return;
        if (this.gameState.getActivePlayersCount() === 1 && this.gameState.currentPhase !== window.GamePhase.SHOWDOWN) {
            await this.endHandEarly();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async resetGame() {
        this.isRunning = false;
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
        this.actionQueue = [];
        this.processingAction = false;
        this.gameState = null;
        await this.delay(100);
        const config = window.getGameConfig();
        const players = [];
        players.push(new window.HumanPlayer(0, 'Вы', config.startChips));
        const aiStyles = [window.AI_STYLES.TIGHT, window.AI_STYLES.AGGRESSIVE, window.AI_STYLES.RANDOM, window.AI_STYLES.ADAPTIVE, window.AI_STYLES.LAG];
        for (let i = 1; i < config.playerCount; i++) {
            const style = aiStyles[(i-1) % aiStyles.length];
            players.push(new window.AIPlayer(i, `AI ${i} (${window.AI_STYLE_NAMES[style]})`, config.startChips, style));
        }
        this.initialize(players, 0);
        this.queueAction({ type: 'startHand' });
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
    }
};

window.GameController = window.GameController;
window.gameController = null;

console.log('controller_Game.js loaded');
