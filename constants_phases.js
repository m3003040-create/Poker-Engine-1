window.GamePhase = {
    PREFLOP: 'preflop',
    FLOP: 'flop',
    TURN: 'turn',
    RIVER: 'river',
    SHOWDOWN: 'showdown'
};

window.PhaseOrder = [
    window.GamePhase.PREFLOP,
    window.GamePhase.FLOP,
    window.GamePhase.TURN,
    window.GamePhase.RIVER,
    window.GamePhase.SHOWDOWN
];

window.getNextPhase = function(currentPhase) {
    const index = window.PhaseOrder.indexOf(currentPhase);
    if (index === -1 || index === window.PhaseOrder.length - 1) return null;
    return window.PhaseOrder[index + 1];
};

window.getPreviousPhase = function(currentPhase) {
    const index = window.PhaseOrder.indexOf(currentPhase);
    if (index <= 0) return null;
    return window.PhaseOrder[index - 1];
};

window.isShowdownPhase = function(phase) {
    return phase === window.GamePhase.SHOWDOWN;
};

window.isPreflopPhase = function(phase) {
    return phase === window.GamePhase.PREFLOP;
};

window.isFlopPhase = function(phase) {
    return phase === window.GamePhase.FLOP;
};

window.isTurnPhase = function(phase) {
    return phase === window.GamePhase.TURN;
};

window.isRiverPhase = function(phase) {
    return phase === window.GamePhase.RIVER;
};

window.isCommunityCardPhase = function(phase) {
    return phase !== window.GamePhase.PREFLOP && phase !== window.GamePhase.SHOWDOWN;
};

window.doesPhaseDealCommunityCards = function(phase) {
    return phase === window.GamePhase.FLOP ||
           phase === window.GamePhase.TURN ||
           phase === window.GamePhase.RIVER;
};

window.getCommunityCardsToDeal = function(phase) {
    switch (phase) {
        case window.GamePhase.FLOP: return 3;
        case window.GamePhase.TURN: return 1;
        case window.GamePhase.RIVER: return 1;
        default: return 0;
    }
};

window.getTotalCommunityCardsByPhase = function(phase) {
    const totals = {
        [window.GamePhase.PREFLOP]: 0,
        [window.GamePhase.FLOP]: 3,
        [window.GamePhase.TURN]: 4,
        [window.GamePhase.RIVER]: 5,
        [window.GamePhase.SHOWDOWN]: 5
    };
    return totals[phase] || 0;
};

window.getPhaseDisplayName = function(phase) {
    const names = {
        [window.GamePhase.PREFLOP]: 'Префлоп',
        [window.GamePhase.FLOP]: 'Флоп',
        [window.GamePhase.TURN]: 'Тёрн',
        [window.GamePhase.RIVER]: 'Ривер',
        [window.GamePhase.SHOWDOWN]: 'Шоудаун'
    };
    return names[phase] || phase;
};

window.getPhaseShortName = function(phase) {
    const short = {
        [window.GamePhase.PREFLOP]: 'PF',
        [window.GamePhase.FLOP]: 'FL',
        [window.GamePhase.TURN]: 'TU',
        [window.GamePhase.RIVER]: 'RI',
        [window.GamePhase.SHOWDOWN]: 'SD'
    };
    return short[phase] || phase;
};

window.getPhaseIndex = function(phase) {
    return window.PhaseOrder.indexOf(phase);
};

window.getPhaseByIndex = function(index) {
    if (index >= 0 && index < window.PhaseOrder.length) return window.PhaseOrder[index];
    return null;
};

window.isValidPhase = function(phase) {
    return window.PhaseOrder.includes(phase);
};

window.getPhaseAfterBettingRound = function(phase) {
    if (phase === window.GamePhase.PREFLOP) return window.GamePhase.FLOP;
    if (phase === window.GamePhase.FLOP) return window.GamePhase.TURN;
    if (phase === window.GamePhase.TURN) return window.GamePhase.RIVER;
    if (phase === window.GamePhase.RIVER) return window.GamePhase.SHOWDOWN;
    return null;
};

