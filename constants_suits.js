window.SUIT_SYMBOLS = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};

window.SUIT_NAMES = {
    '♥': 'hearts',
    '♦': 'diamonds',
    '♣': 'clubs',
    '♠': 'spades'
};

window.SUIT_COLORS = {
    '♥': 'red',
    '♦': 'red',
    '♣': 'black',
    '♠': 'black'
};

window.ALL_SUITS = ['♥', '♦', '♣', '♠'];

window.getSuitSymbol = function(name) {
    return window.SUIT_SYMBOLS[name] || '?';
};

window.getSuitName = function(symbol) {
    return window.SUIT_NAMES[symbol] || 'unknown';
};

window.getSuitColor = function(symbol) {
    return window.SUIT_COLORS[symbol] || 'black';
};

window.isRedSuit = function(symbol) {
    return window.getSuitColor(symbol) === 'red';
};

window.isBlackSuit = function(symbol) {
    return window.getSuitColor(symbol) === 'black';
};

window.groupCardsBySuit = function(cards) {
    const groups = {
        '♥': [],
        '♦': [],
        '♣': [],
        '♠': []
    };
    for (let card of cards) {
        let suit = card.suit;
        if (groups[suit]) groups[suit].push(card);
    }
    return groups;
};

window.getSuitCounts = function(cards) {
    const counts = {
        '♥': 0,
        '♦': 0,
        '♣': 0,
        '♠': 0
    };
    for (let card of cards) {
        counts[card.suit]++;
    }
    return counts;
};

window.hasFlush = function(cards, requiredCount = 5) {
    const counts = window.getSuitCounts(cards);
    for (let suit in counts) {
        if (counts[suit] >= requiredCount) return true;
    }
    return false;
};

window.getFlushSuit = function(cards, requiredCount = 5) {
    const counts = window.getSuitCounts(cards);
    for (let suit in counts) {
        if (counts[suit] >= requiredCount) return suit;
    }
    return null;
};

window.getCardsOfSuit = function(cards, suit) {
    return cards.filter(card => card.suit === suit);
};

window.sortCardsByRank = function(cards, descending = true) {
    return [...cards].sort((a, b) => {
        let valA = window.getRankValue(a.rank);
        let valB = window.getRankValue(b.rank);
        return descending ? valB - valA : valA - valB;
    });
};

window.getFlushCards = function(cards, requiredCount = 5) {
    const flushSuit = window.getFlushSuit(cards, requiredCount);
    if (!flushSuit) return [];
    const suitedCards = window.getCardsOfSuit(cards, flushSuit);
    return window.sortCardsByRank(suitedCards, true);
};

window.areAllSameSuit = function(cards) {
    if (cards.length === 0) return true;
    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
};

window.getMostCommonSuit = function(cards) {
    const counts = window.getSuitCounts(cards);
    let maxSuit = null;
    let maxCount = 0;
    for (let suit in counts) {
        if (counts[suit] > maxCount) {
            maxCount = counts[suit];
            maxSuit = suit;
        }
    }
    return maxSuit;
};

window.getSuitDistribution = function(cards) {
    const dist = { '♥': 0, '♦': 0, '♣': 0, '♠': 0 };
    for (let card of cards) {
        dist[card.suit]++;
    }
    return dist;
};

window.getSuitsWithCountAtLeast = function(cards, minCount) {
    const counts = window.getSuitCounts(cards);
    const result = [];
    for (let suit in counts) {
        if (counts[suit] >= minCount) result.push(suit);
    }
    return result;
};

window.suitsToString = function(suits) {
    return suits.join('');
};

window.getSuitSymbolFromCard = function(card) {
    return card.suit;
};

window.getSuitColorFromCard = function(card) {
    return window.getSuitColor(card.suit);
};

window.isSameSuit = function(cardA, cardB) {
    return cardA.suit === cardB.suit;
};

window.getUniqueSuits = function(cards) {
    const suits = new Set();
    for (let card of cards) suits.add(card.suit);
    return Array.from(suits);
};

window.countSuits = function(cards) {
    return window.getUniqueSuits(cards).length;
};

