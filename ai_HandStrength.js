window.AIHandStrength = class AIHandStrength {
    constructor() {
        this.preflopTable = null;
        this.monteCarloCache = new Map();
        this.equityCache = new Map();
        this.cacheSize = 5000;
        this.initPreflopTable();
    }

    initPreflopTable() {
        this.preflopTable = new Map();
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        for (let i = 0; i < ranks.length; i++) {
            for (let j = 0; j < ranks.length; j++) {
                const high = Math.max(i, j);
                const low = Math.min(i, j);
                const isPair = (i === j);
                const suited = true;
                const offsuit = false;
                const pairKey = `${ranks[high]}${ranks[high]}`;
                const suitedKey = `${ranks[high]}${ranks[low]}s`;
                const offsuitKey = `${ranks[high]}${ranks[low]}o`;
                if (isPair) {
                    let strength = 0;
                    if (high === 12) strength = 0.98;
                    else if (high === 11) strength = 0.95;
                    else if (high === 10) strength = 0.92;
                    else if (high === 9) strength = 0.88;
                    else if (high === 8) strength = 0.82;
                    else if (high === 7) strength = 0.75;
                    else if (high === 6) strength = 0.68;
                    else if (high === 5) strength = 0.6;
                    else if (high === 4) strength = 0.52;
                    else if (high === 3) strength = 0.45;
                    else if (high === 2) strength = 0.38;
                    else if (high === 1) strength = 0.32;
                    else strength = 0.25;
                    this.preflopTable.set(pairKey, strength);
                } else {
                    const gap = high - low;
                    let suitedStrength = 0;
                    let offsuitStrength = 0;
                    if (high === 12 && low === 11) { suitedStrength = 0.94; offsuitStrength = 0.92; }
                    else if (high === 12 && low === 10) { suitedStrength = 0.91; offsuitStrength = 0.88; }
                    else if (high === 12 && low === 9) { suitedStrength = 0.87; offsuitStrength = 0.82; }
                    else if (high === 12 && low === 8) { suitedStrength = 0.83; offsuitStrength = 0.76; }
                    else if (high === 12 && low === 7) { suitedStrength = 0.79; offsuitStrength = 0.70; }
                    else if (high === 12 && low === 6) { suitedStrength = 0.74; offsuitStrength = 0.64; }
                    else if (high === 12 && low === 5) { suitedStrength = 0.69; offsuitStrength = 0.58; }
                    else if (high === 12 && low === 4) { suitedStrength = 0.64; offsuitStrength = 0.52; }
                    else if (high === 12 && low === 3) { suitedStrength = 0.59; offsuitStrength = 0.46; }
                    else if (high === 12 && low === 2) { suitedStrength = 0.54; offsuitStrength = 0.40; }
                    else if (high === 11 && low === 10) { suitedStrength = 0.86; offsuitStrength = 0.82; }
                    else if (high === 11 && low === 9) { suitedStrength = 0.81; offsuitStrength = 0.75; }
                    else if (high === 11 && low === 8) { suitedStrength = 0.76; offsuitStrength = 0.68; }
                    else if (high === 11 && low === 7) { suitedStrength = 0.71; offsuitStrength = 0.62; }
                    else if (high === 11 && low === 6) { suitedStrength = 0.66; offsuitStrength = 0.56; }
                    else if (high === 11 && low === 5) { suitedStrength = 0.61; offsuitStrength = 0.50; }
                    else if (high === 11 && low === 4) { suitedStrength = 0.56; offsuitStrength = 0.44; }
                    else if (high === 11 && low === 3) { suitedStrength = 0.51; offsuitStrength = 0.38; }
                    else if (high === 11 && low === 2) { suitedStrength = 0.46; offsuitStrength = 0.32; }
                    else if (high === 10 && low === 9) { suitedStrength = 0.78; offsuitStrength = 0.70; }
                    else if (high === 10 && low === 8) { suitedStrength = 0.72; offsuitStrength = 0.62; }
                    else if (high === 10 && low === 7) { suitedStrength = 0.66; offsuitStrength = 0.54; }
                    else if (high === 10 && low === 6) { suitedStrength = 0.60; offsuitStrength = 0.48; }
                    else if (high === 10 && low === 5) { suitedStrength = 0.55; offsuitStrength = 0.42; }
                    else if (high === 10 && low === 4) { suitedStrength = 0.50; offsuitStrength = 0.36; }
                    else if (high === 10 && low === 3) { suitedStrength = 0.45; offsuitStrength = 0.30; }
                    else if (high === 10 && low === 2) { suitedStrength = 0.40; offsuitStrength = 0.24; }
                    else {
                        const base = 0.3 - gap * 0.03;
                        suitedStrength = Math.max(0.15, base + 0.08);
                        offsuitStrength = Math.max(0.10, base);
                    }
                    this.preflopTable.set(suitedKey, suitedStrength);
                    this.preflopTable.set(offsuitKey, offsuitStrength);
                }
            }
        }
    }

    getPreflopStrength(card1, card2) {
        const r1 = card1.rank;
        const r2 = card2.rank;
        const isPair = (r1 === r2);
        const isSuited = (card1.suit === card2.suit);
        const rankValues = [window.getRankValue(r1), window.getRankValue(r2)];
        const highRank = Math.max(rankValues[0], rankValues[1]);
        const lowRank = Math.min(rankValues[0], rankValues[1]);
        const highSym = window.getRankSymbol(highRank);
        const lowSym = window.getRankSymbol(lowRank);
        let key;
        if (isPair) {
            key = `${highSym}${highSym}`;
        } else if (isSuited) {
            key = `${highSym}${lowSym}s`;
        } else {
            key = `${highSym}${lowSym}o`;
        }
        const strength = this.preflopTable.get(key);
        if (strength !== undefined) return strength;
        const base = 0.3 - (Math.abs(rankValues[0] - rankValues[1]) * 0.03);
        if (isSuited) return Math.min(0.85, base + 0.08);
        return Math.min(0.8, base);
    }

    getPostflopStrength(playerHand, communityCards) {
        const allCards = [...playerHand, ...communityCards];
        const evaluation = window.getBestHandFromCards(allCards);
        if (!evaluation) return 0;
        const rank = evaluation.rank;
        if (rank === 10) return 1.0;
        if (rank === 9) return 0.98;
        if (rank === 8) return 0.95;
        if (rank === 7) return 0.9;
        if (rank === 6) return 0.8;
        if (rank === 5) return 0.7;
        if (rank === 4) return 0.6;
        if (rank === 3) return 0.45;
        if (rank === 2) return 0.3;
        return 0.2;
    }

    getHandStrength(playerHand, communityCards, gamePhase) {
        if (gamePhase === window.GamePhase.PREFLOP) {
            return this.getPreflopStrength(playerHand[0], playerHand[1]);
        } else {
            return this.getPostflopStrength(playerHand, communityCards);
        }
    }

    async monteCarloEquity(playerHand, communityCards, opponents, iterations = 1000) {
        const cacheKey = this.getEquityCacheKey(playerHand, communityCards, opponents.length);
        if (this.equityCache.has(cacheKey)) return this.equityCache.get(cacheKey);
        const deck = new window.Deck();
        const knownCards = [...playerHand, ...communityCards];
        for (let card of knownCards) deck.removeCard(card);
        let wins = 0;
        let ties = 0;
        const iterationsToRun = Math.min(iterations, deck.size() / 2);
        for (let i = 0; i < iterationsToRun; i++) {
            const simDeck = deck.clone();
            simDeck.shuffle();
            const simCommunity = [...communityCards];
            const need = 5 - communityCards.length;
            for (let j = 0; j < need; j++) simCommunity.push(simDeck.draw());
            const myEval = window.getBestHandFromCards([...playerHand, ...simCommunity]);
            let bestOppEval = null;
            for (let opp of opponents) {
                if (opp.folded) continue;
                const oppCards = [simDeck.draw(), simDeck.draw()];
                const oppEval = window.getBestHandFromCards([...oppCards, ...simCommunity]);
                if (!bestOppEval || oppEval.compareTo(bestOppEval) > 0) bestOppEval = oppEval;
            }
            if (!bestOppEval) {
                wins++;
            } else {
                const cmp = myEval.compareTo(bestOppEval);
                if (cmp > 0) wins++;
                else if (cmp === 0) ties++;
            }
        }
        const equity = (wins + ties * 0.5) / iterationsToRun;
        if (this.equityCache.size >= this.cacheSize) {
            const firstKey = this.equityCache.keys().next().value;
            this.equityCache.delete(firstKey);
        }
        this.equityCache.set(cacheKey, equity);
        return equity;
    }

    getEquityCacheKey(hand, community, oppCount) {
        const handKey = hand.map(c => c.toString()).sort().join('');
        const commKey = community.map(c => c.toString()).sort().join('');
        return `${handKey}|${commKey}|${oppCount}`;
    }

    getHandVsRangeEquity(playerHand, communityCards, opponentRange, iterations = 500) {
        let totalEquity = 0;
        let count = 0;
        for (let oppHand of opponentRange) {
            const equity = this.getHandVsHandEquity(playerHand, oppHand, communityCards, iterations);
            totalEquity += equity;
            count++;
        }
        return count > 0 ? totalEquity / count : 0;
    }

    getHandVsHandEquity(handA, handB, communityCards, iterations = 500) {
        const deck = new window.Deck();
        const known = [...handA, ...handB, ...communityCards];
        for (let card of known) deck.removeCard(card);
        let winsA = 0, winsB = 0, ties = 0;
        const needed = 5 - communityCards.length;
        for (let i = 0; i < iterations; i++) {
            const simDeck = deck.clone();
            simDeck.shuffle();
            const simCommunity = [...communityCards];
            for (let j = 0; j < needed; j++) simCommunity.push(simDeck.draw());
            const evalA = window.getBestHandFromCards([...handA, ...simCommunity]);
            const evalB = window.getBestHandFromCards([...handB, ...simCommunity]);
            const cmp = evalA.compareTo(evalB);
            if (cmp > 0) winsA++;
            else if (cmp < 0) winsB++;
            else ties++;
        }
        const total = iterations;
        return { equityA: (winsA + ties * 0.5) / total, equityB: (winsB + ties * 0.5) / total };
    }

    getHandStrengthPercentile(hand, communityCards, allPossibleOpponents) {
        const handStrength = this.getHandStrength(hand, communityCards, communityCards.length === 0 ? window.GamePhase.PREFLOP : window.GamePhase.RIVER);
        let better = 0;
        let total = 0;
        for (let oppHand of allPossibleOpponents) {
            total++;
            const oppStrength = this.getHandStrength(oppHand, communityCards, communityCards.length === 0 ? window.GamePhase.PREFLOP : window.GamePhase.RIVER);
            if (oppStrength > handStrength) better++;
        }
        return 1 - (better / total);
    }

    getDrawStrength(playerHand, communityCards) {
        if (communityCards.length < 3) return 0;
        const allCards = [...playerHand, ...communityCards];
        const currentEval = window.getBestHandFromCards(allCards);
        if (currentEval.rank >= 4) return 1;
        const flushDraw = this.hasFlushDraw(playerHand, communityCards);
        const straightDraw = this.hasStraightDraw(playerHand, communityCards);
        let strength = 0;
        if (flushDraw) strength += 0.4;
        if (straightDraw) strength += 0.3;
        if (flushDraw && straightDraw) strength += 0.2;
        return Math.min(0.9, strength);
    }

    hasFlushDraw(playerHand, communityCards) {
        const allSuits = [...playerHand, ...communityCards].map(c => c.suit);
        const counts = { '♥':0, '♦':0, '♣':0, '♠':0 };
        for (let s of allSuits) counts[s]++;
        const maxSuit = Math.max(...Object.values(counts));
        return maxSuit === 4;
    }

    hasStraightDraw(playerHand, communityCards) {
        const allRanks = [...playerHand, ...communityCards].map(c => c.rankValue);
        const uniqueSorted = [...new Set(allRanks)].sort((a,b)=>a-b);
        for (let i = 0; i <= uniqueSorted.length - 4; i++) {
            let gaps = 0;
            for (let j = 1; j < 4; j++) {
                if (uniqueSorted[i+j] !== uniqueSorted[i+j-1] + 1) gaps++;
            }
            if (gaps <= 1) return true;
        }
        if (uniqueSorted.includes(14) && uniqueSorted.includes(2) && uniqueSorted.includes(3) && uniqueSorted.includes(4)) return true;
        if (uniqueSorted.includes(14) && uniqueSorted.includes(2) && uniqueSorted.includes(3) && uniqueSorted.includes(5)) return true;
        return false;
    }

    getImpliedOdds(playerHand, communityCards, currentBet, potSize, stackSize) {
        const drawStrength = this.getDrawStrength(playerHand, communityCards);
        if (drawStrength === 0) return 0;
        const toCall = Math.max(0, currentBet - (playerHand.currentBet || 0));
        if (toCall <= 0) return 1;
        const directOdds = potSize / toCall;
        const impliedMultiplier = Math.min(2, stackSize / potSize);
        return directOdds * impliedMultiplier * drawStrength;
    }

    getFoldEquity(player, betSize, potSize, opponents) {
        let foldProb = 0;
        for (let opp of opponents) {
            if (opp.folded) continue;
            let prob = 0.5;
            if (opp.isAI && opp.ai) {
                const tightness = opp.ai.getOpponentTightness ? opp.ai.getOpponentTightness(player.id) : 0.5;
                prob = tightness;
            }
            foldProb += prob;
        }
        foldProb = foldProb / opponents.length;
        return foldProb * potSize;
    }

    getExpectedValueCall(playerHand, communityCards, currentBet, potSize, opponents) {
        const toCall = Math.max(0, currentBet - (playerHand.currentBet || 0));
        if (toCall <= 0) return 0;
        const equity = this.getHandVsRangeEquity(playerHand, communityCards, opponents, 200);
        const ev = equity * (potSize + toCall) - (1 - equity) * toCall;
        return ev;
    }

    getExpectedValueRaise(playerHand, communityCards, currentBet, raiseAmount, potSize, opponents) {
        const toCall = Math.max(0, currentBet - (playerHand.currentBet || 0));
        const totalBet = toCall + raiseAmount;
        const equity = this.getHandVsRangeEquity(playerHand, communityCards, opponents, 200);
        const foldEquity = this.getFoldEquity(playerHand, raiseAmount, potSize, opponents);
        const evWhenCalled = equity * (potSize + totalBet) - (1 - equity) * totalBet;
        const ev = foldEquity + (1 - foldEquity) * evWhenCalled;
        return ev;
    }

    getOptimalBetSize(playerHand, communityCards, potSize, stackSize, opponents) {
        const strength = this.getHandStrength(playerHand, communityCards, communityCards.length === 0 ? window.GamePhase.PREFLOP : window.GamePhase.RIVER);
        if (strength > 0.8) {
            return Math.min(stackSize, potSize);
        } else if (strength > 0.6) {
            return Math.floor(potSize * 0.66);
        } else if (strength > 0.4) {
            return Math.floor(potSize * 0.5);
        } else if (strength > 0.2 && this.hasFlushDraw(playerHand, communityCards)) {
            return Math.floor(potSize * 0.5);
        } else {
            return Math.floor(potSize * 0.33);
        }
    }

    getMinDefenseFrequency(potSize, betSize) {
        return betSize / (potSize + betSize);
    }

    getAlpha(betSize, potSize) {
        return betSize / (potSize + betSize);
    }

    getBluffToValueRatio(betSize, potSize) {
        const alpha = this.getAlpha(betSize, potSize);
        return alpha / (1 - alpha);
    }

    getHandRangeFromStrength(minStrength) {
        const range = [];
        for (let [key, strength] of this.preflopTable) {
            if (strength >= minStrength) {
                range.push(key);
            }
        }
        return range;
    }

    getTopNHands(n) {
        const sorted = Array.from(this.preflopTable.entries()).sort((a,b) => b[1] - a[1]);
        return sorted.slice(0, n).map(e => ({ hand: e[0], strength: e[1] }));
    }

    getHandCategory(handStrength) {
        if (handStrength >= 0.9) return 'premium';
        if (handStrength >= 0.7) return 'strong';
        if (handStrength >= 0.5) return 'playable';
        if (handStrength >= 0.3) return 'speculative';
        return 'weak';
    }

    clearCache() {
        this.monteCarloCache.clear();
        this.equityCache.clear();
    }

    setCacheSize(size) {
        this.cacheSize = size;
    }
};

window.AIHandStrength = window.AIHandStrength;

console.log('ai_HandStrength.js loaded');
