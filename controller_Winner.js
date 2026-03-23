window.WinnerController = class WinnerController {
    constructor() {
        this.handEvaluator = new window.HandEvaluator();
        this.lastWinners = [];
        this.lastPots = [];
    }

    determineWinners(gameState) {
        if (!gameState) return [];
        const players = gameState.players.filter(p => !p.folded && p.isActive);
        if (players.length === 0) return [];
        if (players.length === 1) {
            const winner = players[0];
            const pot = gameState.potManager.getTotal();
            if (pot > 0) winner.addWinnings(pot);
            this.lastWinners = [winner];
            return [winner];
        }
        gameState.updatePot();
        const pots = gameState.potManager.getAllPots();
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
                const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
                evaluated.push({ player, evaluation: eval });
            }
            evaluated.sort((a, b) => {
                if (!a.evaluation) return 1;
                if (!b.evaluation) return -1;
                return b.evaluation.compareTo(a.evaluation);
            });
            const bestEval = evaluated[0].evaluation;
            const winners = evaluated.filter(e => e.evaluation && e.evaluation.compareTo(bestEval) === 0).map(e => e.player);
            winnersByPot.push(winners);
        }
        const allWinners = [];
        for (let i = 0; i < pots.length; i++) {
            const pot = pots[i];
            const winners = winnersByPot[i];
            if (winners.length === 0) continue;
            const share = Math.floor(pot.amount / winners.length);
            const remainder = pot.amount % winners.length;
            for (let j = 0; j < winners.length; j++) {
                const add = share + (j < remainder ? 1 : 0);
                winners[j].addWinnings(add);
                if (!allWinners.includes(winners[j])) allWinners.push(winners[j]);
            }
        }
        this.lastWinners = allWinners;
        this.lastPots = pots;
        return allWinners;
    }

    getWinnersWithHands(gameState) {
        if (!gameState) return [];
        const players = gameState.players.filter(p => !p.folded && p.isActive);
        const results = [];
        for (let player of players) {
            const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
            results.push({
                player: player,
                evaluation: eval,
                handRank: eval ? window.getHandRankName(eval.rank) : 'Folded',
                handDescription: eval ? window.getHandStrengthDescription(eval) : 'Сбросил',
                handScore: eval ? window.getHandScore(eval) : 0
            });
        }
        results.sort((a,b) => b.handScore - a.handScore);
        return results;
    }

    getWinnerMessage(winners, gameState) {
        if (!winners || winners.length === 0) return 'Победитель не определён';
        const pot = gameState.potManager.getTotal();
        if (winners.length === 1) {
            const winner = winners[0];
            const eval = this.handEvaluator.evaluatePlayerHand(winner, gameState.communityCards);
            const handName = eval ? window.getHandRankName(eval.rank) : 'Unknown';
            const handDesc = eval ? window.getHandStrengthDescription(eval) : '';
            return `${winner.name} выигрывает ${pot} с комбинацией ${handName} (${handDesc})`;
        } else {
            const names = winners.map(w => w.name).join(', ');
            const share = Math.floor(pot / winners.length);
            return `${names} делят банк ${pot} (по ${share} каждый)`;
        }
    }

    getSidePotWinners(gameState) {
        if (!gameState) return [];
        gameState.updatePot();
        const pots = gameState.potManager.getAllPots();
        const sidePotWinners = [];
        for (let i = 0; i < pots.length; i++) {
            const pot = pots[i];
            const eligible = pot.getEligiblePlayers();
            if (eligible.length === 0) {
                sidePotWinners.push({ potIndex: i, amount: pot.amount, winners: [] });
                continue;
            }
            if (eligible.length === 1) {
                sidePotWinners.push({ potIndex: i, amount: pot.amount, winners: [eligible[0]] });
                continue;
            }
            const evaluated = [];
            for (let player of eligible) {
                const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
                evaluated.push({ player, evaluation: eval });
            }
            evaluated.sort((a,b) => {
                if (!a.evaluation) return 1;
                if (!b.evaluation) return -1;
                return b.evaluation.compareTo(a.evaluation);
            });
            const bestEval = evaluated[0].evaluation;
            const winners = evaluated.filter(e => e.evaluation && e.evaluation.compareTo(bestEval) === 0).map(e => e.player);
            sidePotWinners.push({ potIndex: i, amount: pot.amount, winners: winners });
        }
        return sidePotWinners;
    }

    getWinningHandDescription(gameState) {
        const winners = this.determineWinners(gameState);
        if (!winners || winners.length === 0) return null;
        const winner = winners[0];
        const eval = this.handEvaluator.evaluatePlayerHand(winner, gameState.communityCards);
        if (!eval) return null;
        const cards = [...winner.hand, ...gameState.communityCards];
        const bestFive = window.getBestFiveCardHand(winner.hand, gameState.communityCards);
        return {
            player: winner.name,
            handRank: window.getHandRankName(eval.rank),
            handDescription: window.getHandStrengthDescription(eval),
            bestFiveCards: bestFive.map(c => c.toString()),
            allCards: cards.map(c => c.toString())
        };
    }

    getShowdownData(gameState) {
        const activePlayers = gameState.players.filter(p => !p.folded && p.isActive);
        const data = [];
        for (let player of activePlayers) {
            const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
            data.push({
                playerId: player.id,
                playerName: player.name,
                hand: player.hand.map(c => c.toString()),
                communityCards: gameState.communityCards.map(c => c.toString()),
                evaluation: eval,
                handRank: eval ? window.getHandRankName(eval.rank) : null,
                handRankValue: eval ? eval.rank : 0,
                handRankScore: eval ? window.getHandScore(eval) : 0,
                isWinner: this.lastWinners.includes(player)
            });
        }
        data.sort((a,b) => b.handRankScore - a.handRankScore);
        return data;
    }

    getBestHandAmongPlayers(gameState) {
        const active = gameState.players.filter(p => !p.folded && p.isActive);
        if (active.length === 0) return null;
        let bestPlayer = null;
        let bestEval = null;
        for (let player of active) {
            const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
            if (!bestEval || (eval && eval.compareTo(bestEval) > 0)) {
                bestEval = eval;
                bestPlayer = player;
            }
        }
        return { player: bestPlayer, evaluation: bestEval };
    }

    getHandRankingTable(gameState) {
        const active = gameState.players.filter(p => !p.folded && p.isActive);
        const table = [];
        for (let player of active) {
            const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
            table.push({
                rank: eval ? eval.rank : 0,
                player: player.name,
                hand: player.hand.map(c => c.toString()),
                handRankName: eval ? window.getHandRankName(eval.rank) : 'Folded',
                kickers: eval ? eval.kickers : []
            });
        }
        table.sort((a,b) => b.rank - a.rank);
        return table;
    }

    determineWinnerFromAllIn(gameState) {
        const allInPlayers = gameState.allInPlayers;
        if (allInPlayers.length === 0) return this.determineWinners(gameState);
        gameState.updatePot();
        const pots = gameState.potManager.getAllPots();
        const winnersByPot = [];
        for (let pot of pots) {
            const eligible = pot.getEligiblePlayers();
            if (eligible.length === 0) {
                winnersByPot.push([]);
                continue;
            }
            const evaluated = [];
            for (let player of eligible) {
                const eval = this.handEvaluator.evaluatePlayerHand(player, gameState.communityCards);
                evaluated.push({ player, evaluation: eval });
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
        const allWinners = [];
        for (let i = 0; i < pots.length; i++) {
            const pot = pots[i];
            const winners = winnersByPot[i];
            if (winners.length === 0) continue;
            const share = Math.floor(pot.amount / winners.length);
            const remainder = pot.amount % winners.length;
            for (let j = 0; j < winners.length; j++) {
                const add = share + (j < remainder ? 1 : 0);
                winners[j].addWinnings(add);
                if (!allWinners.includes(winners[j])) allWinners.push(winners[j]);
            }
        }
        return allWinners;
    }

    getWinnerStats(gameState) {
        const winners = this.determineWinners(gameState);
        const stats = {
            winners: winners.map(w => ({ id: w.id, name: w.name, chips: w.chips, winnings: w.totalWinnings })),
            totalPot: gameState.potManager.getTotal(),
            numberOfWinners: winners.length,
            isSplitPot: winners.length > 1,
            winningHands: []
        };
        for (let winner of winners) {
            const eval = this.handEvaluator.evaluatePlayerHand(winner, gameState.communityCards);
            stats.winningHands.push({
                player: winner.name,
                handRank: eval ? window.getHandRankName(eval.rank) : 'Unknown',
                handDescription: eval ? window.getHandStrengthDescription(eval) : ''
            });
        }
        return stats;
    }

    getPotDistribution(gameState) {
        gameState.updatePot();
        const pots = gameState.potManager.getAllPots();
        return pots.map((pot, idx) => ({
            index: idx,
            amount: pot.amount,
            eligiblePlayers: pot.getEligiblePlayers().map(p => ({ id: p.id, name: p.name, bet: p.currentBet })),
            isMainPot: idx === 0
        }));
    }

    getWinnersWithEquity(gameState, iterations = 1000) {
        const winners = this.determineWinners(gameState);
        const result = [];
        for (let winner of winners) {
            const equity = this.handEvaluator.getHandEquity(winner, gameState.communityCards, gameState.players.filter(p => p !== winner && !p.folded), iterations);
            result.push({
                player: winner,
                equity: equity,
                winnings: winner.totalWinnings - (winner.startChips || 0)
            });
        }
        return result;
    }

    getHandVsHandWinner(playerA, playerB, communityCards) {
        const evalA = this.handEvaluator.evaluatePlayerHand(playerA, communityCards);
        const evalB = this.handEvaluator.evaluatePlayerHand(playerB, communityCards);
        const cmp = evalA.compareTo(evalB);
        if (cmp > 0) return playerA;
        if (cmp < 0) return playerB;
        return null;
    }

    getTournamentWinner(players) {
        const active = players.filter(p => p.chips > 0);
        if (active.length === 0) return null;
        const sorted = [...active].sort((a,b) => b.chips - a.chips);
        return sorted[0];
    }

    getPlayerRanking(players) {
        return [...players].sort((a,b) => {
            if (b.chips !== a.chips) return b.chips - a.chips;
            return b.totalWinnings - a.totalWinnings;
        }).map((p, idx) => ({
            rank: idx + 1,
            player: p.name,
            chips: p.chips,
            winnings: p.totalWinnings,
            handsWon: p.handsWon,
            handsPlayed: p.handsPlayed
        }));
    }

    reset() {
        this.lastWinners = [];
        this.lastPots = [];
    }
};

window.WinnerController = window.WinnerController;

console.log('controller_Winner.js loaded');