window.getPhaseBeforeShowdown = function(phase) {
    if (phase === window.GamePhase.SHOWDOWN) return window.GamePhase.RIVER;
    if (phase === window.GamePhase.RIVER) return window.GamePhase.TURN;
    if (phase === window.GamePhase.TURN) return window.GamePhase.FLOP;
    if (phase === window.GamePhase.FLOP) return window.GamePhase.PREFLOP;
    return null;
};

window.getPhasesUntilShowdown = function(startPhase) {
    const startIndex = window.getPhaseIndex(startPhase);
    if (startIndex === -1) return [];
    return window.PhaseOrder.slice(startIndex);
};

window.getPhasesRemaining = function(currentPhase) {
    const currentIndex = window.getPhaseIndex(currentPhase);
    if (currentIndex === -1) return [];
    return window.PhaseOrder.slice(currentIndex + 1);
};

window.isLastBettingPhase = function(phase) {
    return phase === window.GamePhase.RIVER;
};

window.isFirstBettingPhase = function(phase) {
    return phase === window.GamePhase.PREFLOP;
};

window.getPhaseBlindLevel = function(phase) {
    const levels = {
        [window.GamePhase.PREFLOP]: 1,
        [window.GamePhase.FLOP]: 2,
        [window.GamePhase.TURN]: 3,
        [window.GamePhase.RIVER]: 4,
        [window.GamePhase.SHOWDOWN]: 5
    };
    return levels[phase] || 0;
};

window.getPhaseBettingRoundName = function(phase) {
    if (phase === window.GamePhase.SHOWDOWN) return null;
    return window.getPhaseDisplayName(phase);
};

window.getPhaseRequiredCommunityCards = function(phase) {
    return window.getCommunityCardsToDeal(phase);
};

window.getPhaseCommunityCardsNeeded = function(phase) {
    return window.getTotalCommunityCardsByPhase(phase);
};

window.getPhaseFromCommunityCardCount = function(count) {
    if (count === 0) return window.GamePhase.PREFLOP;
    if (count === 3) return window.GamePhase.FLOP;
    if (count === 4) return window.GamePhase.TURN;
    if (count === 5) return window.GamePhase.RIVER;
    return null;
};

window.isPhaseCompleted = function(phase, communityCardsCount, bettingCompleted, allPlayersActed) {
    const neededCards = window.getTotalCommunityCardsByPhase(phase);
    if (phase === window.GamePhase.SHOWDOWN) return true;
    if (communityCardsCount < neededCards) return false;
    if (!bettingCompleted) return false;
    if (!allPlayersActed) return false;
    return true;
};

window.getPhasePriority = function(phase) {
    const priorities = {
        [window.GamePhase.PREFLOP]: 0,
        [window.GamePhase.FLOP]: 1,
        [window.GamePhase.TURN]: 2,
        [window.GamePhase.RIVER]: 3,
        [window.GamePhase.SHOWDOWN]: 4
    };
    return priorities[phase] || 0;
};

window.comparePhases = function(phaseA, phaseB) {
    const prioA = window.getPhasePriority(phaseA);
    const prioB = window.getPhasePriority(phaseB);
    if (prioA === prioB) return 0;
    return prioA > prioB ? 1 : -1;
};

window.isPhaseAfter = function(phaseA, phaseB) {
    return window.getPhasePriority(phaseA) > window.getPhasePriority(phaseB);
};

window.isPhaseBefore = function(phaseA, phaseB) {
    return window.getPhasePriority(phaseA) < window.getPhasePriority(phaseB);
};

window.getPhaseByBettingRoundNumber = function(round) {
    if (round === 1) return window.GamePhase.PREFLOP;
    if (round === 2) return window.GamePhase.FLOP;
    if (round === 3) return window.GamePhase.TURN;
    if (round === 4) return window.GamePhase.RIVER;
    return null;
};

