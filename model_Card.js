window.Card = class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.rankValue = window.getRankValue(rank);
        this.suitSymbol = suit;
        this.faceUp = true;
    }

    getDisplayRank() {
        return this.rank;
    }

    getDisplaySuit() {
        return this.suit;
    }

    getDisplayString() {
        return `${this.rank}${this.suit}`;
    }

    getColor() {
        return window.getSuitColor(this.suit);
    }

    isRed() {
        return window.isRedSuit(this.suit);
    }

    isBlack() {
        return window.isBlackSuit(this.suit);
    }

    getHtml(faceDown = false) {
        if (faceDown || !this.faceUp) {
            return `<div class="card card-back" style="background: ${window.getCardBackStyle()};"></div>`;
        }
        const colorClass = this.isRed() ? 'red' : 'black';
        return `<div class="card ${colorClass}" data-rank="${this.rank}" data-suit="${this.suit}">
                    <div class="card-rank-top">${this.rank}</div>
                    <div class="card-suit">${this.suit}</div>
                    <div class="card-rank-bottom">${this.rank}</div>
                </div>`;
    }

    toString() {
        return this.getDisplayString();
    }

    equals(other) {
        if (!other) return false;
        return this.rank === other.rank && this.suit === other.suit;
    }

    clone() {
        return new window.Card(this.rank, this.suit);
    }

    static fromString(str) {
        const match = str.match(/^([2-9JQKA]|10)([♥♦♣♠])$/);
        if (match) {
            return new window.Card(match[1], match[2]);
        }
        return null;
    }

    static getDeck() {
        const ranks = window.ALL_RANKS;
        const suits = window.ALL_SUITS;
        const deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push(new window.Card(rank, suit));
            }
        }
        return deck;
    }

    static compareRank(cardA, cardB) {
        return window.compareRanks(cardA.rank, cardB.rank);
    }

    static compareSuit(cardA, cardB) {
        const order = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        const valA = order[cardA.suit] || 0;
        const valB = order[cardB.suit] || 0;
        return valA - valB;
    }

    static sortByRank(cards, descending = true) {
        return [...cards].sort((a, b) => {
            const diff = window.compareRanks(a.rank, b.rank);
            return descending ? -diff : diff;
        });
    }

    static sortBySuit(cards, descending = true) {
        const order = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
        return [...cards].sort((a, b) => {
            let valA = order[a.suit] || 0;
            let valB = order[b.suit] || 0;
            return descending ? valB - valA : valA - valB;
        });
    }

    static getRankFrequency(cards) {
        const freq = {};
        for (let card of cards) {
            const rank = card.rank;
            freq[rank] = (freq[rank] || 0) + 1;
        }
        return freq;
    }

    static getSuitFrequency(cards) {
        const freq = { '♥': 0, '♦': 0, '♣': 0, '♠': 0 };
        for (let card of cards) {
            freq[card.suit]++;
        }
        return freq;
    }

    static getRankValues(cards) {
        return cards.map(c => c.rankValue);
    }

    static getSuits(cards) {
        return cards.map(c => c.suit);
    }

    static hasRank(cards, rank) {
        return cards.some(c => c.rank === rank);
    }

    static hasSuit(cards, suit) {
        return cards.some(c => c.suit === suit);
    }

    static filterByRank(cards, rank) {
        return cards.filter(c => c.rank === rank);
    }

    static filterBySuit(cards, suit) {
        return cards.filter(c => c.suit === suit);
    }

    static filterByRankValue(cards, value) {
        return cards.filter(c => c.rankValue === value);
    }

    static getUniqueRanks(cards) {
        const ranks = new Set();
        for (let card of cards) ranks.add(card.rank);
        return Array.from(ranks);
    }

    static getUniqueSuits(cards) {
        const suits = new Set();
        for (let card of cards) suits.add(card.suit);
        return Array.from(suits);
    }

    static getHighestRank(cards) {
        if (cards.length === 0) return null;
        let best = cards[0];
        for (let card of cards) {
            if (window.compareRanks(card.rank, best.rank) > 0) best = card;
        }
        return best;
    }

    static getLowestRank(cards) {
        if (cards.length === 0) return null;
        let best = cards[0];
        for (let card of cards) {
            if (window.compareRanks(card.rank, best.rank) < 0) best = card;
        }
        return best;
    }

    static isPair(cards) {
        const freq = window.Card.getRankFrequency(cards);
        return Object.values(freq).some(count => count === 2);
    }

    static isThreeOfAKind(cards) {
        const freq = window.Card.getRankFrequency(cards);
        return Object.values(freq).some(count => count === 3);
    }

    static isFourOfAKind(cards) {
        const freq = window.Card.getRankFrequency(cards);
        return Object.values(freq).some(count => count === 4);
    }

    static isTwoPair(cards) {
        const freq = window.Card.getRankFrequency(cards);
        let pairs = 0;
        for (let count of Object.values(freq)) if (count === 2) pairs++;
        return pairs === 2;
    }

    static isFullHouse(cards) {
        const freq = window.Card.getRankFrequency(cards);
        let hasThree = false, hasTwo = false;
        for (let count of Object.values(freq)) {
            if (count === 3) hasThree = true;
            if (count === 2) hasTwo = true;
        }
        return hasThree && hasTwo;
    }

    static isFlush(cards) {
        const suits = window.Card.getUniqueSuits(cards);
        return suits.length === 1;
    }

    static isStraight(cards) {
        const values = window.Card.getRankValues(cards);
        return window.hasStraight(values);
    }

    static isStraightFlush(cards) {
        return window.Card.isFlush(cards) && window.Card.isStraight(cards);
    }

    static isRoyalFlush(cards) {
        if (!window.Card.isStraightFlush(cards)) return false;
        const values = window.Card.getRankValues(cards);
        return values.includes(14) && values.includes(13) && values.includes(12) && values.includes(11) && values.includes(10);
    }

    static getHandRank(cards) {
        if (window.Card.isRoyalFlush(cards)) return 10;
        if (window.Card.isStraightFlush(cards)) return 9;
        if (window.Card.isFourOfAKind(cards)) return 8;
        if (window.Card.isFullHouse(cards)) return 7;
        if (window.Card.isFlush(cards)) return 6;
        if (window.Card.isStraight(cards)) return 5;
        if (window.Card.isThreeOfAKind(cards)) return 4;
        if (window.Card.isTwoPair(cards)) return 3;
        if (window.Card.isPair(cards)) return 2;
        return 1;
    }

    static getHandRankName(cards) {
        const rank = window.Card.getHandRank(cards);
        return window.getHandRankName(rank);
    }

    static cardsToString(cards) {
        return cards.map(c => c.toString()).join(' ');
    }

    static fromStringArray(strArray) {
        return strArray.map(s => window.Card.fromString(s)).filter(c => c !== null);
    }

    static cloneArray(cards) {
        return cards.map(c => c.clone());
    }

    static areEqual(cardsA, cardsB) {
        if (cardsA.length !== cardsB.length) return false;
        const aSorted = window.Card.sortByRank(cardsA);
        const bSorted = window.Card.sortByRank(cardsB);
        for (let i = 0; i < aSorted.length; i++) {
            if (!aSorted[i].equals(bSorted[i])) return false;
        }
        return true;
    }

    static getMissingRanks(cards, allRanks = window.ALL_RANKS) {
        const present = new Set(cards.map(c => c.rank));
        return allRanks.filter(r => !present.has(r));
    }

    static getMissingSuits(cards, allSuits = window.ALL_SUITS) {
        const present = new Set(cards.map(c => c.suit));
        return allSuits.filter(s => !present.has(s));
    }

    static getCommonCards(cardsA, cardsB) {
        return cardsA.filter(cA => cardsB.some(cB => cA.equals(cB)));
    }

    static getUniqueCards(cardsA, cardsB) {
        const combined = [...cardsA, ...cardsB];
        const unique = [];
        for (let card of combined) {
            if (!unique.some(u => u.equals(card))) unique.push(card);
        }
        return unique;
    }

    static getRankDistribution(cards) {
        const dist = {};
        for (let rank of window.ALL_RANKS) dist[rank] = 0;
        for (let card of cards) dist[card.rank]++;
        return dist;
    }

    static getSuitDistribution(cards) {
        const dist = { '♥': 0, '♦': 0, '♣': 0, '♠': 0 };
        for (let card of cards) dist[card.suit]++;
        return dist;
    }

    static getRankValuesSet(cards) {
        return new Set(window.Card.getRankValues(cards));
    }

    static getSuitsSet(cards) {
        return new Set(window.Card.getSuits(cards));
    }

    static getRankValueCounts(cards) {
        const values = window.Card.getRankValues(cards);
        const counts = new Map();
        for (let v of values) counts.set(v, (counts.get(v) || 0) + 1);
        return counts;
    }

    static getBestCardsFromHandAndCommunity(playerHand, communityCards) {
        const all = [...playerHand, ...communityCards];
        if (all.length < 5) return [];
        const combos = window.getAllCombinations(all, 5);
        let bestCombo = null;
        let bestRank = 0;
        for (let combo of combos) {
            const rank = window.Card.getHandRank(combo);
            if (rank > bestRank) {
                bestRank = rank;
                bestCombo = combo;
            } else if (rank === bestRank && bestCombo) {
                const eval1 = window.evaluateHand(combo);
                const eval2 = window.evaluateHand(bestCombo);
                if (eval1.compareTo(eval2) > 0) bestCombo = combo;
            }
        }
        return bestCombo || [];
    }
};

