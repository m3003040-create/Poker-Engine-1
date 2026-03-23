window.Pot = class Pot {
    constructor() {
        this.amount = 0;
        this.eligiblePlayers = [];
        this.sidePots = [];
        this.isMainPot = true;
    }

    addChips(amount, player = null) {
        this.amount += amount;
        if (player && !this.eligiblePlayers.includes(player)) {
            this.eligiblePlayers.push(player);
        }
    }

    addFromPlayer(player, amount) {
        if (player.chips >= amount) {
            player.chips -= amount;
            player.currentBet += amount;
            player.totalBetThisRound += amount;
            this.addChips(amount, player);
            return amount;
        }
        const allInAmount = player.chips;
        player.chips = 0;
        player.currentBet += allInAmount;
        player.totalBetThisRound += allInAmount;
        this.addChips(allInAmount, player);
        return allInAmount;
    }

    reset() {
        this.amount = 0;
        this.eligiblePlayers = [];
    }

    clear() {
        this.reset();
    }

    getAmount() {
        return this.amount;
    }

    getEligiblePlayers() {
        return [...this.eligiblePlayers];
    }

    isEligible(player) {
        return this.eligiblePlayers.includes(player);
    }

    addEligiblePlayer(player) {
        if (!this.eligiblePlayers.includes(player)) {
            this.eligiblePlayers.push(player);
        }
    }

    removeEligiblePlayer(player) {
        const index = this.eligiblePlayers.indexOf(player);
        if (index !== -1) this.eligiblePlayers.splice(index, 1);
    }

    distributeWinnings(winner) {
        if (winner instanceof Array) {
            const splitAmount = Math.floor(this.amount / winner.length);
            const remainder = this.amount % winner.length;
            for (let i = 0; i < winner.length; i++) {
                const add = splitAmount + (i < remainder ? 1 : 0);
                winner[i].addWinnings(add);
            }
        } else {
            winner.addWinnings(this.amount);
        }
        this.amount = 0;
        this.eligiblePlayers = [];
    }
};

window.MultiPot = class MultiPot {
    constructor() {
        this.mainPot = new window.Pot();
        this.sidePots = [];
        this.allPots = [];
    }

    reset() {
        this.mainPot.reset();
        this.sidePots = [];
        this.allPots = [];
    }

    clear() {
        this.reset();
    }

    addChipsToMainPot(amount, player) {
        this.mainPot.addChips(amount, player);
        this.updateAllPots();
    }

    createSidePots(players) {
        const activePlayers = players.filter(p => !p.folded);
        if (activePlayers.length === 0) return;
        const bets = activePlayers.map(p => p.currentBet);
        const uniqueBets = [...new Set(bets)].sort((a,b)=>a-b);
        let previousBet = 0;
        this.sidePots = [];
        for (let i = 0; i < uniqueBets.length; i++) {
            const bet = uniqueBets[i];
            const amountInPot = (bet - previousBet) * activePlayers.filter(p => p.currentBet >= bet).length;
            if (amountInPot > 0) {
                const sidePot = new window.Pot();
                sidePot.amount = amountInPot;
                sidePot.eligiblePlayers = activePlayers.filter(p => p.currentBet >= bet);
                sidePot.isMainPot = (i === 0);
                this.sidePots.push(sidePot);
            }
            previousBet = bet;
        }
        if (this.sidePots.length > 0) {
            this.mainPot = this.sidePots[0];
            this.sidePots = this.sidePots.slice(1);
        } else {
            this.mainPot.eligiblePlayers = activePlayers;
        }
        this.updateAllPots();
    }

    updateAllPots() {
        this.allPots = [this.mainPot, ...this.sidePots];
    }

    getTotalPot() {
        let total = this.mainPot.amount;
        for (let pot of this.sidePots) total += pot.amount;
        return total;
    }

    getMainPotAmount() {
        return this.mainPot.amount;
    }

    getSidePots() {
        return [...this.sidePots];
    }

    getAllPots() {
        return [...this.allPots];
    }

    distributeWinnings(winnersByPot) {
        for (let i = 0; i < this.allPots.length; i++) {
            const pot = this.allPots[i];
            const potWinners = winnersByPot[i] || [];
            if (potWinners.length > 0) {
                pot.distributeWinnings(potWinners);
            }
        }
    }

    getEligiblePlayersForPot(potIndex) {
        if (potIndex >= 0 && potIndex < this.allPots.length) {
            return this.allPots[potIndex].getEligiblePlayers();
        }
        return [];
    }

    static calculatePots(players) {
        const multiPot = new window.MultiPot();
        for (let p of players) {
            if (!p.folded && p.currentBet > 0) {
                multiPot.addChipsToMainPot(p.currentBet, p);
            }
        }
        multiPot.createSidePots(players);
        return multiPot;
    }
};