window.getBettingRoundNumber = function(phase) {
    const rounds = {
        [window.GamePhase.PREFLOP]: 1,
        [window.GamePhase.FLOP]: 2,
        [window.GamePhase.TURN]: 3,
        [window.GamePhase.RIVER]: 4
    };
    return rounds[phase] || 0;
};

window.getPhaseDealDescription = function(phase) {
    const count = window.getCommunityCardsToDeal(phase);
    if (count === 0) return '';
    if (count === 3) return 'Раздаются 3 общие карты (флоп)';
    if (count === 1) return `Раздаётся ${window.getPhaseDisplayName(phase)}`;
    return '';
};

window.getPhaseActionDescription = function(phase) {
    return `Этап: ${window.getPhaseDisplayName(phase)}`;
};

window.getPhaseIcon = function(phase) {
    const icons = {
        [window.GamePhase.PREFLOP]: '🃟',
        [window.GamePhase.FLOP]: '🃏',
        [window.GamePhase.TURN]: '🃑',
        [window.GamePhase.RIVER]: '🃒',
        [window.GamePhase.SHOWDOWN]: '🏆'
    };
    return icons[phase] || '?';
};

window.getPhaseColor = function(phase) {
    const colors = {
        [window.GamePhase.PREFLOP]: '#8bc34a',
        [window.GamePhase.FLOP]: '#ffa726',
        [window.GamePhase.TURN]: '#42a5f5',
        [window.GamePhase.RIVER]: '#ef5350',
        [window.GamePhase.SHOWDOWN]: '#ffd966'
    };
    return colors[phase] || '#cccccc';
};

window.formatPhaseWithIcon = function(phase) {
    return `${window.getPhaseIcon(phase)} ${window.getPhaseDisplayName(phase)}`;
};

window.getNextPhaseAfterAllIn = function(currentPhase) {
    return window.getPhaseAfterBettingRound(currentPhase);
};

window.shouldProceedToNextPhase = function(currentPhase, playersRemaining, allPlayersAllIn) {
    if (playersRemaining === 1) return true;
    if (allPlayersAllIn) return true;
    if (currentPhase === window.GamePhase.RIVER) return true;
    return false;
};

window.isFinalPhaseBeforeShowdown = function(phase) {
    return phase === window.GamePhase.RIVER;
};

window.getPhaseStartMessage = function(phase) {
    const messages = {
        [window.GamePhase.PREFLOP]: 'Начинается префлоп. Раздача карт.',
        [window.GamePhase.FLOP]: 'Флоп: три общие карты на стол.',
        [window.GamePhase.TURN]: 'Тёрн: четвёртая общая карта.',
        [window.GamePhase.RIVER]: 'Ривер: пятая общая карта.',
        [window.GamePhase.SHOWDOWN]: 'Шоудаун! Определение победителя.'
    };
    return messages[phase] || '';
};

window.getAllPhases = function() {
    return [...window.PhaseOrder];
};

window.getAllBettingPhases = function() {
    return window.PhaseOrder.filter(p => p !== window.GamePhase.SHOWDOWN);
};

window.getPhaseSequenceString = function() {
    return window.PhaseOrder.map(p => window.getPhaseDisplayName(p)).join(' → ');
};

window.isPhaseValidForAction = function(phase) {
    return phase !== window.GamePhase.SHOWDOWN;
};

window.getPhaseTimeoutDuration = function(phase) {
    const durations = {
        [window.GamePhase.PREFLOP]: 30,
        [window.GamePhase.FLOP]: 25,
        [window.GamePhase.TURN]: 25,
        [window.GamePhase.RIVER]: 20,
        [window.GamePhase.SHOWDOWN]: 10
    };
    return durations[phase] || 30;
};

