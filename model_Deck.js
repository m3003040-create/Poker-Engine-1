window.Deck = class Deck {
    constructor() {
        this.cards = [];
        this.discarded = [];
        this.initialize();
    }

    initialize() {
        this.cards = window.Card.getDeck();
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this;
    }

    draw() {
        if (this.cards.length === 0) return null;
        return this.cards.pop();
    }

    drawMultiple(count) {
        const drawn = [];
        for (let i = 0; i < count; i++) {
            const card = this.draw();
            if (!card) break;
            drawn.push(card);
        }
        return drawn;
    }

    addCard(card, toTop = false) {
        if (toTop) {
            this.cards.unshift(card);
        } else {
            this.cards.push(card);
        }
    }

    addCards(cards, toTop = false) {
        for (let card of cards) {
            this.addCard(card, toTop);
        }
    }

    removeCard(card) {
        const index = this.cards.findIndex(c => c.equals(card));
        if (index !== -1) {
            this.cards.splice(index, 1);
            return true;
        }
        return false;
    }

    removeCards(cards) {
        let removed = 0;
        for (let card of cards) {
            if (this.removeCard(card)) removed++;
        }
        return removed;
    }

    discard(card) {
        const removed = this.removeCard(card);
        if (removed) {
            this.discarded.push(card);
        }
        return removed;
    }

    discardMultiple(cards) {
        let count = 0;
        for (let card of cards) {
            if (this.discard(card)) count++;
        }
        return count;
    }

    reset() {
        this.cards = [];
        this.discarded = [];
        this.initialize();
    }

    resetAndShuffle() {
        this.reset();
        return this;
    }

    size() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    getCards() {
        return [...this.cards];
    }

    getDiscarded() {
        return [...this.discarded];
    }

    peekTop() {
        if (this.cards.length === 0) return null;
        return this.cards[this.cards.length - 1];
    }

    peekBottom() {
        if (this.cards.length === 0) return null;
        return this.cards[0];
    }

    cut(percent = 0.5) {
        if (this.cards.length < 2) return;
        const cutPoint = Math.floor(this.cards.length * percent);
        if (cutPoint <= 0 || cutPoint >= this.cards.length) return;
        const top = this.cards.slice(0, cutPoint);
        const bottom = this.cards.slice(cutPoint);
        this.cards = [...bottom, ...top];
    }

    split(percent = 0.5) {
        const splitPoint = Math.floor(this.cards.length * percent);
        if (splitPoint <= 0 || splitPoint >= this.cards.length) return null;
        const top = this.cards.slice(0, splitPoint);
        const bottom = this.cards.slice(splitPoint);
        return { top, bottom };
    }

    combine(otherDeck) {
        this.cards.push(...otherDeck.getCards());
        this.discarded.push(...otherDeck.getDiscarded());
        otherDeck.clear();
    }

    clear() {
        this.cards = [];
        this.discarded = [];
    }

    clone() {
        const newDeck = new window.Deck();
        newDeck.cards = window.Card.cloneArray(this.cards);
        newDeck.discarded = window.Card.cloneArray(this.discarded);
        return newDeck;
    }

    static createEmpty() {
        const deck = new window.Deck();
        deck.cards = [];
        deck.discarded = [];
        return deck;
    }

    static fromCards(cards) {
        const deck = new window.Deck();
        deck.cards = window.Card.cloneArray(cards);
        return deck;
    }

    hasCard(card) {
        return this.cards.some(c => c.equals(card));
    }

    hasCards(cards) {
        for (let card of cards) {
            if (!this.hasCard(card)) return false;
        }
        return true;
    }

    countCard(card) {
        return this.cards.filter(c => c.equals(card)).length;
    }

    countRank(rank) {
        return this.cards.filter(c => c.rank === rank).length;
    }

    countSuit(suit) {
        return this.cards.filter(c => c.suit === suit).length;
    }

    getRankDistribution() {
        const dist = {};
        for (let rank of window.ALL_RANKS) dist[rank] = 0;
        for (let card of this.cards) dist[card.rank]++;
        return dist;
    }

    getSuitDistribution() {
        const dist = { '♥': 0, '♦': 0, '♣': 0, '♠': 0 };
        for (let card of this.cards) dist[card.suit]++;
        return dist;
    }

    getRemainingCount() {
        return this.cards.length;
    }

    getDiscardedCount() {
        return this.discarded.length;
    }

    getTotalCardsUsed() {
        return this.cards.length + this.discarded.length;
    }

    isComplete() {
        return this.getTotalCardsUsed() === 52;
    }

    toString() {
        return this.cards.map(c => c.toString()).join(', ');
    }

    toArray() {
        return this.getCards();
    }

    toJSON() {
        return {
            cards: this.cards.map(c => ({ rank: c.rank, suit: c.suit })),
            discarded: this.discarded.map(c => ({ rank: c.rank, suit: c.suit }))
        };
    }

    static fromJSON(data) {
        const deck = new window.Deck();
        deck.cards = data.cards.map(c => new window.Card(c.rank, c.suit));
        deck.discarded = data.discarded.map(c => new window.Card(c.rank, c.suit));
        return deck;
    }

    sortByRank(descending = true) {
        this.cards.sort((a, b) => {
            const diff = window.compareRanks(a.rank, b.rank);
            return descending ? -diff : diff;
        });
        return this;
    }

    sortBySuit(descending = true) {
        const order = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        this.cards.sort((a, b) => {
            let valA = order[a.suit] || 0;
            let valB = order[b.suit] || 0;
            return descending ? valB - valA : valA - valB;
        });
        return this;
    }

    sortByRankThenSuit(descendingRank = true, descendingSuit = true) {
        const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        this.cards.sort((a, b) => {
            const rankDiff = window.compareRanks(a.rank, b.rank);
            if (rankDiff !== 0) return descendingRank ? -rankDiff : rankDiff;
            const suitA = suitOrder[a.suit] || 0;
            const suitB = suitOrder[b.suit] || 0;
            return descendingSuit ? suitB - suitA : suitA - suitB;
        });
        return this;
    }

    reverse() {
        this.cards.reverse();
        return this;
    }

    dealToPlayer(player, count = 2) {
        const cards = this.drawMultiple(count);
        if (cards.length === count) {
            player.receiveCards(cards);
            return true;
        }
        return false;
    }

    dealToTable(communityCardsArray, count) {
        const cards = this.drawMultiple(count);
        if (cards.length === count) {
            communityCardsArray.push(...cards);
            return true;
        }
        return false;
    }

    burn() {
        return this.draw();
    }

    burnAndDeal(count) {
        const burned = [];
        for (let i = 0; i < count; i++) {
            const card = this.draw();
            if (card) burned.push(card);
            else break;
        }
        return burned;
    }

    getTopCard() {
        return this.peekTop();
    }

    getBottomCard() {
        return this.peekBottom();
    }

    moveToDiscard(card) {
        return this.discard(card);
    }

    moveToDiscardMultiple(cards) {
        return this.discardMultiple(cards);
    }

    returnFromDiscard(card) {
        const index = this.discarded.findIndex(c => c.equals(card));
        if (index !== -1) {
            this.discarded.splice(index, 1);
            this.cards.push(card);
            return true;
        }
        return false;
    }

    returnFromDiscardMultiple(cards) {
        let count = 0;
        for (let card of cards) {
            if (this.returnFromDiscard(card)) count++;
        }
        return count;
    }

    shuffleDiscardIntoDeck() {
        this.cards.push(...this.discarded);
        this.discarded = [];
        this.shuffle();
        return this;
    }

    removeAllCopies(card) {
        let removed = 0;
        this.cards = this.cards.filter(c => {
            if (c.equals(card)) {
                removed++;
                return false;
            }
            return true;
        });
        return removed;
    }

    removeAllByRank(rank) {
        let removed = 0;
        this.cards = this.cards.filter(c => {
            if (c.rank === rank) {
                removed++;
                return false;
            }
            return true;
        });
        return removed;
    }

    removeAllBySuit(suit) {
        let removed = 0;
        this.cards = this.cards.filter(c => {
            if (c.suit === suit) {
                removed++;
                return false;
            }
            return true;
        });
        return removed;
    }

    filterByRank(rank) {
        return this.cards.filter(c => c.rank === rank);
    }

    filterBySuit(suit) {
        return this.cards.filter(c => c.suit === suit);
    }

    filterByRankValue(value) {
        return this.cards.filter(c => c.rankValue === value);
    }

    getRandomCard() {
        if (this.cards.length === 0) return null;
        const idx = Math.floor(Math.random() * this.cards.length);
        return this.cards[idx];
    }

    removeRandomCard() {
        if (this.cards.length === 0) return null;
        const idx = Math.floor(Math.random() * this.cards.length);
        return this.cards.splice(idx, 1)[0];
    }

    removeRandomCards(count) {
        const removed = [];
        for (let i = 0; i < count; i++) {
            const card = this.removeRandomCard();
            if (!card) break;
            removed.push(card);
        }
        return removed;
    }

    static combineDecks(deckA, deckB) {
        const combined = deckA.clone();
        combined.combine(deckB);
        return combined;
    }

    static shuffleMultiple(deckArray) {
        for (let deck of deckArray) deck.shuffle();
    }

    getCardIndex(card) {
        return this.cards.findIndex(c => c.equals(card));
    }

    getCardAt(index) {
        if (index < 0 || index >= this.cards.length) return null;
        return this.cards[index];
    }

    insertCardAt(card, index) {
        if (index < 0) index = 0;
        if (index > this.cards.length) index = this.cards.length;
        this.cards.splice(index, 0, card);
    }

    insertCardsAt(cards, index) {
        for (let i = 0; i < cards.length; i++) {
            this.insertCardAt(cards[i], index + i);
        }
    }

    swapCards(i, j) {
        if (i < 0 || i >= this.cards.length || j < 0 || j >= this.cards.length) return false;
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        return true;
    }

    moveCard(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.cards.length) return false;
        if (toIndex < 0) toIndex = 0;
        if (toIndex >= this.cards.length) toIndex = this.cards.length - 1;
        const card = this.cards.splice(fromIndex, 1)[0];
        this.cards.splice(toIndex, 0, card);
        return true;
    }

    getSections(count) {
        const sectionSize = Math.floor(this.cards.length / count);
        const sections = [];
        for (let i = 0; i < count; i++) {
            const start = i * sectionSize;
            const end = (i === count - 1) ? this.cards.length : start + sectionSize;
            sections.push(this.cards.slice(start, end));
        }
        return sections;
    }

    static areDecksEqual(deckA, deckB) {
        if (deckA.size() !== deckB.size()) return false;
        for (let i = 0; i < deckA.size(); i++) {
            if (!deckA.getCardAt(i).equals(deckB.getCardAt(i))) return false;
        }
        return true;
    }

    getSummary() {
        return {
            totalCards: this.cards.length,
            discarded: this.discarded.length,
            rankDistribution: this.getRankDistribution(),
            suitDistribution: this.getSuitDistribution()
        };
    }
};

window.createDeckInstance = function() {
    return new window.Deck();
};

window.Deck = window.Deck;
window.createDeckInstance = window.createDeckInstance;

console.log('model_Deck.js loaded');