window.PotManager = class PotManager {
    constructor() {
        this.pots = [];
        this.currentPotIndex = 0;
        this.totalAmount = 0;
    }

    initialize() {
        this.pots = [];
        this.currentPotIndex = 0;
        this.totalAmount = 0;
        this.addPot();
    }

    addPot() {
        const newPot = new window.Pot();
        this.pots.push(newPot);
        return newPot;
    }

    getMainPot() {
        return this.pots[0] || null;
    }

    getSidePots() {
        return this.pots.slice(1);
    }

    getAllPots() {
        return [...this.pots];
    }

    addToPot(amount, potIndex = 0, player = null) {
        if (potIndex >= this.pots.length) return false;
        this.pots[potIndex].addChips(amount, player);
        this.totalAmount += amount;
        return true;
    }

    addFromPlayer(player, amount, potIndex = 0) {
        if (potIndex >= this.pots.length) return 0;
        const actualAmount = Math.min(amount, player.chips);
        if (actualAmount <= 0) return 0;
        player.chips -= actualAmount;
        player.currentBet += actualAmount;
        player.totalBetThisRound += actualAmount;
        this.pots[potIndex].addChips(actualAmount, player);
        this.totalAmount += actualAmount;
        return actualAmount;
    }

    createSidePotsFromPlayers(players) {
        const active = players.filter(p => !p.folded);
        const bets = active.map(p => p.currentBet);
        const uniqueSorted = [...new Set(bets)].sort((a,b)=>a-b);
        this.pots = [];
        let previousBet = 0;
        for (let i = 0; i < uniqueSorted.length; i++) {
            const bet = uniqueSorted[i];
            const eligible = active.filter(p => p.currentBet >= bet);
            const amount = (bet - previousBet) * eligible.length;
            if (amount > 0) {
                const pot = new window.Pot();
                pot.amount = amount;
                pot.eligiblePlayers = eligible;
                pot.isMainPot = (i === 0);
                this.pots.push(pot);
            }
            previousBet = bet;
        }
        this.totalAmount = this.pots.reduce((sum, p) => sum + p.amount, 0);
        return this.pots;
    }

    reset() {
        this.pots = [];
        this.currentPotIndex = 0;
        this.totalAmount = 0;
        this.addPot();
    }

    clear() {
        this.reset();
    }

    getTotal() {
        return this.totalAmount;
    }

    getPotAmount(potIndex) {
        if (potIndex >= 0 && potIndex < this.pots.length) return this.pots[potIndex].amount;
        return 0;
    }

    getPotCount() {
        return this.pots.length;
    }

    addToCurrentPot(amount, player = null) {
        return this.addToPot(amount, this.currentPotIndex, player);
    }

    nextPot() {
        if (this.currentPotIndex + 1 < this.pots.length) {
            this.currentPotIndex++;
            return true;
        }
        return false;
    }

    setCurrentPot(index) {
        if (index >= 0 && index < this.pots.length) {
            this.currentPotIndex = index;
            return true;
        }
        return false;
    }

    getCurrentPot() {
        return this.pots[this.currentPotIndex] || null;
    }

    distributeToWinners(winnersByPot) {
        for (let i = 0; i < this.pots.length; i++) {
            const pot = this.pots[i];
            const winners = winnersByPot[i] || [];
            if (winners.length > 0) {
                pot.distributeWinnings(winners);
            }
        }
        this.totalAmount = 0;
        this.pots = [];
        this.addPot();
    }

    getEligibleForPot(potIndex) {
        if (potIndex >= 0 && potIndex < this.pots.length) {
            return this.pots[potIndex].getEligiblePlayers();
        }
        return [];
    }

    isPotEligible(player, potIndex) {
        const pot = this.pots[potIndex];
        return pot ? pot.isEligible(player) : false;
    }

    getMainPotEligiblePlayers() {
        return this.getEligibleForPot(0);
    }

    getSidePotEligiblePlayers(potIndex) {
        return this.getEligibleForPot(potIndex + 1);
    }

    toString() {
        return this.pots.map((p, i) => `Pot${i}: ${p.amount} (${p.eligiblePlayers.length} players)`).join(', ');
    }

    toJSON() {
        return {
            pots: this.pots.map(p => ({ amount: p.amount, eligiblePlayerIds: p.eligiblePlayers.map(pl => pl.id) })),
            totalAmount: this.totalAmount,
            currentPotIndex: this.currentPotIndex
        };
    }

    static fromJSON(data, playersMap) {
        const manager = new window.PotManager();
        manager.pots = data.pots.map(potData => {
            const pot = new window.Pot();
            pot.amount = potData.amount;
            pot.eligiblePlayers = potData.eligiblePlayerIds.map(id => playersMap.get(id)).filter(p => p);
            return pot;
        });
        manager.totalAmount = data.totalAmount;
        manager.currentPotIndex = data.currentPotIndex;
        return manager;
    }

    static fromPlayers(players) {
        const manager = new window.PotManager();
        manager.createSidePotsFromPlayers(players);
        return manager;
    }
};

