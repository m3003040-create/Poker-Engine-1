window.Player = class Player {
    constructor(id, name, chips, isHuman = false) {
        this.id = id;
        this.name = name;
        this.chips = chips;
        this.startChips = chips;
        this.hand = [];
        this.folded = false;
        this.isActive = true;
        this.currentBet = 0;
        this.totalBetThisRound = 0;
        this.position = null;
        this.isDealer = false;
        this.isSmallBlind = false;
        this.isBigBlind = false;
        this.rebuysUsed = 0;
        this.handsPlayed = 0;
        this.handsWon = 0;
        this.totalWinnings = 0;
        this.lastAction = null;
        this.lastActionAmount = 0;
        this.actionHistory = [];
        this.isHuman = isHuman;
        this.isAI = !isHuman;
        this.aiStyle = null;
        this.aiConfig = null;
        this.opponentStats = {};
        this.experience = { hands: 0, wins: 0, losses: 0, winnings: 0 };
        this.timeBank = 30;
        this.disconnected = false;
        this.sitOut = false;
    }

    resetForNewHand() {
        this.hand = [];
        this.folded = false;
        this.isActive = true;
        this.currentBet = 0;
        this.totalBetThisRound = 0;
        this.lastAction = null;
        this.lastActionAmount = 0;
        this.isDealer = false;
        this.isSmallBlind = false;
        this.isBigBlind = false;
        if (this.chips === 0 && !this.sitOut) {
            this.isActive = false;
        }
    }

    receiveCard(card) {
        this.hand.push(card);
    }

    receiveCards(cards) {
        this.hand.push(...cards);
    }

    clearHand() {
        this.hand = [];
    }

    getHand() {
        return [...this.hand];
    }

    getHandString() {
        return this.hand.map(c => c.toString()).join(' ');
    }

    getHandHtml(faceDown = false) {
        if (this.isHuman && !faceDown) {
            return this.hand.map(c => c.getHtml(false)).join('');
        }
        if (faceDown) {
            return this.hand.map(() => `<div class="card card-back" style="background: ${window.getCardBackStyle()};"></div>`).join('');
        }
        return this.hand.map(c => c.getHtml(false)).join('');
    }

    bet(amount) {
        if (amount > this.chips) amount = this.chips;
        this.chips -= amount;
        this.currentBet += amount;
        this.totalBetThisRound += amount;
        return amount;
    }

    check() {
        return 0;
    }

    call(toCall) {
        const callAmount = Math.min(toCall, this.chips);
        return this.bet(callAmount);
    }

    raise(amount, currentBet) {
        const totalBet = this.currentBet + amount;
        if (totalBet > this.chips + this.currentBet) return false;
        return this.bet(amount);
    }

    fold() {
        this.folded = true;
        this.isActive = false;
    }

    allIn() {
        const allInAmount = this.chips;
        this.bet(allInAmount);
        return allInAmount;
    }

    isAllIn() {
        return this.chips === 0 && !this.folded;
    }

    canAct() {
        return !this.folded && this.isActive && this.chips > 0;
    }

    getTotalChips() {
        return this.chips + this.currentBet;
    }

    getStack() {
        return this.chips;
    }

    getEffectiveStack(currentBet) {
        return this.chips + this.currentBet - currentBet;
    }

    getCurrentBet() {
        return this.currentBet;
    }

    resetBet() {
        this.currentBet = 0;
        this.totalBetThisRound = 0;
    }

    addWinnings(amount) {
        this.chips += amount;
        this.totalWinnings += amount;
        this.handsWon++;
    }

    recordAction(action, amount, phase) {
        this.lastAction = action;
        this.lastActionAmount = amount;
        this.actionHistory.push({
            action,
            amount,
            phase,
            timestamp: Date.now(),
            chips: this.chips,
            currentBet: this.currentBet
        });
        if (this.actionHistory.length > 100) this.actionHistory.shift();
    }

    getLastActions(count = 5) {
        return this.actionHistory.slice(-count);
    }

    getVpip() {
        if (this.handsPlayed === 0) return 0;
        const vpipHands = this.actionHistory.filter(a => a.action !== window.GameAction.FOLD && a.phase === window.GamePhase.PREFLOP).length;
        return vpipHands / this.handsPlayed;
    }

    getPfr() {
        if (this.handsPlayed === 0) return 0;
        const pfrHands = this.actionHistory.filter(a => (a.action === window.GameAction.RAISE || a.action === window.GameAction.ALL_IN) && a.phase === window.GamePhase.PREFLOP).length;
        return pfrHands / this.handsPlayed;
    }

    getAggressionFactor() {
        const raises = this.actionHistory.filter(a => a.action === window.GameAction.RAISE || a.action === window.GameAction.ALL_IN).length;
        const calls = this.actionHistory.filter(a => a.action === window.GameAction.CALL).length;
        if (calls === 0) return raises > 0 ? 10 : 0;
        return raises / calls;
    }

    getWinRate() {
        if (this.handsPlayed === 0) return 0;
        return this.handsWon / this.handsPlayed;
    }

    getRoi() {
        if (this.startChips === 0) return 0;
        return ((this.chips + this.totalWinnings) - this.startChips) / this.startChips;
    }

    updateOpponentStats(opponentId, action, result) {
        if (!this.opponentStats[opponentId]) {
            this.opponentStats[opponentId] = {
                handsSeen: 0,
                folds: 0,
                calls: 0,
                raises: 0,
                allIns: 0,
                wins: 0,
                losses: 0
            };
        }
        const stats = this.opponentStats[opponentId];
        stats.handsSeen++;
        if (action === window.GameAction.FOLD) stats.folds++;
        else if (action === window.GameAction.CALL) stats.calls++;
        else if (action === window.GameAction.RAISE) stats.raises++;
        else if (action === window.GameAction.ALL_IN) stats.allIns++;
        if (result === 'win') stats.wins++;
        else if (result === 'loss') stats.losses++;
    }

    getOpponentFoldVsCbet(opponentId) {
        const stats = this.opponentStats[opponentId];
        if (!stats || stats.handsSeen === 0) return 0.5;
        return stats.folds / stats.handsSeen;
    }

    isSittingOut() {
        return this.sitOut;
    }

    setSitOut(sitOut) {
        this.sitOut = sitOut;
        if (sitOut) this.isActive = false;
        else if (this.chips > 0) this.isActive = true;
    }

    disconnect() {
        this.disconnected = true;
        this.isActive = false;
    }

    reconnect() {
        this.disconnected = false;
        if (this.chips > 0 && !this.sitOut) this.isActive = true;
    }

    getStatus() {
        if (this.folded) return 'folded';
        if (this.isAllIn()) return 'all-in';
        if (this.sitOut) return 'sit-out';
        if (this.disconnected) return 'disconnected';
        return 'active';
    }

    getPositionName() {
        const names = {
            dealer: 'Dealer',
            smallBlind: 'SB',
            bigBlind: 'BB',
            early: 'EP',
            middle: 'MP',
            late: 'LP',
            cutoff: 'CO',
            button: 'BTN'
        };
        return names[this.position] || 'Unknown';
    }

    setPosition(pos, isDealer = false, isSmall = false, isBig = false) {
        this.position = pos;
        this.isDealer = isDealer;
        this.isSmallBlind = isSmall;
        this.isBigBlind = isBig;
    }

    hasCards() {
        return this.hand.length > 0;
    }

    getHandRank(communityCards) {
        const allCards = [...this.hand, ...communityCards];
        return window.getBestHandFromCards(allCards);
    }

    getHandStrength(communityCards) {
        const handRank = this.getHandRank(communityCards);
        if (!handRank) return 0;
        return handRank.rank / 10;
    }

    canRebuy() {
        return window.canRebuy(this);
    }

    performRebuy() {
        return window.performRebuy(this);
    }

    getRebuysLeft() {
        const config = window.getGameConfig();
        return config.maxRebuys - this.rebuysUsed;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            chips: this.chips,
            startChips: this.startChips,
            hand: this.hand.map(c => ({ rank: c.rank, suit: c.suit })),
            folded: this.folded,
            isActive: this.isActive,
            currentBet: this.currentBet,
            totalBetThisRound: this.totalBetThisRound,
            position: this.position,
            isDealer: this.isDealer,
            isSmallBlind: this.isSmallBlind,
            isBigBlind: this.isBigBlind,
            rebuysUsed: this.rebuysUsed,
            handsPlayed: this.handsPlayed,
            handsWon: this.handsWon,
            totalWinnings: this.totalWinnings,
            isHuman: this.isHuman,
            aiStyle: this.aiStyle,
            sitOut: this.sitOut,
            disconnected: this.disconnected
        };
    }

    static fromJSON(data) {
        const player = new window.Player(data.id, data.name, data.chips, data.isHuman);
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
        player.aiStyle = data.aiStyle;
        player.sitOut = data.sitOut;
        player.disconnected = data.disconnected;
        return player;
    }

    static sortByChips(players, descending = true) {
        return [...players].sort((a, b) => descending ? b.chips - a.chips : a.chips - b.chips);
    }

    static sortByPosition(players, order = ['dealer', 'smallBlind', 'bigBlind', 'early', 'middle', 'late']) {
        const posIndex = {};
        order.forEach((pos, idx) => posIndex[pos] = idx);
        return [...players].sort((a, b) => (posIndex[a.position] || 999) - (posIndex[b.position] || 999));
    }

    static getActivePlayers(players) {
        return players.filter(p => p.isActive && !p.folded && p.chips > 0);
    }

    static getPlayersInHand(players) {
        return players.filter(p => !p.folded && p.isActive);
    }

    static getTotalChipsInPlay(players) {
        return players.reduce((sum, p) => sum + p.chips + p.currentBet, 0);
    }

    static getAverageStack(players) {
        const active = window.Player.getActivePlayers(players);
        if (active.length === 0) return 0;
        return active.reduce((sum, p) => sum + p.chips, 0) / active.length;
    }

    static getShortestStack(players) {
        const active = window.Player.getActivePlayers(players);
        if (active.length === 0) return null;
        return active.reduce((min, p) => p.chips < min.chips ? p : min, active[0]);
    }

    static getBiggestStack(players) {
        const active = window.Player.getActivePlayers(players);
        if (active.length === 0) return null;
        return active.reduce((max, p) => p.chips > max.chips ? p : max, active[0]);
    }

    static resetAllForNewHand(players) {
        for (let p of players) {
            p.resetForNewHand();
        }
    }

    static updatePositions(players, dealerIndex) {
        const count = players.length;
        for (let i = 0; i < count; i++) {
            const p = players[i];
            p.isDealer = (i === dealerIndex);
            p.isSmallBlind = (i === (dealerIndex + 1) % count);
            p.isBigBlind = (i === (dealerIndex + 2) % count);
            if (p.isDealer) p.position = 'dealer';
            else if (p.isSmallBlind) p.position = 'smallBlind';
            else if (p.isBigBlind) p.position = 'bigBlind';
            else if (i === (dealerIndex + 3) % count) p.position = 'early';
            else if (i === (dealerIndex + count - 2) % count) p.position = 'cutoff';
            else if (i === (dealerIndex + count - 1) % count) p.position = 'button';
            else p.position = 'middle';
        }
    }

    static getNextPlayerToAct(players, currentIndex, lastRaiserIndex, isPreflop) {
        let idx = (currentIndex + 1) % players.length;
        while (players[idx].folded || players[idx].isAllIn() || players[idx].sitOut) {
            if (idx === currentIndex) return null;
            idx = (idx + 1) % players.length;
        }
        return idx;
    }

    static areAllPlayersActed(players, currentBet, lastRaiserIndex) {
        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (p.folded) continue;
            if (p.isAllIn()) continue;
            if (p.currentBet !== currentBet) return false;
        }
        return true;
    }

    static getPlayersWhoCanStillAct(players) {
        return players.filter(p => !p.folded && !p.isAllIn() && p.isActive);
    }
};

window.createPlayer = function(id, name, chips, isHuman = false) {
    return new window.Player(id, name, chips, isHuman);
};

window.Player = window.Player;
window.createPlayer = window.createPlayer;

console.log('model_Player.js loaded');
