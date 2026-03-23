window.HAND_RANKS = {
    HIGH_CARD: 1,
    ONE_PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

window.HAND_RANK_NAMES = {
    1: 'Старшая карта',
    2: 'Одна пара',
    3: 'Две пары',
    4: 'Сет',
    5: 'Стрит',
    6: 'Флеш',
    7: 'Фулл-хаус',
    8: 'Каре',
    9: 'Стрит-флеш',
    10: 'Роял-флеш'
};

window.HAND_RANK_WEIGHTS = {
    HIGH_CARD: 1,
    ONE_PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

class HandEvaluation {
    constructor(rank, rankValue, kickers = []) {
        this.rank = rank;
        this.rankValue = rankValue;
        this.kickers = kickers;
        this.rankName = window.HAND_RANK_NAMES[rank] || 'Unknown';
    }

    compareTo(other) {
        if (this.rank !== other.rank) {
            return this.rank - other.rank;
        }
        if (this.rankValue !== other.rankValue) {
            return this.rankValue - other.rankValue;
        }
        for (let i = 0; i < Math.min(this.kickers.length, other.kickers.length); i++) {
            if (this.kickers[i] !== other.kickers[i]) {
                return this.kickers[i] - other.kickers[i];
            }
        }
        return 0;
    }

    toString() {
        let str = `${this.rankName} (${this.rankValue})`;
        if (this.kickers.length) {
            str += ` Kickers: ${this.kickers.join(',')}`;
        }
        return str;
    }
}

window.evaluateHand = function(cards) {
    if (!cards || cards.length < 5) return new HandEvaluation(window.HAND_RANKS.HIGH_CARD, 0, []);
    const rankValues = cards.map(c => window.getRankValue(c.rank));
    const suits = cards.map(c => c.suit);
    const isFlush = window.hasFlush(cards, 5);
    const flushSuit = isFlush ? window.getFlushSuit(cards, 5) : null;
    const straightHigh = window.getStraightHighValue(rankValues);
    const isStraight = straightHigh !== null;
    const rankCounts = window.getRankCounts(rankValues);
    const grouped = window.getGroupedRanks(rankValues);
    const quads = grouped.quads;
    const trips = grouped.trips;
    const pairs = grouped.pairs;
    const singles = grouped.singles;
    if (isFlush && isStraight) {
        const flushCards = window.getFlushCards(cards, 5);
        const flushRanks = flushCards.map(c => window.getRankValue(c.rank));
        const flushStraightHigh = window.getStraightHighValue(flushRanks);
        if (flushStraightHigh !== null) {
            if (flushStraightHigh === 14) {
                return new HandEvaluation(window.HAND_RANKS.ROYAL_FLUSH, 14, []);
            } else {
                return new HandEvaluation(window.HAND_RANKS.STRAIGHT_FLUSH, flushStraightHigh, []);
            }
        }
    }
    if (quads.length) {
        const quadRank = quads[0];
        const kicker = singles[0] || 0;
        return new HandEvaluation(window.HAND_RANKS.FOUR_OF_A_KIND, quadRank, [kicker]);
    }
    if (trips.length && pairs.length) {
        const tripRank = trips[0];
        const pairRank = pairs[0];
        return new HandEvaluation(window.HAND_RANKS.FULL_HOUSE, tripRank, [pairRank]);
    }
    if (isFlush) {
        const flushCards = window.getFlushCards(cards, 5);
        const flushRanks = flushCards.map(c => window.getRankValue(c.rank));
        const sorted = flushRanks.sort((a,b)=>b-a);
        return new HandEvaluation(window.HAND_RANKS.FLUSH, sorted[0], sorted.slice(1));
    }
    if (isStraight) {
        return new HandEvaluation(window.HAND_RANKS.STRAIGHT, straightHigh, []);
    }
    if (trips.length) {
        const tripRank = trips[0];
        const kickers = singles.sort((a,b)=>b-a);
        return new HandEvaluation(window.HAND_RANKS.THREE_OF_A_KIND, tripRank, kickers);
    }
    if (pairs.length === 2) {
        const highPair = Math.max(pairs[0], pairs[1]);
        const lowPair = Math.min(pairs[0], pairs[1]);
        const kicker = singles[0] || 0;
        return new HandEvaluation(window.HAND_RANKS.TWO_PAIR, highPair, [lowPair, kicker]);
    }
    if (pairs.length === 1) {
        const pairRank = pairs[0];
        const kickers = singles.sort((a,b)=>b-a);
        return new HandEvaluation(window.HAND_RANKS.ONE_PAIR, pairRank, kickers);
    }
    const highCards = rankValues.sort((a,b)=>b-a);
    return new HandEvaluation(window.HAND_RANKS.HIGH_CARD, highCards[0], highCards.slice(1));
};

window.compareHands = function(hand1, hand2) {
    return hand1.compareTo(hand2);
};

window.getBestHandFromCards = function(cards) {
    if (cards.length < 5) return null;
    const allCombos = window.getAllCombinations(cards, 5);
    let best = null;
    for (let combo of allCombos) {
        const eval = window.evaluateHand(combo);
        if (!best || eval.compareTo(best) > 0) best = eval;
    }
    return best;
};

window.getAllCombinations = function(arr, k) {
    const result = [];
    const combine = (start, current) => {
        if (current.length === k) {
            result.push([...current]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);
            combine(i + 1, current);
            current.pop();
        }
    };
    combine(0, []);
    return result;
};

window.getHandRankName = function(rank) {
    return window.HAND_RANK_NAMES[rank] || 'Unknown';
};

window.getHandRankWeight = function(rank) {
    return window.HAND_RANK_WEIGHTS[Object.keys(window.HAND_RANK_WEIGHTS).find(key => window.HAND_RANKS[key] === rank)] || 0;
};

window.getHandRankFromValue = function(value) {
    for (let key in window.HAND_RANKS) {
        if (window.HAND_RANKS[key] === value) return key;
    }
    return null;
};

window.getHandRankValue = function(rankName) {
    return window.HAND_RANKS[rankName] || 0;
};

window.isRoyalFlush = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.ROYAL_FLUSH;
};

window.isStraightFlush = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.STRAIGHT_FLUSH;
};