window.getSuitSymbolsArray = function() {
    return window.ALL_SUITS.slice();
};

window.getSuitNameFromSymbol = function(symbol) {
    const map = {
        '♥': 'hearts',
        '♦': 'diamonds',
        '♣': 'clubs',
        '♠': 'spades'
    };
    return map[symbol] || symbol;
};

window.getSuitSymbolFromName = function(name) {
    const map = {
        'hearts': '♥',
        'diamonds': '♦',
        'clubs': '♣',
        'spades': '♠'
    };
    return map[name] || '?';
};

window.isValidSuit = function(suit) {
    return window.ALL_SUITS.includes(suit);
};

window.getRandomSuit = function() {
    const suits = window.ALL_SUITS;
    return suits[Math.floor(Math.random() * suits.length)];
};

window.getSuitEmoji = function(suit) {
    const emojis = {
        '♥': '❤️',
        '♦': '♦️',
        '♣': '♣️',
        '♠': '♠️'
    };
    return emojis[suit] || suit;
};

window.formatSuitForDisplay = function(suit, withColor = false) {
    let symbol = suit;
    if (withColor) {
        const color = window.getSuitColor(suit);
        return `<span style="color: ${color};">${symbol}</span>`;
    }
    return symbol;
};

window.getSuitFromCard = function(card) {
    return card.suit;
};

window.getCardsGroupedBySuit = function(cards) {
    const groups = {};
    for (let suit of window.ALL_SUITS) groups[suit] = [];
    for (let card of cards) groups[card.suit].push(card);
    return groups;
};

window.getSuitsWithCards = function(cards) {
    const result = {};
    for (let card of cards) {
        if (!result[card.suit]) result[card.suit] = [];
        result[card.suit].push(card);
    }
    return result;
};

window.getSuitStats = function(cards) {
    const counts = window.getSuitCounts(cards);
    const mostCommon = window.getMostCommonSuit(cards);
    const flushPossible = window.hasFlush(cards, 5);
    return {
        counts: counts,
        mostCommon: mostCommon,
        flushPossible: flushPossible,
        uniqueSuits: window.countSuits(cards)
    };
};

window.getCardsBySuit = function(cards, suit) {
    return cards.filter(c => c.suit === suit);
};

window.getSuitIndex = function(suit) {
    return window.ALL_SUITS.indexOf(suit);
};

window.getSuitByIndex = function(index) {
    return window.ALL_SUITS[index] || null;
};

window.areSuitsEqual = function(suitA, suitB) {
    return suitA === suitB;
};

window.getSuitComparisonValue = function(suit) {
    const order = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };
    return order[suit] || 0;
};

window.sortSuits = function(suits, descending = true) {
    return [...suits].sort((a, b) => {
        const valA = window.getSuitComparisonValue(a);
        const valB = window.getSuitComparisonValue(b);
        return descending ? valB - valA : valA - valB;
    });
};

window.getSuitSymbolFromName = function(name) {
    const map = {
        'hearts': '♥',
        'diamonds': '♦',
        'clubs': '♣',
        'spades': '♠'
    };
    return map[name] || '?';
};

window.getSuitNameFromSymbol = function(symbol) {
    const map = {
        '♥': 'hearts',
        '♦': 'diamonds',
        '♣': 'clubs',
        '♠': 'spades'
    };
    return map[symbol] || symbol;
};

window.getAllSuitSymbols = function() {
    return window.ALL_SUITS.slice();
};

window.getAllSuitNames = function() {
    return ['hearts', 'diamonds', 'clubs', 'spades'];
};

window.getSuitColorHex = function(suit) {
    return window.isRedSuit(suit) ? '#ff3333' : '#222222';
};

window.getSuitBackgroundStyle = function(suit) {
    const color = window.getSuitColor(suit);
    return `color: ${color};`;
};

window.getSuitClassName = function(suit) {
    const map = {
        '♥': 'heart',
        '♦': 'diamond',
        '♣': 'club',
        '♠': 'spade'
    };
    return `suit-${map[suit]}`;
};

console.log('constants_suits.js loaded');
