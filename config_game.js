window.DEFAULT_GAME_CONFIG = {
    playerCount: 6,
    startChips: 1000,
    smallBlind: 10,
    bigBlind: 20,
    ante: 0,
    maxPlayers: 6,
    minPlayers: 2,
    enableAnte: false,
    autoRebuy: false,
    rebuyThreshold: 100,
    rebuyAmount: 1000,
    maxRebuys: 3,
    timeBank: 30,
    tournamentMode: false,
    blindLevels: [
        { smallBlind: 10, bigBlind: 20, duration: 10 },
        { smallBlind: 15, bigBlind: 30, duration: 10 },
        { smallBlind: 25, bigBlind: 50, duration: 10 },
        { smallBlind: 50, bigBlind: 100, duration: 10 }
    ],
    currentBlindLevel: 0,
    blindIncreaseInterval: 10,
    maxRounds: 0,
    showDownDelay: 2000,
    autoNextRound: true,
    autoMuck: false,
    showMuckedCards: true,
    allowRabbitHunt: false
};

window.GAME_VARIANTS = {
    TEXAS_HOLDEM: 'texas_holdem',
    OMAHA: 'omaha',
    STUD: 'stud'
};

window.CURRENT_GAME_VARIANT = window.GAME_VARIANTS.TEXAS_HOLDEM;

window.getGameConfig = function() {
    const saved = window.loadFromStorage('gameConfig');
    if (saved) return { ...window.DEFAULT_GAME_CONFIG, ...saved };
    return { ...window.DEFAULT_GAME_CONFIG };
};

window.setGameConfig = function(newConfig) {
    const current = window.getGameConfig();
    const updated = { ...current, ...newConfig };
    window.saveToStorage('gameConfig', updated);
    return updated;
};

window.resetGameConfig = function() {
    window.saveToStorage('gameConfig', window.DEFAULT_GAME_CONFIG);
    return { ...window.DEFAULT_GAME_CONFIG };
};

window.getPlayerCount = function() {
    return window.getGameConfig().playerCount;
};

window.setPlayerCount = function(count) {
    const config = window.getGameConfig();
    if (count >= config.minPlayers && count <= config.maxPlayers) {
        config.playerCount = count;
        window.setGameConfig(config);
        return true;
    }
    return false;
};

window.getStartChips = function() {
    return window.getGameConfig().startChips;
};

window.getSmallBlind = function() {
    const config = window.getGameConfig();
    if (config.tournamentMode) {
        const level = config.blindLevels[config.currentBlindLevel] || config.blindLevels[0];
        return level.smallBlind;
    }
    return config.smallBlind;
};

window.getBigBlind = function() {
    const config = window.getGameConfig();
    if (config.tournamentMode) {
        const level = config.blindLevels[config.currentBlindLevel] || config.blindLevels[0];
        return level.bigBlind;
    }
    return config.bigBlind;
};

window.getAnte = function() {
    const config = window.getGameConfig();
    if (config.enableAnte) return config.ante;
    return 0;
};

window.getMinRaiseAmount = function(currentBet, lastRaise) {
    if (lastRaise > 0) return lastRaise;
    return window.getBigBlind();
};

window.getMaxRaiseAmount = function(playerChips, currentBet, playerCurrentBet) {
    return playerChips;
};

window.isValidRaise = function(raiseAmount, currentBet, minRaise, playerChips, playerCurrentBet) {
    const totalBet = playerCurrentBet + raiseAmount;
    if (totalBet > playerChips + playerCurrentBet) return false;
    if (totalBet < currentBet + minRaise && totalBet < playerChips + playerCurrentBet) return false;
    return true;
};

window.getDefaultRaiseSize = function(currentBet, minRaise, playerChips) {
    let raiseSize = currentBet + minRaise * 3;
    if (raiseSize > playerChips) raiseSize = playerChips;
    return raiseSize;
};

window.getPotOdds = function(potSize, callAmount) {
    if (callAmount <= 0) return Infinity;
    return potSize / callAmount;
};

window.isPotOddsGood = function(potSize, callAmount, winProbability) {
    const odds = window.getPotOdds(potSize, callAmount);
    return winProbability > (1 / (odds + 1));
};

window.getEffectiveStack = function(playerChips, currentBet, playerCurrentBet) {
    return playerChips + playerCurrentBet - currentBet;
};

window.isShortStack = function(playerChips, bigBlind) {
    return playerChips <= bigBlind * 10;
};

window.isMediumStack = function(playerChips, bigBlind) {
    return playerChips > bigBlind * 10 && playerChips <= bigBlind * 40;
};