window.PotCalculator = class PotCalculator {
    static calculateMainPot(players) {
        const active = players.filter(p => !p.folded);
        if (active.length === 0) return 0;
        const minBet = Math.min(...active.map(p => p.currentBet));
        const contributors = active.filter(p => p.currentBet >= minBet);
        return minBet * contributors.length;
    }

    static calculateSidePots(players) {
        const active = players.filter(p => !p.folded);
        const bets = active.map(p => p.currentBet);
        const uniqueBets = [...new Set(bets)].sort((a,b)=>a-b);
        const sidePots = [];
        let previous = 0;
        for (let i = 0; i < uniqueBets.length; i++) {
            const bet = uniqueBets[i];
            const eligible = active.filter(p => p.currentBet >= bet);
            const amount = (bet - previous) * eligible.length;
            if (amount > 0) {
                sidePots.push({ amount, eligible: eligible.map(p => p.id) });
            }
            previous = bet;
        }
        return sidePots;
    }

    static getPotWinners(pot, players, communityCards, handEvaluator) {
        const eligible = pot.eligiblePlayers;
        if (eligible.length === 0) return [];
        if (eligible.length === 1) return eligible;
        const evaluated = [];
        for (let player of eligible) {
            const allCards = [...player.hand, ...communityCards];
            const evaluation = handEvaluator ? handEvaluator(allCards) : window.getBestHandFromCards(allCards);
            evaluated.push({ player, evaluation });
        }
        evaluated.sort((a,b) => {
            if (!a.evaluation) return 1;
            if (!b.evaluation) return -1;
            return b.evaluation.compareTo(a.evaluation);
        });
        const best = evaluated[0].evaluation;
        return evaluated.filter(e => e.evaluation && e.evaluation.compareTo(best) === 0).map(e => e.player);
    }

    static distributePots(pots, players, communityCards, handEvaluator) {
        const winnersByPot = [];
        for (let pot of pots) {
            const winners = window.PotCalculator.getPotWinners(pot, players, communityCards, handEvaluator);
            winnersByPot.push(winners);
        }
        for (let i = 0; i < pots.length; i++) {
            const pot = pots[i];
            const winners = winnersByPot[i];
            if (winners.length === 0) continue;
            const share = Math.floor(pot.amount / winners.length);
            const remainder = pot.amount % winners.length;
            for (let j = 0; j < winners.length; j++) {
                winners[j].addWinnings(share + (j < remainder ? 1 : 0));
            }
        }
        return winnersByPot;
    }
};

window.Pot = window.Pot;
window.MultiPot = window.MultiPot;
window.PotManager = window.PotManager;
window.PotCalculator = window.PotCalculator;

console.log('model_Pot.js loaded');
