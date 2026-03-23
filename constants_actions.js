window.GameAction = {
    FOLD: 'fold',
    CHECK: 'check',
    CALL: 'call',
    RAISE: 'raise',
    ALL_IN: 'all_in'
};

window.ActionType = window.GameAction;

window.ACTION_NAMES = {
    [window.GameAction.FOLD]: 'Фолд',
    [window.GameAction.CHECK]: 'Чек',
    [window.GameAction.CALL]: 'Колл',
    [window.GameAction.RAISE]: 'Рейз',
    [window.GameAction.ALL_IN]: 'All-in'
};

window.ACTION_DESCRIPTIONS = {
    [window.GameAction.FOLD]: 'Сбросить карты и выйти из раздачи',
    [window.GameAction.CHECK]: 'Не делать ставку, если никто не повышал',
    [window.GameAction.CALL]: 'Уравнять текущую ставку',
    [window.GameAction.RAISE]: 'Увеличить ставку',
    [window.GameAction.ALL_IN]: 'Поставить все фишки'
};

window.ACTION_ICONS = {
    [window.GameAction.FOLD]: '✖️',
    [window.GameAction.CHECK]: '✓',
    [window.GameAction.CALL]: '💰',
    [window.GameAction.RAISE]: '📈',
    [window.GameAction.ALL_IN]: '💎'
};

window.isValidAction = function(action) {
    return Object.values(window.GameAction).includes(action);
};

window.getActionName = function(action) {
    return window.ACTION_NAMES[action] || 'Неизвестно';
};

window.getActionDescription = function(action) {
    return window.ACTION_DESCRIPTIONS[action] || '';
};

window.getActionIcon = function(action) {
    return window.ACTION_ICONS[action] || '?';
};

window.formatAction = function(action) {
    return `${window.getActionIcon(action)} ${window.getActionName(action)}`;
};

window.getAvailableActions = function(player, currentBet, minRaise, gamePhase) {
    const actions = [];
    const chips = player.chips;
    const hasBet = player.currentBet !== undefined && player.currentBet > 0;
    const toCall = currentBet - (player.currentBet || 0);
    if (toCall === 0) {
        actions.push(window.GameAction.CHECK);
    } else {
        if (chips >= toCall) actions.push(window.GameAction.CALL);
        else actions.push(window.GameAction.CALL);
    }
    if (chips > 0 && toCall < chips) {
        actions.push(window.GameAction.RAISE);
    }
    if (chips > 0) {
        actions.push(window.GameAction.ALL_IN);
    }
    if (toCall > 0 || chips === 0) {
        actions.push(window.GameAction.FOLD);
    }
    return actions;
};

window.isActionAvailable = function(action, player, currentBet, minRaise, gamePhase) {
    const available = window.getAvailableActions(player, currentBet, minRaise, gamePhase);
    return available.includes(action);
};

window.getActionMinRaiseAmount = function(player, currentBet, minRaise, lastRaise) {
    const toCall = Math.max(0, currentBet - (player.currentBet || 0));
    const minTotal = currentBet + minRaise;
    const maxTotal = player.chips + (player.currentBet || 0);
    if (minTotal > maxTotal) return null;
    return minTotal - (player.currentBet || 0);
};

window.getActionMaxRaiseAmount = function(player, currentBet) {
    const maxTotal = player.chips + (player.currentBet || 0);
    return maxTotal - (player.currentBet || 0);
};

window.getActionCallAmount = function(player, currentBet) {
    return Math.min(currentBet - (player.currentBet || 0), player.chips);
};

window.getActionAllInAmount = function(player) {
    return player.chips;
};

window.getActionRaiseAmount = function(player, currentBet, desiredRaise, minRaise) {
    const toCall = currentBet - (player.currentBet || 0);
    let raiseAmount = desiredRaise;
    if (raiseAmount < minRaise) raiseAmount = minRaise;
    let totalBet = (player.currentBet || 0) + raiseAmount;
    const maxBet = player.chips + (player.currentBet || 0);
    if (totalBet > maxBet) totalBet = maxBet;
    return totalBet - (player.currentBet || 0);
};