window.isDeepStack = function(playerChips, bigBlind) {
    return playerChips > bigBlind * 40;
};

window.getMValue = function(playerChips, smallBlind, bigBlind, ante, playersAtTable) {
    let totalBlindsAndAnte = smallBlind + bigBlind + (ante * playersAtTable);
    if (totalBlindsAndAnte === 0) return Infinity;
    return playerChips / totalBlindsAndAnte;
};

window.getStackSizeCategory = function(mValue) {
    if (mValue < 5) return 'critical';
    if (mValue < 10) return 'low';
    if (mValue < 20) return 'medium';
    if (mValue < 40) return 'high';
    return 'very_high';
};

window.getNextBlindLevel = function() {
    const config = window.getGameConfig();
    if (!config.tournamentMode) return null;
    const nextLevel = config.currentBlindLevel + 1;
    if (nextLevel >= config.blindLevels.length) return null;
    return nextLevel;
};

window.increaseBlindLevel = function() {
    const config = window.getGameConfig();
    if (!config.tournamentMode) return false;
    const next = window.getNextBlindLevel();
    if (next !== null) {
        config.currentBlindLevel = next;
        window.setGameConfig(config);
        return true;
    }
    return false;
};

window.getCurrentBlindLevelName = function() {
    const config = window.getGameConfig();
    if (!config.tournamentMode) return 'Cash Game';
    const level = config.currentBlindLevel + 1;
    return `Уровень ${level}: ${window.getSmallBlind()}/${window.getBigBlind()}`;
};

window.getBlindLevelDuration = function() {
    const config = window.getGameConfig();
    if (!config.tournamentMode) return null;
    const level = config.blindLevels[config.currentBlindLevel];
    return level ? level.duration : null;
};

window.canRebuy = function(player) {
    const config = window.getGameConfig();
    if (!config.autoRebuy) return false;
    if (player.rebuysUsed >= config.maxRebuys) return false;
    if (player.chips <= config.rebuyThreshold) return true;
    return false;
};

window.performRebuy = function(player) {
    const config = window.getGameConfig();
    if (!window.canRebuy(player)) return false;
    player.chips += config.rebuyAmount;
    player.rebuysUsed = (player.rebuysUsed || 0) + 1;
    return true;
};

window.getMaxBet = function(playerChips, currentBet, playerCurrentBet) {
    return playerChips + playerCurrentBet;
};

window.getMinBet = function(currentBet, minRaise) {
    return currentBet + minRaise;
};

window.isHeadsUp = function(activePlayers) {
    return activePlayers === 2;
};

window.getPlayersForNextHand = function(players) {
    return players.filter(p => p.chips > 0);
};

window.canStartHand = function(players) {
    const active = players.filter(p => p.chips > 0).length;
    return active >= 2;
};

window.getButtonPosition = function(players, dealerIndex) {
    let idx = dealerIndex;
    while (true) {
        idx = (idx + 1) % players.length;
        if (players[idx].chips > 0) return idx;
        if (idx === dealerIndex) break;
    }
    return dealerIndex;
};

window.getSmallBlindPosition = function(players, buttonIndex) {
    let idx = (buttonIndex + 1) % players.length;
    while (players[idx].chips === 0) {
        idx = (idx + 1) % players.length;
        if (idx === buttonIndex) break;
    }
    return idx;
};

window.getBigBlindPosition = function(players, smallBlindIndex) {
    let idx = (smallBlindIndex + 1) % players.length;
    while (players[idx].chips === 0) {
        idx = (idx + 1) % players.length;
        if (idx === smallBlindIndex) break;
    }
    return idx;
};

window.getNextPlayerToAct = function(players, currentIndex, lastRaiser, isPreflop, buttonIndex) {
    let idx = (currentIndex + 1) % players.length;
    while (players[idx].folded || players[idx].chips === 0) {
        idx = (idx + 1) % players.length;
        if (idx === currentIndex) break;
    }
    return idx;
};

window.isBettingRoundComplete = function(players, currentBet, lastRaiser, buttonIndex) {
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        if (p.folded) continue;
        if (p.chips === 0 && p.currentBet === currentBet) continue;
        if (p.currentBet !== currentBet) return false;
    }
    return true;
};

window.getCurrentBetFromPlayers = function(players) {
    let max = 0;
    for (let p of players) {
        if (!p.folded && (p.currentBet || 0) > max) max = p.currentBet;
    }
    return max;
};

window.getTotalPot = function(pots) {
    if (!pots || !pots.length) return 0;
    return pots.reduce((sum, p) => sum + p.amount, 0);
};