window.isFourOfAKind = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.FOUR_OF_A_KIND;
};

window.isFullHouse = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.FULL_HOUSE;
};

window.isFlush = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.FLUSH;
};

window.isStraight = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.STRAIGHT;
};

window.isThreeOfAKind = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.THREE_OF_A_KIND;
};

window.isTwoPair = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.TWO_PAIR;
};

window.isOnePair = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.ONE_PAIR;
};

window.isHighCard = function(evaluation) {
    return evaluation.rank === window.HAND_RANKS.HIGH_CARD;
};

window.getHandStrengthDescription = function(evaluation) {
    let desc = window.HAND_RANK_NAMES[evaluation.rank];
    if (evaluation.rank === window.HAND_RANKS.ROYAL_FLUSH) return 'Роял-флеш!';
    if (evaluation.rank === window.HAND_RANKS.STRAIGHT_FLUSH) return `${desc} до ${window.getRankSymbol(evaluation.rankValue)}`;
    if (evaluation.rank === window.HAND_RANKS.FOUR_OF_A_KIND) return `${desc} ${window.getRankSymbol(evaluation.rankValue)} с кикером ${window.getRankSymbol(evaluation.kickers[0])}`;
    if (evaluation.rank === window.HAND_RANKS.FULL_HOUSE) return `${desc} ${window.getRankSymbol(evaluation.rankValue)} на ${window.getRankSymbol(evaluation.kickers[0])}`;
    if (evaluation.rank === window.HAND_RANKS.FLUSH) return `${desc} со старшей ${window.getRankSymbol(evaluation.rankValue)}`;
    if (evaluation.rank === window.HAND_RANKS.STRAIGHT) return `${desc} до ${window.getRankSymbol(evaluation.rankValue)}`;
    if (evaluation.rank === window.HAND_RANKS.THREE_OF_A_KIND) return `${desc} ${window.getRankSymbol(evaluation.rankValue)}`;
    if (evaluation.rank === window.HAND_RANKS.TWO_PAIR) return `${desc} ${window.getRankSymbol(evaluation.rankValue)} и ${window.getRankSymbol(evaluation.kickers[0])}`;
    if (evaluation.rank === window.HAND_RANKS.ONE_PAIR) return `${desc} ${window.getRankSymbol(evaluation.rankValue)}`;
    return `${desc} ${window.getRankSymbol(evaluation.rankValue)}`;
};