window.isActionValid = function(action, player, currentBet, minRaise, gamePhase, gameState) {
    if (!window.isValidAction(action)) return false;
    if (player.folded) return false;
    if (!player.isActive) return false;
    if (player.chips <= 0 && action !== window.GameAction.FOLD) return false;
    if (action === window.GameAction.FOLD) return true;
    if (action === window.GameAction.CHECK) {
        return (player.currentBet || 0) === currentBet;
    }
    if (action === window.GameAction.CALL) {
        const callAmount = window.getActionCallAmount(player, currentBet);
        return callAmount <= player.chips;
    }
    if (action === window.GameAction.RAISE) {
        const minRaiseAmount = window.getActionMinRaiseAmount(player, currentBet, minRaise);
        return minRaiseAmount !== null && minRaiseAmount <= player.chips;
    }
    if (action === window.GameAction.ALL_IN) {
        return player.chips > 0;
    }
    return false;
};

window.performAction = function(action, player, currentBet, raiseAmount, gameState) {
    if (!window.isActionValid(action, player, currentBet, 0, null, gameState)) return false;
    let betAmount = 0;
    let result = { action, player, amount: 0, allIn: false };
    switch (action) {
        case window.GameAction.FOLD:
            player.folded = true;
            player.isActive = false;
            result.amount = 0;
            break;
        case window.GameAction.CHECK:
            result.amount = 0;
            break;
        case window.GameAction.CALL:
            betAmount = window.getActionCallAmount(player, currentBet);
            player.chips -= betAmount;
            player.currentBet = (player.currentBet || 0) + betAmount;
            result.amount = betAmount;
            break;
        case window.GameAction.RAISE:
            betAmount = window.getActionRaiseAmount(player, currentBet, raiseAmount, 0);
            player.chips -= betAmount;
            player.currentBet = (player.currentBet || 0) + betAmount;
            result.amount = betAmount;
            break;
        case window.GameAction.ALL_IN:
            betAmount = player.chips;
            player.chips = 0;
            player.currentBet = (player.currentBet || 0) + betAmount;
            result.amount = betAmount;
            result.allIn = true;
            break;
    }
    if (player.chips === 0 && !player.folded) result.allIn = true;
    return result;
};

window.getActionPriority = function(action) {
    const priorities = {
        [window.GameAction.ALL_IN]: 5,
        [window.GameAction.RAISE]: 4,
        [window.GameAction.CALL]: 3,
        [window.GameAction.CHECK]: 2,
        [window.GameAction.FOLD]: 1
    };
    return priorities[action] || 0;
};

window.isAllInAction = function(action) {
    return action === window.GameAction.ALL_IN;
};

window.isFoldAction = function(action) {
    return action === window.GameAction.FOLD;
};

window.isCheckAction = function(action) {
    return action === window.GameAction.CHECK;
};

window.isCallAction = function(action) {
    return action === window.GameAction.CALL;
};

window.isRaiseAction = function(action) {
    return action === window.GameAction.RAISE;
};

window.isBettingAction = function(action) {
    return action === window.GameAction.CALL || action === window.GameAction.RAISE || action === window.GameAction.ALL_IN;
};

window.isNonBettingAction = function(action) {
    return action === window.GameAction.FOLD || action === window.GameAction.CHECK;
};

window.getActionEffect = function(action) {
    const effects = {
        [window.GameAction.FOLD]: 'сбрасывает карты',
        [window.GameAction.CHECK]: 'чекает',
        [window.GameAction.CALL]: 'уравнивает ставку',
        [window.GameAction.RAISE]: 'повышает ставку',
        [window.GameAction.ALL_IN]: 'идёт ва-банк'
    };
    return effects[action] || 'совершает действие';
};

window.getActionVerb = function(action) {
    const verbs = {
        [window.GameAction.FOLD]: 'сбросил',
        [window.GameAction.CHECK]: 'чекнул',
        [window.GameAction.CALL]: 'заколлировал',
        [window.GameAction.RAISE]: 'рейзнул',
        [window.GameAction.ALL_IN]: 'пошёл all-in'
    };
    return verbs[action] || 'сделал ход';
};

window.getActionRaiseType = function(raiseAmount, currentBet, playerBet) {
    if (raiseAmount === 0) return 'check';
    const total = playerBet + raiseAmount;
    if (total === currentBet) return 'call';
    if (total > currentBet) return 'raise';
    return 'unknown';
};