window.getSidePots = function(players) {
    const allInPlayers = players.filter(p => !p.folded && p.chips === 0 && p.currentBet > 0);
    if (allInPlayers.length === 0) return [];
    const bets = players.filter(p => !p.folded).map(p => p.currentBet || 0);
    const uniqueBets = [...new Set(bets)].sort((a,b)=>a-b);
    const sidePots = [];
    let previousBet = 0;
    for (let bet of uniqueBets) {
        if (bet === previousBet) continue;
        const amount = (bet - previousBet) * players.filter(p => !p.folded && (p.currentBet || 0) >= bet).length;
        if (amount > 0) {
            sidePots.push({ amount, eligiblePlayers: players.filter(p => !p.folded && (p.currentBet || 0) >= bet) });
        }
        previousBet = bet;
    }
    return sidePots;
};

window.getMaxBounty = function() {
    return 0;
};

window.isTournamentMode = function() {
    return window.getGameConfig().tournamentMode;
};

window.setTournamentMode = function(enabled) {
    const config = window.getGameConfig();
    config.tournamentMode = enabled;
    window.setGameConfig(config);
};

window.getTimeBank = function() {
    return window.getGameConfig().timeBank;
};

window.getShowDownDelay = function() {
    return window.getGameConfig().showDownDelay;
};

window.isAutoNextRound = function() {
    return window.getGameConfig().autoNextRound;
};

window.isAutoMuck = function() {
    return window.getGameConfig().autoMuck;
};

window.isShowMuckedCards = function() {
    return window.getGameConfig().showMuckedCards;
};

window.isRabbitHuntAllowed = function() {
    return window.getGameConfig().allowRabbitHunt;
};

window.getMaxRounds = function() {
    return window.getGameConfig().maxRounds;
};

window.getBlindIncreaseInterval = function() {
    return window.getGameConfig().blindIncreaseInterval;
};

window.getCurrentBlindLevelIndex = function() {
    return window.getGameConfig().currentBlindLevel;
};

window.getBlindLevelsCount = function() {
    return window.getGameConfig().blindLevels.length;
};

window.isLastBlindLevel = function() {
    const config = window.getGameConfig();
    return config.currentBlindLevel >= config.blindLevels.length - 1;
};

window.getBlindLevels = function() {
    return [...window.getGameConfig().blindLevels];
};

window.getMinPlayers = function() {
    return window.getGameConfig().minPlayers;
};

window.getMaxPlayers = function() {
    return window.getGameConfig().maxPlayers;
};

window.isAnteEnabled = function() {
    return window.getGameConfig().enableAnte;
};

window.setAnteEnabled = function(enabled) {
    const config = window.getGameConfig();
    config.enableAnte = enabled;
    window.setGameConfig(config);
};

window.getAnteAmount = function() {
    return window.getGameConfig().ante;
};

window.setAnteAmount = function(amount) {
    const config = window.getGameConfig();
    config.ante = amount;
    window.setGameConfig(config);
};

window.getRebuyThreshold = function() {
    return window.getGameConfig().rebuyThreshold;
};

window.getRebuyAmount = function() {
    return window.getGameConfig().rebuyAmount;
};

window.getMaxRebuys = function() {
    return window.getGameConfig().maxRebuys;
};

window.isAutoRebuyEnabled = function() {
    return window.getGameConfig().autoRebuy;
};

window.setAutoRebuy = function(enabled) {
    const config = window.getGameConfig();
    config.autoRebuy = enabled;
    window.setGameConfig(config);
};

window.validateGameConfig = function(config) {
    const errors = [];
    if (config.playerCount < config.minPlayers || config.playerCount > config.maxPlayers) errors.push('Неверное количество игроков');
    if (config.startChips < 100) errors.push('Стартовые фишки должны быть не менее 100');
    if (config.smallBlind <= 0 || config.bigBlind <= 0) errors.push('Блайнды должны быть положительными');
    if (config.smallBlind >= config.bigBlind) errors.push('Малый блайнд должен быть меньше большого');
    if (config.ante < 0) errors.push('Анте не может быть отрицательным');
    if (config.maxRebuys < 0) errors.push('Максимум ребаев не может быть отрицательным');
    if (config.rebuyThreshold < 0) errors.push('Порог ребая не может быть отрицательным');
    if (config.rebuyAmount <= 0) errors.push('Сумма ребая должна быть положительной');
    if (config.timeBank <= 0) errors.push('Банк времени должен быть положительным');
    if (config.showDownDelay < 0) errors.push('Задержка шоудауна не может быть отрицательной');
    return errors;
};