window.getHandEvaluationFromCards = function(cards) {
    return window.getBestHandFromCards(cards);
};

window.comparePlayerHands = function(players, communityCards) {
    const evaluations = [];
    for (let player of players) {
        if (!player.isActive || player.folded) {
            evaluations.push({ player, evaluation: null });
            continue;
        }
        const allCards = [...player.hand, ...communityCards];
        const evaluation = window.getBestHandFromCards(allCards);
        evaluations.push({ player, evaluation });
    }
    evaluations.sort((a,b) => {
        if (!a.evaluation) return 1;
        if (!b.evaluation) return -1;
        return b.evaluation.compareTo(a.evaluation);
    });
    return evaluations;
};

window.getWinningPlayers = function(players, communityCards) {
    const evaluated = window.comparePlayerHands(players, communityCards);
    if (evaluated.length === 0 || !evaluated[0].evaluation) return [];
    const bestEval = evaluated[0].evaluation;
    const winners = [];
    for (let item of evaluated) {
        if (item.evaluation && item.evaluation.compareTo(bestEval) === 0) {
            winners.push(item.player);
        }
    }
    return winners;
};

window.getHandRankPriority = function(rank) {
    const priority = {
        10: 100,
        9: 90,
        8: 80,
        7: 70,
        6: 60,
        5: 50,
        4: 40,
        3: 30,
        2: 20,
        1: 10
    };
    return priority[rank] || 0;
};

window.getHandScore = function(evaluation) {
    let score = evaluation.rank * 1000000;
    score += evaluation.rankValue * 10000;
    for (let i = 0; i < evaluation.kickers.length; i++) {
        score += evaluation.kickers[i] * Math.pow(100, evaluation.kickers.length - i - 1);
    }
    return score;
};

window.HandEvaluation = HandEvaluation;
window.evaluateHand = window.evaluateHand;
window.getBestHandFromCards = window.getBestHandFromCards;
window.getAllCombinations = window.getAllCombinations;
window.compareHands = window.compareHands;
window.getHandRankName = window.getHandRankName;
window.getHandRankWeight = window.getHandRankWeight;
window.getHandRankFromValue = window.getHandRankFromValue;
window.getHandRankValue = window.getHandRankValue;
window.isRoyalFlush = window.isRoyalFlush;
window.isStraightFlush = window.isStraightFlush;
window.isFourOfAKind = window.isFourOfAKind;
window.isFullHouse = window.isFullHouse;
window.isFlush = window.isFlush;
window.isStraight = window.isStraight;
window.isThreeOfAKind = window.isThreeOfAKind;
window.isTwoPair = window.isTwoPair;
window.isOnePair = window.isOnePair;
window.isHighCard = window.isHighCard;
window.getHandStrengthDescription = window.getHandStrengthDescription;
window.getHandEvaluationFromCards = window.getHandEvaluationFromCards;
window.comparePlayerHands = window.comparePlayerHands;
window.getWinningPlayers = window.getWinningPlayers;
window.getHandRankPriority = window.getHandRankPriority;
window.getHandScore = window.getHandScore;

console.log('constants_handranks.js loaded');