window.getPhaseDefaultRaiseAmount = function(phase, bigBlind) {
    const base = bigBlind || 20;
    if (phase === window.GamePhase.PREFLOP) return base * 2;
    if (phase === window.GamePhase.FLOP) return base * 2;
    if (phase === window.GamePhase.TURN) return base * 2;
    if (phase === window.GamePhase.RIVER) return base * 2;
    return base;
};

window.getPhaseMinRaise = function(phase, lastRaise) {
    return lastRaise || 20;
};

window.GamePhase = window.GamePhase;
window.PhaseOrder = window.PhaseOrder;
window.getNextPhase = window.getNextPhase;
window.getPreviousPhase = window.getPreviousPhase;
window.isShowdownPhase = window.isShowdownPhase;
window.isPreflopPhase = window.isPreflopPhase;
window.isFlopPhase = window.isFlopPhase;
window.isTurnPhase = window.isTurnPhase;
window.isRiverPhase = window.isRiverPhase;
window.isCommunityCardPhase = window.isCommunityCardPhase;
window.doesPhaseDealCommunityCards = window.doesPhaseDealCommunityCards;
window.getCommunityCardsToDeal = window.getCommunityCardsToDeal;
window.getTotalCommunityCardsByPhase = window.getTotalCommunityCardsByPhase;
window.getPhaseDisplayName = window.getPhaseDisplayName;
window.getPhaseShortName = window.getPhaseShortName;
window.getPhaseIndex = window.getPhaseIndex;
window.getPhaseByIndex = window.getPhaseByIndex;
window.isValidPhase = window.isValidPhase;
window.getPhaseAfterBettingRound = window.getPhaseAfterBettingRound;
window.getPhaseBeforeShowdown = window.getPhaseBeforeShowdown;
window.getPhasesUntilShowdown = window.getPhasesUntilShowdown;
window.getPhasesRemaining = window.getPhasesRemaining;
window.isLastBettingPhase = window.isLastBettingPhase;
window.isFirstBettingPhase = window.isFirstBettingPhase;
window.getPhaseBlindLevel = window.getPhaseBlindLevel;
window.getPhaseBettingRoundName = window.getPhaseBettingRoundName;
window.getPhaseRequiredCommunityCards = window.getPhaseRequiredCommunityCards;
window.getPhaseCommunityCardsNeeded = window.getPhaseCommunityCardsNeeded;
window.getPhaseFromCommunityCardCount = window.getPhaseFromCommunityCardCount;
window.isPhaseCompleted = window.isPhaseCompleted;
window.getPhasePriority = window.getPhasePriority;
window.comparePhases = window.comparePhases;
window.isPhaseAfter = window.isPhaseAfter;
window.isPhaseBefore = window.isPhaseBefore;
window.getPhaseByBettingRoundNumber = window.getPhaseByBettingRoundNumber;
window.getBettingRoundNumber = window.getBettingRoundNumber;
window.getPhaseDealDescription = window.getPhaseDealDescription;
window.getPhaseActionDescription = window.getPhaseActionDescription;
window.getPhaseIcon = window.getPhaseIcon;
window.getPhaseColor = window.getPhaseColor;
window.formatPhaseWithIcon = window.formatPhaseWithIcon;
window.getNextPhaseAfterAllIn = window.getNextPhaseAfterAllIn;
window.shouldProceedToNextPhase = window.shouldProceedToNextPhase;
window.isFinalPhaseBeforeShowdown = window.isFinalPhaseBeforeShowdown;
window.getPhaseStartMessage = window.getPhaseStartMessage;
window.getAllPhases = window.getAllPhases;
window.getAllBettingPhases = window.getAllBettingPhases;
window.getPhaseSequenceString = window.getPhaseSequenceString;
window.isPhaseValidForAction = window.isPhaseValidForAction;
window.getPhaseTimeoutDuration = window.getPhaseTimeoutDuration;
window.getPhaseDefaultRaiseAmount = window.getPhaseDefaultRaiseAmount;
window.getPhaseMinRaise = window.getPhaseMinRaise;

console.log('constants_phases.js loaded');