window.getActionAmountString = function(action, amount, currentBet) {
    if (action === window.GameAction.FOLD) return '';
    if (action === window.GameAction.CHECK) return '';
    if (action === window.GameAction.CALL) return ` (${amount})`;
    if (action === window.GameAction.RAISE) return ` до ${currentBet + amount}`;
    if (action === window.GameAction.ALL_IN) return ` (${amount})`;
    return '';
};

window.getActionLogMessage = function(player, action, amount, currentBet) {
    const name = player.name;
    const actionName = window.getActionName(action);
    const amountStr = window.getActionAmountString(action, amount, currentBet);
    let message = `${name} ${window.getActionVerb(action)}${amountStr}`;
    if (action === window.GameAction.ALL_IN) message = `${name} идёт ва-банк (${amount})`;
    if (action === window.GameAction.FOLD) message = `${name} сбрасывает карты`;
    return message;
};

window.getActionShortcut = function(action) {
    const shortcuts = {
        [window.GameAction.FOLD]: 'F',
        [window.GameAction.CHECK]: 'C',
        [window.GameAction.CALL]: 'K',
        [window.GameAction.RAISE]: 'R',
        [window.GameAction.ALL_IN]: 'A'
    };
    return shortcuts[action] || '';
};

window.getActionsForPhase = function(phase) {
    if (phase === window.GamePhase.SHOWDOWN) return [];
    return Object.values(window.GameAction);
};

window.isActionAllowedInPhase = function(action, phase) {
    if (phase === window.GamePhase.SHOWDOWN) return false;
    return true;
};

window.getDefaultRaiseMultiplier = function(action, gamePhase) {
    if (action !== window.GameAction.RAISE) return 1;
    if (gamePhase === window.GamePhase.PREFLOP) return 3;
    return 2;
};

window.getActionConfirmationMessage = function(action, amount, player) {
    let msg = `Вы уверены, что хотите ${window.getActionName(action).toLowerCase()}?`;
    if (amount > 0) msg += ` Сумма: ${amount}`;
    return msg;
};

window.getActionOptions = function(player, currentBet, minRaise, gamePhase) {
    const actions = window.getAvailableActions(player, currentBet, minRaise, gamePhase);
    return actions.map(a => ({
        type: a,
        name: window.getActionName(a),
        icon: window.getActionIcon(a),
        available: true,
        minAmount: a === window.GameAction.RAISE ? window.getActionMinRaiseAmount(player, currentBet, minRaise) : null,
        maxAmount: a === window.GameAction.RAISE ? window.getActionMaxRaiseAmount(player, currentBet) : null
    }));
};

window.canPlayerAct = function(player, gameState) {
    if (player.folded) return false;
    if (!player.isActive) return false;
    if (player.chips === 0) return false;
    if (gameState.currentPhase === window.GamePhase.SHOWDOWN) return false;
    return true;
};

window.getRequiredCallAmount = function(player, currentBet) {
    return Math.max(0, currentBet - (player.currentBet || 0));
};

window.isPlayerAllIn = function(player) {
    return player.chips === 0 && !player.folded;
};

window.getActionAfterAllIn = function(player, currentBet) {
    const toCall = window.getRequiredCallAmount(player, currentBet);
    if (toCall > 0 && player.chips === 0) return window.GameAction.CALL;
    if (toCall === 0 && player.chips === 0) return window.GameAction.CHECK;
    return null;
};

window.isActionForced = function(action, player, gameState) {
    if (player.chips === 0 && !player.folded) return true;
    return false;
};

window.getActionAutoResolve = function(player, currentBet, minRaise, gamePhase) {
    if (player.chips === 0) {
        if ((player.currentBet || 0) === currentBet) return window.GameAction.CHECK;
        return window.GameAction.CALL;
    }
    return null;
};

window.ACTION_SEQUENCE = Object.freeze({
    [window.GameAction.FOLD]: 1,
    [window.GameAction.CHECK]: 2,
    [window.GameAction.CALL]: 3,
    [window.GameAction.RAISE]: 4,
    [window.GameAction.ALL_IN]: 5
});

window.getActionOrder = function(action) {
    return window.ACTION_SEQUENCE[action] || 0;
};

