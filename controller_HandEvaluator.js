window.HandEvaluator = class HandEvaluator {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 1000;
    }

    evaluateHand(cards) {
        if (!cards || cards.length < 5) return null;
        const cacheKey = this.getCacheKey(cards);
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const evaluation = window.getBestHandFromCards(cards);
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, evaluation);
        return evaluation;
    }

    evaluatePlayerHand(player, communityCards) {
        if (!player || player.folded) return null;
        const allCards = [...player.hand, ...communityCards];
        return this.evaluateHand(allCards);
    }

    evaluateAllPlayers(players, communityCards) {
        const results = [];
        for (let player of players) {
            const evaluation = this.evaluatePlayerHand(player, communityCards);
            results.push({ player, evaluation });
        }
        return results;
    }

    compareHands(evalA, evalB) {
        if (!evalA && !evalB) return 0;
        if (!evalA) return -1;
        if (!evalB) return 1;
        return evalA.compareTo(evalB);
    }

    getHandRankName(evaluation) {
        if (!evaluation) return 'Unknown';
        return window.getHandRankName(evaluation.rank);
    }

    getHandStrengthDescription(evaluation) {
        if (!evaluation) return 'Нет карт';
        return window.getHandStrengthDescription(evaluation);
    }

    getHandRankValue(evaluation) {
        if (!evaluation) return 0;
        return evaluation.rank;
    }

    getHandScore(evaluation) {
        if (!evaluation) return 0;
        return window.getHandScore(evaluation);
    }

    isRoyalFlush(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.ROYAL_FLUSH;
    }

    isStraightFlush(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.STRAIGHT_FLUSH;
    }

    isFourOfAKind(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.FOUR_OF_A_KIND;
    }

    isFullHouse(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.FULL_HOUSE;
    }

    isFlush(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.FLUSH;
    }

    isStraight(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.STRAIGHT;
    }

    isThreeOfAKind(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.THREE_OF_A_KIND;
    }

    isTwoPair(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.TWO_PAIR;
    }

    isOnePair(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.ONE_PAIR;
    }

    isHighCard(evaluation) {
        return evaluation && evaluation.rank === window.HAND_RANKS.HIGH_CARD;
    }

    getWinningPlayers(players, communityCards) {
        const evaluated = this.evaluateAllPlayers(players, communityCards);
        const valid = evaluated.filter(e => e.evaluation !== null);
        if (valid.length === 0) return [];
        let best = valid[0];
        for (let i = 1; i < valid.length; i++) {
            if (this.compareHands(valid[i].evaluation, best.evaluation) > 0) {
                best = valid[i];
            }
        }
        return valid.filter(e => this.compareHands(e.evaluation, best.evaluation) === 0).map(e => e.player);
    }

    getHandEquity(player, communityCards, opponents, iterations = 1000) {
        if (!player || player.folded) return 0;
        const deck = new window.Deck();
        const knownCards = [...player.hand, ...communityCards];
        for (let card of knownCards) deck.removeCard(card);
        let wins = 0;
        let ties = 0;
        for (let i = 0; i < iterations; i++) {
            const simDeck = deck.clone();
            simDeck.shuffle();
            const simCommunity = [...communityCards];
            const need = 5 - communityCards.length;
            for (let j = 0; j < need; j++) simCommunity.push(simDeck.draw());
            const myEval = this.evaluateHand([...player.hand, ...simCommunity]);
            let bestOpp = null;
            for (let opp of opponents) {
                if (opp.folded || opp === player) continue;
                const oppCards = [simDeck.draw(), simDeck.draw()];
                const oppEval = this.evaluateHand([...oppCards, ...simCommunity]);
                if (!bestOpp || this.compareHands(oppEval, bestOpp) > 0) bestOpp = oppEval;
            }
            if (!bestOpp) {
                wins++;
            } else {
                const cmp = this.compareHands(myEval, bestOpp);
                if (cmp > 0) wins++;
                else if (cmp === 0) ties++;
            }
        }
        return (wins + ties * 0.5) / iterations;
    }

    getRangeEquity(range, communityCards, opponents, iterations = 1000) {
        let totalEquity = 0;
        for (let hand of range) {
            const equity = this.getHandEquity(hand, communityCards, opponents, iterations);
            totalEquity += equity;
        }
        return totalEquity / range.length;
    }

    getBestPossibleHand(communityCards, deck) {
        if (communityCards.length === 5) return this.evaluateHand(communityCards);
        const remaining = deck ? deck.getCards() : window.Card.getDeck();
        const used = [...communityCards];
        const combos = window.getAllCombinations(remaining, 5 - communityCards.length);
        let bestEval = null;
        for (let combo of combos) {
            const all = [...communityCards, ...combo];
            const eval = this.evaluateHand(all);
            if (!bestEval || this.compareHands(eval, bestEval) > 0) bestEval = eval;
        }
        return bestEval;
    }

    getNuts(communityCards, deck) {
        return this.getBestPossibleHand(communityCards, deck);
    }

    getHandPotential(player, communityCards, deck, iterations = 500) {
        if (!player || player.folded) return 0;
        const currentEval = this.evaluatePlayerHand(player, communityCards);
        if (communityCards.length === 5) return currentEval ? this.getHandScore(currentEval) : 0;
        const remainingCards = deck ? deck.getCards() : new window.Deck().cards;
        const needed = 5 - communityCards.length;
        let totalScore = 0;
        const combos = window.getAllCombinations(remainingCards, needed);
        const sample = combos.length > iterations ? combos.slice(0, iterations) : combos;
        for (let combo of sample) {
            const simCommunity = [...communityCards, ...combo];
            const eval = this.evaluatePlayerHand(player, simCommunity);
            if (eval) totalScore += this.getHandScore(eval);
        }
        return totalScore / sample.length;
    }

    getHandRankDistribution(players, communityCards) {
        const distribution = {};
        for (let player of players) {
            const eval = this.evaluatePlayerHand(player, communityCards);
            const rankName = eval ? this.getHandRankName(eval) : 'Folded';
            distribution[player.name] = rankName;
        }
        return distribution;
    }

    getHandStrengthPercentile(evaluation, allPossibleHands) {
        if (!evaluation) return 0;
        const score = this.getHandScore(evaluation);
        let better = 0;
        let total = 0;
        for (let hand of allPossibleHands) {
            total++;
            if (this.getHandScore(hand) > score) better++;
        }
        return 1 - (better / total);
    }

    getEquityAgainstRange(player, communityCards, opponentRange, iterations = 1000) {
        let totalEquity = 0;
        for (let oppHand of opponentRange) {
            const equity = this.getHandEquity(player, communityCards, [oppHand], iterations);
            totalEquity += equity;
        }
        return totalEquity / opponentRange.length;
    }

    getHandVsRangeMatrix(playerHands, opponentRange, communityCards, iterations = 500) {
        const matrix = {};
        for (let hand of playerHands) {
            const equity = this.getEquityAgainstRange(hand, communityCards, opponentRange, iterations);
            matrix[hand.name] = equity;
        }
        return matrix;
    }

    getMinimumDefenseFrequency(potSize, betSize) {
        return betSize / (potSize + betSize);
    }

    getRequiredEquityToCall(potSize, callSize) {
        return callSize / (potSize + callSize);
    }

    getBluffSuccessProbability(betSize, potSize, foldEquity) {
        return foldEquity * potSize;
    }

    getExpectedValueCall(potSize, callSize, winProbability) {
        return winProbability * (potSize + callSize) - (1 - winProbability) * callSize;
    }

    getExpectedValueBluff(betSize, potSize, foldProbability) {
        return foldProbability * potSize + (1 - foldProbability) * (-betSize);
    }

    getOptimalBluffFrequency(betSize, potSize) {
        return betSize / (potSize + betSize);
    }

    getGTOCallFrequency(potSize, betSize) {
        return potSize / (potSize + betSize);
    }

    getMinimumRaiseSize(currentBet, lastRaise) {
        return currentBet + (lastRaise || window.getBigBlind());
    }

    getMaximumRaiseSize(playerStack, currentBet) {
        return playerStack + currentBet;
    }

    getRaiseAmountFromPot(potSize, multiplier = 1) {
        return Math.floor(potSize * multiplier);
    }

    getThreeBetSize(initialRaise, potSize) {
        return Math.floor(potSize * 1.2);
    }

    getFourBetSize(threeBetSize, potSize) {
        return Math.floor(potSize * 1.5);
    }

    getCBetSize(potSize, boardTexture) {
        if (boardTexture === 'dry') return Math.floor(potSize * 0.5);
        if (boardTexture === 'wet') return Math.floor(potSize * 0.75);
        return Math.floor(potSize * 0.66);
    }

    getCheckRaiseSize(potSize, betSize) {
        return Math.floor(potSize * 0.75);
    }

    evaluateBoardTexture(communityCards) {
        if (communityCards.length < 3) return 'preflop';
        const ranks = communityCards.map(c => c.rankValue);
        const suits = communityCards.map(c => c.suit);
        const isMonotone = new Set(suits).size === 1;
        const isPaired = new Set(ranks).size < ranks.length;
        if (isMonotone && isPaired) return 'very_wet';
        if (isMonotone || isPaired) return 'wet';
        let connectedness = 0;
        const sorted = [...ranks].sort((a,b)=>a-b);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] - sorted[i-1] === 1) connectedness++;
        }
        if (connectedness >= 2) return 'wet';
        return 'dry';
    }

    getHandStrengthCategory(evaluation) {
        if (!evaluation) return 'folded';
        const rank = evaluation.rank;
        if (rank >= 9) return 'very_strong';
        if (rank >= 7) return 'strong';
        if (rank >= 5) return 'medium';
        if (rank >= 3) return 'weak';
        return 'very_weak';
    }

    getHandStrengthPercentage(evaluation) {
        if (!evaluation) return 0;
        const rank = evaluation.rank;
        const rankValue = evaluation.rankValue;
        let base = 0;
        switch (rank) {
            case 10: base = 100; break;
            case 9: base = 95; break;
            case 8: base = 90; break;
            case 7: base = 80; break;
            case 6: base = 70; break;
            case 5: base = 60; break;
            case 4: base = 50; break;
            case 3: base = 40; break;
            case 2: base = 30; break;
            default: base = 20;
        }
        const rankMod = (rankValue - 2) / 12 * 5;
        return Math.min(100, base + rankMod);
    }

    getKickers(evaluation) {
        return evaluation ? evaluation.kickers : [];
    }

    getMainRankValue(evaluation) {
        return evaluation ? evaluation.rankValue : 0;
    }

    comparePlayerHands(playerA, playerB, communityCards) {
        const evalA = this.evaluatePlayerHand(playerA, communityCards);
        const evalB = this.evaluatePlayerHand(playerB, communityCards);
        return this.compareHands(evalA, evalB);
    }

    getWinnerMessage(winner, evaluation, potAmount) {
        if (!winner) return 'Ничья?';
        const handName = this.getHandRankName(evaluation);
        const description = this.getHandStrengthDescription(evaluation);
        return `${winner.name} выигрывает ${potAmount} с комбинацией ${handName} (${description})`;
    }

    getHandRankIcon(rank) {
        const icons = {
            10: '👑',
            9: '🌈',
            8: '🃏',
            7: '🏠',
            6: '💧',
            5: '📏',
            4: '🎲',
            3: '👥',
            2: '🃌',
            1: '🔝'
        };
        return icons[rank] || '?';
    }

    getHandStrengthEmoji(evaluation) {
        if (!evaluation) return '❓';
        const rank = evaluation.rank;
        if (rank === 10) return '🤴';
        if (rank === 9) return '🌟';
        if (rank === 8) return '💪';
        if (rank === 7) return '🏆';
        if (rank === 6) return '💦';
        if (rank === 5) return '📏';
        if (rank === 4) return '🎲';
        if (rank === 3) return '👥';
        if (rank === 2) return '🃌';
        return '🔢';
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheSize() {
        return this.cache.size;
    }

    setMaxCacheSize(size) {
        this.maxCacheSize = size;
    }

    getCacheKey(cards) {
        return cards.map(c => c.toString()).sort().join('|');
    }

    precomputeHands(communityCards, possibleCards) {
        const results = [];
        const combos = window.getAllCombinations(possibleCards, 2);
        for (let hand of combos) {
            const all = [...hand, ...communityCards];
            const eval = this.evaluateHand(all);
            results.push({ hand, evaluation: eval });
        }
        results.sort((a,b) => this.compareHands(b.evaluation, a.evaluation));
        return results;
    }

    getTopNHands(communityCards, possibleCards, n = 10) {
        const all = this.precomputeHands(communityCards, possibleCards);
        return all.slice(0, n);
    }

    getHandRankDistributionForRange(hands, communityCards) {
        const dist = {
            royal_flush: 0,
            straight_flush: 0,
            four_of_a_kind: 0,
            full_house: 0,
            flush: 0,
            straight: 0,
            three_of_a_kind: 0,
            two_pair: 0,
            one_pair: 0,
            high_card: 0
        };
        for (let hand of hands) {
            const all = [...hand, ...communityCards];
            const eval = this.evaluateHand(all);
            if (eval) {
                const rank = eval.rank;
                switch (rank) {
                    case 10: dist.royal_flush++; break;
                    case 9: dist.straight_flush++; break;
                    case 8: dist.four_of_a_kind++; break;
                    case 7: dist.full_house++; break;
                    case 6: dist.flush++; break;
                    case 5: dist.straight++; break;
                    case 4: dist.three_of_a_kind++; break;
                    case 3: dist.two_pair++; break;
                    case 2: dist.one_pair++; break;
                    default: dist.high_card++;
                }
            }
        }
        const total = hands.length;
        for (let key in dist) dist[key] = dist[key] / total;
        return dist;
    }
};

window.HandEvaluator = window.HandEvaluator;

console.log('controller_HandEvaluator.js loaded');