window.getGameConfigSummary = function() {
    const config = window.getGameConfig();
    return {
        players: config.playerCount,
        startChips: config.startChips,
        blinds: `${config.smallBlind}/${config.bigBlind}`,
        ante: config.enableAnte ? config.ante : 'нет',
        tournament: config.tournamentMode,
        rebuys: config.autoRebuy ? `до ${config.maxRebuys}` : 'нет'
    };
};

window.DEFAULT_GAME_CONFIG = window.DEFAULT_GAME_CONFIG;
window.GAME_VARIANTS = window.GAME_VARIANTS;
window.CURRENT_GAME_VARIANT = window.CURRENT_GAME_VARIANT;
window.getGameConfig = window.getGameConfig;
window.setGameConfig = window.setGameConfig;
window.resetGameConfig = window.resetGameConfig;
window.getPlayerCount = window.getPlayerCount;
window.setPlayerCount = window.setPlayerCount;
window.getStartChips = window.getStartChips;
window.getSmallBlind = window.getSmallBlind;
window.getBigBlind = window.getBigBlind;
window.getAnte = window.getAnte;
window.getMinRaiseAmount = window.getMinRaiseAmount;
window.getMaxRaiseAmount = window.getMaxRaiseAmount;
window.isValidRaise = window.isValidRaise;
window.getDefaultRaiseSize = window.getDefaultRaiseSize;
window.getPotOdds = window.getPotOdds;
window.isPotOddsGood = window.isPotOddsGood;
window.getEffectiveStack = window.getEffectiveStack;
window.isShortStack = window.isShortStack;
window.isMediumStack = window.isMediumStack;
window.isDeepStack = window.isDeepStack;
window.getMValue = window.getMValue;
window.getStackSizeCategory = window.getStackSizeCategory;
window.getNextBlindLevel = window.getNextBlindLevel;
window.increaseBlindLevel = window.increaseBlindLevel;
window.getCurrentBlindLevelName = window.getCurrentBlindLevelName;
window.getBlindLevelDuration = window.getBlindLevelDuration;
window.canRebuy = window.canRebuy;
window.performRebuy = window.performRebuy;
window.getMaxBet = window.getMaxBet;
window.getMinBet = window.getMinBet;
window.isHeadsUp = window.isHeadsUp;
window.getPlayersForNextHand = window.getPlayersForNextHand;
window.canStartHand = window.canStartHand;
window.getButtonPosition = window.getButtonPosition;
window.getSmallBlindPosition = window.getSmallBlindPosition;
window.getBigBlindPosition = window.getBigBlindPosition;
window.getNextPlayerToAct = window.getNextPlayerToAct;
window.isBettingRoundComplete = window.isBettingRoundComplete;
window.getCurrentBetFromPlayers = window.getCurrentBetFromPlayers;
window.getTotalPot = window.getTotalPot;
window.getSidePots = window.getSidePots;
window.getMaxBounty = window.getMaxBounty;
window.isTournamentMode = window.isTournamentMode;
window.setTournamentMode = window.setTournamentMode;
window.getTimeBank = window.getTimeBank;
window.getShowDownDelay = window.getShowDownDelay;
window.isAutoNextRound = window.isAutoNextRound;
window.isAutoMuck = window.isAutoMuck;
window.isShowMuckedCards = window.isShowMuckedCards;
window.isRabbitHuntAllowed = window.isRabbitHuntAllowed;
window.getMaxRounds = window.getMaxRounds;
window.getBlindIncreaseInterval = window.getBlindIncreaseInterval;
window.getCurrentBlindLevelIndex = window.getCurrentBlindLevelIndex;
window.getBlindLevelsCount = window.getBlindLevelsCount;
window.isLastBlindLevel = window.isLastBlindLevel;
window.getBlindLevels = window.getBlindLevels;
window.getMinPlayers = window.getMinPlayers;
window.getMaxPlayers = window.getMaxPlayers;
window.isAnteEnabled = window.isAnteEnabled;
window.setAnteEnabled = window.setAnteEnabled;
window.getAnteAmount = window.getAnteAmount;
window.setAnteAmount = window.setAnteAmount;
window.getRebuyThreshold = window.getRebuyThreshold;
window.getRebuyAmount = window.getRebuyAmount;
window.getMaxRebuys = window.getMaxRebuys;
window.isAutoRebuyEnabled = window.isAutoRebuyEnabled;
window.setAutoRebuy = window.setAutoRebuy;
window.validateGameConfig = window.validateGameConfig;
window.getGameConfigSummary = window.getGameConfigSummary;

console.log('config_game.js loaded');