window.sortActionsByPriority = function(actions) {
    return [...actions].sort((a,b) => window.getActionOrder(b) - window.getActionOrder(a));
};

window.getActionFromString = function(str) {
    const map = {
        'fold': window.GameAction.FOLD,
        'check': window.GameAction.CHECK,
        'call': window.GameAction.CALL,
        'raise': window.GameAction.RAISE,
        'allin': window.GameAction.ALL_IN,
        'all_in': window.GameAction.ALL_IN
    };
    return map[str.toLowerCase()] || null;
};

window.getAllActionsList = function() {
    return Object.values(window.GameAction);
};

window.getActionButtonClass = function(action) {
    const classes = {
        [window.GameAction.FOLD]: 'action-fold',
        [window.GameAction.CHECK]: 'action-check',
        [window.GameAction.CALL]: 'action-call',
        [window.GameAction.RAISE]: 'action-raise',
        [window.GameAction.ALL_IN]: 'action-allin'
    };
    return classes[action] || '';
};

window.getActionColor = function(action) {
    const colors = {
        [window.GameAction.FOLD]: '#cc4444',
        [window.GameAction.CHECK]: '#3a6ea5',
        [window.GameAction.CALL]: '#3a9e5a',
        [window.GameAction.RAISE]: '#e09d32',
        [window.GameAction.ALL_IN]: '#cc3333'
    };
    return colors[action] || '#888888';
};

window.GameAction = window.GameAction;
window.ACTION_NAMES = window.ACTION_NAMES;
window.ACTION_DESCRIPTIONS = window.ACTION_DESCRIPTIONS;
window.ACTION_ICONS = window.ACTION_ICONS;
window.isValidAction = window.isValidAction;
window.getActionName = window.getActionName;
window.getActionDescription = window.getActionDescription;
window.getActionIcon = window.getActionIcon;
window.formatAction = window.formatAction;
window.getAvailableActions = window.getAvailableActions;
window.isActionAvailable = window.isActionAvailable;
window.getActionMinRaiseAmount = window.getActionMinRaiseAmount;
window.getActionMaxRaiseAmount = window.getActionMaxRaiseAmount;
window.getActionCallAmount = window.getActionCallAmount;
window.getActionAllInAmount = window.getActionAllInAmount;
window.getActionRaiseAmount = window.getActionRaiseAmount;
window.isActionValid = window.isActionValid;
window.performAction = window.performAction;
window.getActionPriority = window.getActionPriority;
window.isAllInAction = window.isAllInAction;
window.isFoldAction = window.isFoldAction;
window.isCheckAction = window.isCheckAction;
window.isCallAction = window.isCallAction;
window.isRaiseAction = window.isRaiseAction;
window.isBettingAction = window.isBettingAction;
window.isNonBettingAction = window.isNonBettingAction;
window.getActionEffect = window.getActionEffect;
window.getActionVerb = window.getActionVerb;
window.getActionRaiseType = window.getActionRaiseType;
window.getActionAmountString = window.getActionAmountString;
window.getActionLogMessage = window.getActionLogMessage;
window.getActionShortcut = window.getActionShortcut;
window.getActionsForPhase = window.getActionsForPhase;
window.isActionAllowedInPhase = window.isActionAllowedInPhase;
window.getDefaultRaiseMultiplier = window.getDefaultRaiseMultiplier;
window.getActionConfirmationMessage = window.getActionConfirmationMessage;
window.getActionOptions = window.getActionOptions;
window.canPlayerAct = window.canPlayerAct;
window.getRequiredCallAmount = window.getRequiredCallAmount;
window.isPlayerAllIn = window.isPlayerAllIn;
window.getActionAfterAllIn = window.getActionAfterAllIn;
window.isActionForced = window.isActionForced;
window.getActionAutoResolve = window.getActionAutoResolve;
window.ACTION_SEQUENCE = window.ACTION_SEQUENCE;
window.getActionOrder = window.getActionOrder;
window.sortActionsByPriority = window.sortActionsByPriority;
window.getActionFromString = window.getActionFromString;
window.getAllActionsList = window.getAllActionsList;
window.getActionButtonClass = window.getActionButtonClass;
window.getActionColor = window.getActionColor;

console.log('constants_actions.js loaded');