window.createCard = function(rank, suit) {
    return new window.Card(rank, suit);
};

window.createDeck = function() {
    return window.Card.getDeck();
};

window.isValidCard = function(card) {
    return card instanceof window.Card;
};

window.getCardFromString = function(str) {
    return window.Card.fromString(str);
};

window.getCardsFromStringArray = function(arr) {
    return window.Card.fromStringArray(arr);
};

window.cloneCards = function(cards) {
    return window.Card.cloneArray(cards);
};

window.sortCardsByRank = function(cards, descending) {
    return window.Card.sortByRank(cards, descending);
};

window.sortCardsBySuit = function(cards, descending) {
    return window.Card.sortBySuit(cards, descending);
};

window.getBestFiveCardHand = function(playerHand, communityCards) {
    return window.Card.getBestCardsFromHandAndCommunity(playerHand, communityCards);
};

window.Card = window.Card;
window.createCard = window.createCard;
window.createDeck = window.createDeck;
window.isValidCard = window.isValidCard;
window.getCardFromString = window.getCardFromString;
window.getCardsFromStringArray = window.getCardsFromStringArray;
window.cloneCards = window.cloneCards;
window.sortCardsByRank = window.sortCardsByRank;
window.sortCardsBySuit = window.sortCardsBySuit;
window.getBestFiveCardHand = window.getBestFiveCardHand;

console.log('model_Card.js loaded');
