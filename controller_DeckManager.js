window.DeckManager = class DeckManager {
    constructor() {
        this.deck = null;
        this.discardPile = [];
        this.burnPile = [];
        this.initialDeck = [];
        this.shuffleCount = 3;
        this.autoRebuild = true;
    }

    initializeDeck() {
        this.deck = new window.Deck();
        this.discardPile = [];
        this.burnPile = [];
        this.initialDeck = this.deck.getCards().map(c => c.clone());
        return this.deck;
    }

    resetDeck() {
        if (this.deck) {
            this.deck.reset();
            this.discardPile = [];
            this.burnPile = [];
            this.initialDeck = this.deck.getCards().map(c => c.clone());
        } else {
            this.initializeDeck();
        }
        return this.deck;
    }

    shuffle() {
        if (this.deck) {
            for (let i = 0; i < this.shuffleCount; i++) {
                this.deck.shuffle();
            }
        }
        return this.deck;
    }

    setShuffleCount(count) {
        this.shuffleCount = Math.max(1, Math.min(10, count));
    }

    drawCard() {
        if (!this.deck) return null;
        if (this.deck.isEmpty() && this.autoRebuild) {
            this.rebuildFromDiscard();
        }
        return this.deck.draw();
    }

    drawCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (!card) break;
            cards.push(card);
        }
        return cards;
    }

    burnCard() {
        const card = this.drawCard();
        if (card) {
            this.burnPile.push(card);
        }
        return card;
    }

    burnCards(count) {
        const burned = [];
        for (let i = 0; i < count; i++) {
            const card = this.burnCard();
            if (card) burned.push(card);
            else break;
        }
        return burned;
    }

    discardCard(card) {
        if (card) {
            this.discardPile.push(card);
            return true;
        }
        return false;
    }

    discardCards(cards) {
        for (let card of cards) {
            this.discardCard(card);
        }
        return cards.length;
    }

    rebuildFromDiscard() {
        if (this.discardPile.length === 0) return false;
        this.deck.addCards(this.discardPile);
        this.discardPile = [];
        this.deck.shuffle();
        return true;
    }

    rebuildFromBurn() {
        if (this.burnPile.length === 0) return false;
        this.deck.addCards(this.burnPile);
        this.burnPile = [];
        this.deck.shuffle();
        return true;
    }

    rebuildAll() {
        this.rebuildFromDiscard();
        this.rebuildFromBurn();
        return this.deck;
    }

    getDeck() {
        return this.deck;
    }

    getDiscardPile() {
        return [...this.discardPile];
    }

    getBurnPile() {
        return [...this.burnPile];
    }

    getRemainingCount() {
        return this.deck ? this.deck.size() : 0;
    }

    getDiscardCount() {
        return this.discardPile.length;
    }

    getBurnCount() {
        return this.burnPile.length;
    }

    getTotalUsedCount() {
        return this.discardPile.length + this.burnPile.length;
    }

    isDeckEmpty() {
        return this.deck ? this.deck.isEmpty() : true;
    }

    peekTopCard() {
        return this.deck ? this.deck.peekTop() : null;
    }

    peekBottomCard() {
        return this.deck ? this.deck.peekBottom() : null;
    }

    cutDeck(percent = 0.5) {
        if (this.deck) this.deck.cut(percent);
    }

    splitDeck(percent = 0.5) {
        return this.deck ? this.deck.split(percent) : null;
    }

    removeCard(card) {
        return this.deck ? this.deck.removeCard(card) : false;
    }

    removeCards(cards) {
        let removed = 0;
        for (let card of cards) {
            if (this.removeCard(card)) removed++;
        }
        return removed;
    }

    addCard(card, toTop = false) {
        if (this.deck) this.deck.addCard(card, toTop);
    }

    addCards(cards, toTop = false) {
        if (this.deck) this.deck.addCards(cards, toTop);
    }

    hasCard(card) {
        return this.deck ? this.deck.hasCard(card) : false;
    }

    getCardPosition(card) {
        return this.deck ? this.deck.getCardIndex(card) : -1;
    }

    getCardAt(index) {
        return this.deck ? this.deck.getCardAt(index) : null;
    }

    sortDeckByRank(descending = true) {
        if (this.deck) this.deck.sortByRank(descending);
        return this.deck;
    }

    sortDeckBySuit(descending = true) {
        if (this.deck) this.deck.sortBySuit(descending);
        return this.deck;
    }

    sortDeckByRankThenSuit(descendingRank = true, descendingSuit = true) {
        if (this.deck) this.deck.sortByRankThenSuit(descendingRank, descendingSuit);
        return this.deck;
    }

    reverseDeck() {
        if (this.deck) this.deck.reverse();
        return this.deck;
    }

    getDeckSummary() {
        return {
            remaining: this.getRemainingCount(),
            discarded: this.getDiscardCount(),
            burned: this.getBurnCount(),
            totalUsed: this.getTotalUsedCount(),
            deckEmpty: this.isDeckEmpty(),
            shuffleCount: this.shuffleCount
        };
    }

    getRankDistribution() {
        return this.deck ? this.deck.getRankDistribution() : {};
    }

    getSuitDistribution() {
        return this.deck ? this.deck.getSuitDistribution() : {};
    }

    getRemainingRanks() {
        const dist = this.getRankDistribution();
        const remaining = [];
        for (let rank in dist) {
            if (dist[rank] > 0) remaining.push(rank);
        }
        return remaining;
    }

    getRemainingSuits() {
        const dist = this.getSuitDistribution();
        const remaining = [];
        for (let suit in dist) {
            if (dist[suit] > 0) remaining.push(suit);
        }
        return remaining;
    }

    countRemainingRank(rank) {
        return this.deck ? this.deck.countRank(rank) : 0;
    }

    countRemainingSuit(suit) {
        return this.deck ? this.deck.countSuit(suit) : 0;
    }

    getSpecificCardCount(card) {
        return this.deck ? this.deck.countCard(card) : 0;
    }

    isCardAvailable(card) {
        return this.hasCard(card);
    }

    getAvailableCardsMatching(predicate) {
        return this.deck ? this.deck.getCards().filter(predicate) : [];
    }

    getAvailableCardsByRank(rank) {
        return this.getAvailableCardsMatching(c => c.rank === rank);
    }

    getAvailableCardsBySuit(suit) {
        return this.getAvailableCardsMatching(c => c.suit === suit);
    }

    getAvailableCardsByRankValue(value) {
        return this.getAvailableCardsMatching(c => c.rankValue === value);
    }

    getRandomAvailableCard() {
        return this.deck ? this.deck.getRandomCard() : null;
    }

    removeRandomCard() {
        return this.deck ? this.deck.removeRandomCard() : null;
    }

    removeRandomCards(count) {
        return this.deck ? this.deck.removeRandomCards(count) : [];
    }

    clone() {
        const clone = new window.DeckManager();
        clone.deck = this.deck ? this.deck.clone() : null;
        clone.discardPile = this.discardPile.map(c => c.clone());
        clone.burnPile = this.burnPile.map(c => c.clone());
        clone.initialDeck = this.initialDeck.map(c => c.clone());
        clone.shuffleCount = this.shuffleCount;
        clone.autoRebuild = this.autoRebuild;
        return clone;
    }

    toJSON() {
        return {
            deck: this.deck ? this.deck.toJSON() : null,
            discardPile: this.discardPile.map(c => ({ rank: c.rank, suit: c.suit })),
            burnPile: this.burnPile.map(c => ({ rank: c.rank, suit: c.suit })),
            shuffleCount: this.shuffleCount,
            autoRebuild: this.autoRebuild
        };
    }

    static fromJSON(data) {
        const manager = new window.DeckManager();
        if (data.deck) manager.deck = window.Deck.fromJSON(data.deck);
        manager.discardPile = data.discardPile.map(c => new window.Card(c.rank, c.suit));
        manager.burnPile = data.burnPile.map(c => new window.Card(c.rank, c.suit));
        manager.shuffleCount = data.shuffleCount;
        manager.autoRebuild = data.autoRebuild;
        return manager;
    }

    dealToPlayer(player, count = 2) {
        const cards = this.drawCards(count);
        if (cards.length === count) {
            player.receiveCards(cards);
            return true;
        }
        return false;
    }

    dealToPlayers(players, cardsPerPlayer = 2) {
        const success = true;
        for (let i = 0; i < cardsPerPlayer; i++) {
            for (let player of players) {
                if (player && player.isActive && !player.sitOut) {
                    const card = this.drawCard();
                    if (card) player.receiveCard(card);
                    else success = false;
                }
            }
        }
        return success;
    }

    dealCommunityCards(communityArray, count) {
        const cards = this.drawCards(count);
        communityArray.push(...cards);
        return cards.length === count;
    }

    dealFlop(communityArray) {
        this.burnCard();
        const flop = this.drawCards(3);
        communityArray.push(...flop);
        return flop;
    }

    dealTurn(communityArray) {
        this.burnCard();
        const turn = this.drawCard();
        if (turn) communityArray.push(turn);
        return turn;
    }

    dealRiver(communityArray) {
        this.burnCard();
        const river = this.drawCard();
        if (river) communityArray.push(river);
        return river;
    }

    resetAndShuffle() {
        this.resetDeck();
        this.shuffle();
        return this.deck;
    }

    prepareNewHand() {
        this.resetAndShuffle();
        this.discardPile = [];
        this.burnPile = [];
        return this.deck;
    }

    collectCardsFromPlayers(players) {
        const collected = [];
        for (let player of players) {
            if (player.hand.length) {
                collected.push(...player.hand);
                player.clearHand();
            }
        }
        this.discardCards(collected);
        return collected;
    }

    collectCommunityCards(communityArray) {
        if (communityArray.length) {
            this.discardCards(communityArray);
            communityArray.length = 0;
        }
    }

    collectAllCards(players, communityArray) {
        this.collectCardsFromPlayers(players);
        this.collectCommunityCards(communityArray);
        this.rebuildAll();
        return this.deck;
    }

    verifyDeckIntegrity() {
        if (!this.deck) return false;
        const total = this.deck.size() + this.discardPile.length + this.burnPile.length;
        return total === 52;
    }

    getMissingCards() {
        const allCards = window.Card.getDeck();
        const present = new Set();
        const addCards = (cards) => cards.forEach(c => present.add(c.toString()));
        if (this.deck) addCards(this.deck.getCards());
        addCards(this.discardPile);
        addCards(this.burnPile);
        return allCards.filter(c => !present.has(c.toString()));
    }

    getCardBackup() {
        return {
            deckCards: this.deck ? this.deck.getCards().map(c => c.toString()) : [],
            discardCards: this.discardPile.map(c => c.toString()),
            burnCards: this.burnPile.map(c => c.toString())
        };
    }

    restoreFromBackup(backup) {
        this.deck = window.Deck.fromCards(backup.deckCards.map(str => window.Card.fromString(str)));
        this.discardPile = backup.discardCards.map(str => window.Card.fromString(str));
        this.burnPile = backup.burnCards.map(str => window.Card.fromString(str));
        return this;
    }
};

window.DeckManager = window.DeckManager;

console.log('controller_DeckManager.js loaded');
