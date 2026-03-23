window.UtilValidation = class UtilValidation {
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    static isInteger(value) {
        return Number.isInteger(value);
    }

    static isPositiveNumber(value) {
        return this.isNumber(value) && value > 0;
    }

    static isNonNegativeNumber(value) {
        return this.isNumber(value) && value >= 0;
    }

    static isWithinRange(value, min, max) {
        return this.isNumber(value) && value >= min && value <= max;
    }

    static isBoolean(value) {
        return typeof value === 'boolean';
    }

    static isString(value) {
        return typeof value === 'string';
    }

    static isNonEmptyString(value) {
        return this.isString(value) && value.trim().length > 0;
    }

    static isArray(value) {
        return Array.isArray(value);
    }

    static isNonEmptyArray(value) {
        return this.isArray(value) && value.length > 0;
    }

    static isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    static isFunction(value) {
        return typeof value === 'function';
    }

    static isValidCard(card) {
        if (!card || typeof card !== 'object') return false;
        if (!window.isValidCard) return card instanceof window.Card;
        return window.isValidCard(card);
    }

    static isValidDeck(deck) {
        return deck && typeof deck.size === 'function' && typeof deck.draw === 'function';
    }

    static isValidPlayer(player) {
        if (!player || typeof player !== 'object') return false;
        if (player.id === undefined || player.name === undefined) return false;
        if (player.chips === undefined || !this.isNonNegativeNumber(player.chips)) return false;
        return true;
    }

    static isValidGameState(state) {
        if (!state || typeof state !== 'object') return false;
        if (!state.players || !this.isNonEmptyArray(state.players)) return false;
        if (state.currentPhase === undefined) return false;
        if (state.currentPlayerIndex === undefined || !this.isInteger(state.currentPlayerIndex)) return false;
        return true;
    }

    static isValidAction(action) {
        return window.isValidAction ? window.isValidAction(action) : Object.values(window.GameAction || {}).includes(action);
    }

    static isValidRaiseAmount(amount, player, currentBet, minRaise) {
        if (!this.isPositiveNumber(amount)) return false;
        if (!player || !this.isValidPlayer(player)) return false;
        const toCall = Math.max(0, currentBet - (player.currentBet || 0));
        if (amount > player.chips) return false;
        if (amount < minRaise && amount < player.chips) return false;
        return true;
    }

    static isValidCallAmount(amount, player, currentBet) {
        const toCall = Math.max(0, currentBet - (player.currentBet || 0));
        if (amount !== toCall && amount !== player.chips) return false;
        if (amount > player.chips) return false;
        return true;
    }

    static isValidAllInAmount(amount, player) {
        return amount === player.chips && player.chips > 0;
    }

    static isValidBettingRound(players, currentBet) {
        if (!this.isNonEmptyArray(players)) return false;
        for (let p of players) {
            if (p.folded) continue;
            if (!this.isNumber(p.currentBet)) return false;
            if (p.currentBet < 0 || p.currentBet > currentBet) return false;
        }
        return true;
    }

    static isValidHand(cards) {
        if (!this.isNonEmptyArray(cards)) return false;
        for (let card of cards) {
            if (!this.isValidCard(card)) return false;
        }
        const seen = new Set();
        for (let card of cards) {
            const key = `${card.rank}${card.suit}`;
            if (seen.has(key)) return false;
            seen.add(key);
        }
        return true;
    }

    static isValidCommunityCards(cards, maxCount = 5) {
        if (!cards) return true;
        if (!this.isArray(cards)) return false;
        if (cards.length > maxCount) return false;
        return this.isValidHand(cards);
    }

    static isValidDeckComposition(deck) {
        if (!this.isValidDeck(deck)) return false;
        const allCards = deck.getCards();
        const seen = new Set();
        for (let card of allCards) {
            const key = `${card.rank}${card.suit}`;
            if (seen.has(key)) return false;
            seen.add(key);
        }
        return seen.size === 52;
    }

    static isValidPlayerCount(count, min = 2, max = 6) {
        return this.isInteger(count) && count >= min && count <= max;
    }

    static isValidChipsAmount(chips, min = 100, max = 10000) {
        return this.isInteger(chips) && chips >= min && chips <= max;
    }

    static isValidBlind(sb, bb) {
        return this.isPositiveNumber(sb) && this.isPositiveNumber(bb) && sb < bb;
    }

    static isValidGameConfig(config) {
        if (!this.isObject(config)) return false;
        if (!this.isValidPlayerCount(config.playerCount, config.minPlayers, config.maxPlayers)) return false;
        if (!this.isValidChipsAmount(config.startChips)) return false;
        if (!this.isValidBlind(config.smallBlind, config.bigBlind)) return false;
        if (!this.isNonNegativeNumber(config.ante)) return false;
        if (!this.isBoolean(config.enableAnte)) return false;
        if (!this.isBoolean(config.tournamentMode)) return false;
        if (!this.isPositiveNumber(config.timeBank)) return false;
        if (!this.isNonNegativeNumber(config.showDownDelay)) return false;
        return true;
    }

    static isValidAIConfig(config) {
        if (!this.isObject(config)) return false;
        if (!this.isWithinRange(config.aggressionBase, 1, 10)) return false;
        if (!this.isWithinRange(config.bluffFrequency, 0, 1)) return false;
        if (!this.isWithinRange(config.callThreshold, 0, 1)) return false;
        if (!this.isWithinRange(config.raiseThreshold, 0, 1)) return false;
        if (!this.isWithinRange(config.allInThreshold, 0, 1)) return false;
        if (!this.isWithinRange(config.tightThreshold, 0, 1)) return false;
        if (!this.isWithinRange(config.looseThreshold, 0, 1)) return false;
        if (!this.isPositiveNumber(config.minRaiseMultiplier)) return false;
        if (!this.isPositiveNumber(config.maxRaiseMultiplier)) return false;
        if (config.minRaiseMultiplier > config.maxRaiseMultiplier) return false;
        if (!this.isWithinRange(config.adaptiveLearningRate, 0, 1)) return false;
        return true;
    }

    static isValidUIConfig(config) {
        if (!this.isObject(config)) return false;
        if (!this.isNonNegativeNumber(config.animationSpeed)) return false;
        if (!this.isNonNegativeNumber(config.cardDealDelay)) return false;
        if (!this.isNonNegativeNumber(config.chipMoveDuration)) return false;
        if (!this.isPositiveNumber(config.logMaxEntries)) return false;
        if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) return false;
        if (!this.isWithinRange(config.soundVolume, 0, 1)) return false;
        if (!['horizontal', 'vertical'].includes(config.buttonLayout)) return false;
        if (!this.isNonNegativeNumber(config.autoCheckFoldDelay)) return false;
        if (!this.isNonNegativeNumber(config.tooltipDelay)) return false;
        if (!this.isPositiveNumber(config.cardWidth) || !this.isPositiveNumber(config.cardHeight)) return false;
        return true;
    }

    static isValidPhase(phase) {
        return window.isValidPhase ? window.isValidPhase(phase) : Object.values(window.GamePhase || {}).includes(phase);
    }

    static isValidTransition(fromPhase, toPhase) {
        if (!this.isValidPhase(fromPhase) || !this.isValidPhase(toPhase)) return false;
        const order = window.PhaseOrder || [window.GamePhase?.PREFLOP, window.GamePhase?.FLOP, window.GamePhase?.TURN, window.GamePhase?.RIVER, window.GamePhase?.SHOWDOWN];
        const fromIndex = order.indexOf(fromPhase);
        const toIndex = order.indexOf(toPhase);
        return fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex;
    }

    static validatePlayerAction(player, action, amount, currentBet, minRaise, gamePhase) {
        const errors = [];
        if (!this.isValidPlayer(player)) errors.push('Invalid player');
        if (!this.isValidAction(action)) errors.push('Invalid action');
        if (action === window.GameAction.RAISE && !this.isValidRaiseAmount(amount, player, currentBet, minRaise)) errors.push('Invalid raise amount');
        if (action === window.GameAction.CALL && !this.isValidCallAmount(amount, player, currentBet)) errors.push('Invalid call amount');
        if (action === window.GameAction.ALL_IN && !this.isValidAllInAmount(amount, player)) errors.push('Invalid all-in amount');
        if (player.folded) errors.push('Player already folded');
        if (!player.isActive) errors.push('Player not active');
        if (player.chips === 0 && action !== window.GameAction.FOLD) errors.push('No chips to bet');
        if (gamePhase && !this.isValidPhase(gamePhase)) errors.push('Invalid game phase');
        return { valid: errors.length === 0, errors };
    }

    static validateGameStart(players, dealerIndex, config) {
        const errors = [];
        if (!this.isNonEmptyArray(players)) errors.push('No players');
        if (players.length < 2) errors.push('Need at least 2 players');
        for (let i = 0; i < players.length; i++) {
            if (!this.isValidPlayer(players[i])) errors.push(`Player ${i} invalid`);
            if (players[i].chips <= 0) errors.push(`Player ${players[i].name} has no chips`);
        }
        if (!this.isInteger(dealerIndex) || dealerIndex < 0 || dealerIndex >= players.length) errors.push('Invalid dealer index');
        if (config && !this.isValidGameConfig(config)) errors.push('Invalid game config');
        return { valid: errors.length === 0, errors };
    }

    static validateBettingComplete(players, currentBet) {
        for (let p of players) {
            if (p.folded) continue;
            if (p.isAllIn()) continue;
            if (p.currentBet !== currentBet) return false;
        }
        return true;
    }

    static validatePotDistribution(pots, players) {
        if (!this.isArray(pots)) return false;
        let total = 0;
        for (let pot of pots) {
            if (!this.isPositiveNumber(pot.amount)) return false;
            total += pot.amount;
            if (!this.isArray(pot.eligiblePlayers)) return false;
            for (let p of pot.eligiblePlayers) {
                if (!players.includes(p)) return false;
            }
        }
        const playerTotalBet = players.reduce((sum, p) => sum + (p.currentBet || 0), 0);
        return Math.abs(total - playerTotalBet) < 0.01;
    }

    static validateHandEvaluation(evaluation) {
        if (!evaluation) return false;
        if (!this.isNumber(evaluation.rank)) return false;
        if (!this.isWithinRange(evaluation.rank, 1, 10)) return false;
        if (!this.isNumber(evaluation.rankValue)) return false;
        if (!this.isArray(evaluation.kickers)) return false;
        return true;
    }

    static validateWinnerDetermination(winners, players, pot) {
        if (!this.isNonEmptyArray(winners)) return false;
        for (let w of winners) {
            if (!players.includes(w)) return false;
        }
        if (pot > 0 && winners.length === 0) return false;
        return true;
    }

    static validateDeckAfterDeal(deck, players, communityCards) {
        const usedCards = [];
        for (let p of players) usedCards.push(...p.hand);
        usedCards.push(...communityCards);
        const usedSet = new Set(usedCards.map(c => `${c.rank}${c.suit}`));
        const deckCards = deck.getCards();
        const deckSet = new Set(deckCards.map(c => `${c.rank}${c.suit}`));
        for (let card of usedCards) {
            if (deckSet.has(`${card.rank}${card.suit}`)) return false;
        }
        if (usedSet.size !== usedCards.length) return false;
        return true;
    }

    static validateNoDuplicateCards(cards) {
        const seen = new Set();
        for (let card of cards) {
            const key = `${card.rank}${card.suit}`;
            if (seen.has(key)) return false;
            seen.add(key);
        }
        return true;
    }

    static validatePlayerChips(player, amountToBet) {
        if (amountToBet > player.chips) return false;
        if (amountToBet < 0) return false;
        return true;
    }

    static validateBetSize(betSize, minBet, maxBet) {
        return betSize >= minBet && betSize <= maxBet;
    }

    static validateRaiseSize(raiseAmount, currentBet, minRaise, playerChips) {
        const newBet = currentBet + raiseAmount;
        if (newBet > playerChips + currentBet) return false;
        if (newBet < currentBet + minRaise && newBet < playerChips + currentBet) return false;
        return true;
    }

    static validateAIDecision(decision) {
        if (!decision || typeof decision !== 'object') return false;
        if (!this.isValidAction(decision.action)) return false;
        if (!this.isNumber(decision.amount)) return false;
        if (decision.amount < 0) return false;
        return true;
    }

    static validateAnimationParameters(duration, delay) {
        if (!this.isNonNegativeNumber(duration)) return false;
        if (!this.isNonNegativeNumber(delay)) return false;
        return true;
    }

    static validateLocalStorageKey(key) {
        if (!this.isNonEmptyString(key)) return false;
        if (key.length > 100) return false;
        if (/[^a-zA-Z0-9_\-]/.test(key)) return false;
        return true;
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return re.test(email);
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch(e) {
            return false;
        }
    }

    static validateColorHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    static validateCardString(cardStr) {
        return /^([2-9JQKA]|10)([♥♦♣♠])$/.test(cardStr);
    }

    static validateHandString(handStr) {
        const cards = handStr.split(/\s+/);
        if (cards.length !== 2 && cards.length !== 5) return false;
        for (let c of cards) {
            if (!this.validateCardString(c)) return false;
        }
        return this.validateNoDuplicateCards(cards.map(c => ({ rank: c[0], suit: c[1] })));
    }

    static validateBettingRoundSequence(players, actions) {
        let lastPlayer = null;
        for (let action of actions) {
            const player = players.find(p => p.id === action.playerId);
            if (!player) return false;
            if (player.folded) continue;
            if (lastPlayer && player.id === lastPlayer) return false;
            lastPlayer = player.id;
        }
        return true;
    }

    static validateAllInPlayers(allInPlayers, players) {
        for (let p of allInPlayers) {
            if (!players.includes(p)) return false;
            if (p.chips !== 0) return false;
        }
        return true;
    }

    static validateSidePots(sidePots, players) {
        let totalPot = 0;
        let coveredPlayers = new Set();
        for (let pot of sidePots) {
            if (!this.isPositiveNumber(pot.amount)) return false;
            totalPot += pot.amount;
            for (let p of pot.eligiblePlayers) {
                if (!players.includes(p)) return false;
                coveredPlayers.add(p);
            }
        }
        const activePlayers = players.filter(p => !p.folded);
        for (let p of activePlayers) coveredPlayers.add(p);
        return coveredPlayers.size === activePlayers.length;
    }

    static validateHandStrengthValue(strength) {
        return this.isNumber(strength) && strength >= 0 && strength <= 1;
    }

    static validatePotOdds(odds) {
        return this.isNumber(odds) && odds >= 0;
    }

    static validatePosition(position) {
        const validPositions = ['early', 'middle', 'late', 'blind', 'dealer', 'smallBlind', 'bigBlind', 'cutoff', 'button'];
        return validPositions.includes(position);
    }

    static validateTablePosition(index, playerCount) {
        return this.isInteger(index) && index >= 0 && index < playerCount;
    }

    static validateGamePhaseTransition(currentPhase, nextPhase, communityCardsCount) {
        if (!this.isValidTransition(currentPhase, nextPhase)) return false;
        const neededCards = window.getTotalCommunityCardsByPhase(nextPhase);
        if (communityCardsCount !== neededCards) return false;
        return true;
    }

    static validateKickers(kickers) {
        if (!this.isArray(kickers)) return false;
        for (let k of kickers) {
            if (!this.isNumber(k)) return false;
        }
        return true;
    }

    static validateHandRank(rank) {
        return this.isInteger(rank) && rank >= 1 && rank <= 10;
    }

    static validateBlindLevel(level, blinds) {
        if (!this.isObject(level)) return false;
        if (!this.isPositiveNumber(level.smallBlind)) return false;
        if (!this.isPositiveNumber(level.bigBlind)) return false;
        if (level.smallBlind >= level.bigBlind) return false;
        if (blinds && blinds.length) {
            const last = blinds[blinds.length - 1];
            if (level.smallBlind <= last.smallBlind) return false;
        }
        return true;
    }

    static validateTournamentStructure(structure) {
        if (!this.isArray(structure)) return false;
        for (let level of structure) {
            if (!this.validateBlindLevel(level, structure)) return false;
        }
        return true;
    }

    static validatePlayerName(name) {
        if (!this.isNonEmptyString(name)) return false;
        if (name.length > 30) return false;
        if (/[<>]/.test(name)) return false;
        return true;
    }

    static validateMessage(message) {
        return this.isNonEmptyString(message) && message.length <= 500;
    }

    static validateTimestamp(timestamp) {
        return this.isNumber(timestamp) && timestamp > 0;
    }

    static validateSessionId(sessionId) {
        return this.isNonEmptyString(sessionId) && /^[a-zA-Z0-9\-_]{8,36}$/.test(sessionId);
    }

    static validateVersion(version) {
        return /^\d+\.\d+\.\d+$/.test(version);
    }

    static validatePercentage(percent) {
        return this.isNumber(percent) && percent >= 0 && percent <= 100;
    }

    static validateProbability(prob) {
        return this.isNumber(prob) && prob >= 0 && prob <= 1;
    }

    static validateGameVariant(variant) {
        const validVariants = ['texas_holdem', 'omaha', 'stud'];
        return validVariants.includes(variant);
    }

    static validateDifficulty(level) {
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        return levels.includes(level);
    }

    static validateAIBehavior(behavior) {
        const validBehaviors = ['tight', 'aggressive', 'random', 'adaptive', 'maniac', 'calling_station', 'rock', 'mouse', 'lag', 'tag'];
        return validBehaviors.includes(behavior);
    }

    static validateButtonLayout(layout) {
        return layout === 'horizontal' || layout === 'vertical';
    }

    static validateTheme(theme) {
        const themes = ['dark', 'light', 'classic', 'neon'];
        return themes.includes(theme);
    }

    static validateLanguage(lang) {
        const langs = ['ru', 'en', 'es', 'fr', 'de'];
        return langs.includes(lang);
    }

    static validateDateString(dateStr) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    }

    static validateTimeString(timeStr) {
        return /^\d{2}:\d{2}:\d{2}$/.test(timeStr);
    }

    static validateDateTimeString(datetimeStr) {
        return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(datetimeStr);
    }

    static validateLogLevel(level) {
        return ['debug', 'info', 'warn', 'error'].includes(level);
    }

    static validateCardBackDesign(design) {
        return ['classic', 'dots', 'stripes', 'none'].includes(design);
    }

    static validateTableStyle(style) {
        return ['felt', 'wood', 'marble'].includes(style);
    }

    static validateSoundVolume(volume) {
        return this.isNumber(volume) && volume >= 0 && volume <= 1;
    }

    static validateRaisePreset(preset) {
        if (!this.isObject(preset)) return false;
        if (!this.isNonEmptyString(preset.label)) return false;
        if (!this.isNumber(preset.value) && !this.isFunction(preset.value)) return false;
        return true;
    }

    static validateActionButton(action, button) {
        if (!this.isValidAction(action)) return false;
        if (!button || typeof button !== 'object') return false;
        if (!button.addEventListener || !button.removeEventListener) return false;
        return true;
    }

    static validateCardElement(element) {
        if (!element || !(element instanceof HTMLElement)) return false;
        return element.classList.contains('card') || element.classList.contains('card-back');
    }

    static validatePotElement(element) {
        return element && (element.classList.contains('pot-display') || element.id === 'mainPotAmount');
    }

    static validatePlayerElement(element) {
        return element && element.classList.contains('player-position');
    }

    static validateLogContainer(element) {
        return element && element.classList.contains('log-content');
    }

    static validateModalElement(element) {
        return element && element.classList.contains('modal');
    }

    static validateFormElement(element) {
        return element && (element.tagName === 'FORM' || element.tagName === 'INPUT');
    }

    static validateEvent(event) {
        return event && typeof event.preventDefault === 'function';
    }

    static validateCallback(cb) {
        return this.isFunction(cb);
    }

    static validatePromise(p) {
        return p && typeof p.then === 'function';
    }

    static validateError(error) {
        return error && (typeof error === 'string' || error instanceof Error);
    }

    static validateResult(result) {
        return result !== null && result !== undefined;
    }

    static validateResponse(response) {
        if (!response) return false;
        if (typeof response.ok !== 'boolean') return false;
        if (typeof response.status !== 'number') return false;
        return true;
    }

    static validateDOMElement(element, requiredTag = null) {
        if (!element || !(element instanceof HTMLElement)) return false;
        if (requiredTag && element.tagName !== requiredTag.toUpperCase()) return false;
        return true;
    }

    static validateCSSProperty(property) {
        return this.isNonEmptyString(property) && /^[a-zA-Z-]+$/.test(property);
    }

    static validateFontSize(size) {
        return /^\d+(\.\d+)?(px|em|rem|%)$/.test(size);
    }

    static validateDuration(ms) {
        return this.isNonNegativeNumber(ms) && ms <= 60000;
    }

    static validateDelay(ms) {
        return this.isNonNegativeNumber(ms) && ms <= 30000;
    }

    static validateTimeout(ms) {
        return this.isPositiveNumber(ms) && ms <= 3600000;
    }

    static validateMaxRetries(retries) {
        return this.isInteger(retries) && retries >= 0 && retries <= 10;
    }

    static validateBatchSize(size) {
        return this.isInteger(size) && size >= 1 && size <= 100;
    }

    static validatePort(port) {
        return this.isInteger(port) && port >= 1024 && port <= 65535;
    }

    static validateHostname(hostname) {
        return this.isNonEmptyString(hostname) && /^[a-zA-Z0-9.-]+$/.test(hostname);
    }

    static validateAPIEndpoint(endpoint) {
        return this.validateURL(endpoint);
    }

    static validateToken(token) {
        return this.isNonEmptyString(token) && token.length <= 512;
    }
};

window.validate = {
    isNumber: UtilValidation.isNumber.bind(UtilValidation),
    isInteger: UtilValidation.isInteger.bind(UtilValidation),
    isPositiveNumber: UtilValidation.isPositiveNumber.bind(UtilValidation),
    isNonNegativeNumber: UtilValidation.isNonNegativeNumber.bind(UtilValidation),
    isWithinRange: UtilValidation.isWithinRange.bind(UtilValidation),
    isBoolean: UtilValidation.isBoolean.bind(UtilValidation),
    isString: UtilValidation.isString.bind(UtilValidation),
    isNonEmptyString: UtilValidation.isNonEmptyString.bind(UtilValidation),
    isArray: UtilValidation.isArray.bind(UtilValidation),
    isNonEmptyArray: UtilValidation.isNonEmptyArray.bind(UtilValidation),
    isObject: UtilValidation.isObject.bind(UtilValidation),
    isValidCard: UtilValidation.isValidCard.bind(UtilValidation),
    isValidPlayer: UtilValidation.isValidPlayer.bind(UtilValidation),
    isValidGameState: UtilValidation.isValidGameState.bind(UtilValidation),
    isValidAction: UtilValidation.isValidAction.bind(UtilValidation),
    isValidRaiseAmount: UtilValidation.isValidRaiseAmount.bind(UtilValidation),
    isValidCallAmount: UtilValidation.isValidCallAmount.bind(UtilValidation),
    isValidAllInAmount: UtilValidation.isValidAllInAmount.bind(UtilValidation),
    validatePlayerAction: UtilValidation.validatePlayerAction.bind(UtilValidation),
    validateGameStart: UtilValidation.validateGameStart.bind(UtilValidation),
    validateBettingComplete: UtilValidation.validateBettingComplete.bind(UtilValidation),
    validateHandEvaluation: UtilValidation.validateHandEvaluation.bind(UtilValidation),
    validateWinnerDetermination: UtilValidation.validateWinnerDetermination.bind(UtilValidation),
    validateNoDuplicateCards: UtilValidation.validateNoDuplicateCards.bind(UtilValidation),
    validatePlayerChips: UtilValidation.validatePlayerChips.bind(UtilValidation),
    validateBetSize: UtilValidation.validateBetSize.bind(UtilValidation),
    validateRaiseSize: UtilValidation.validateRaiseSize.bind(UtilValidation),
    validateAIDecision: UtilValidation.validateAIDecision.bind(UtilValidation),
    validateCardString: UtilValidation.validateCardString.bind(UtilValidation),
    validateHandString: UtilValidation.validateHandString.bind(UtilValidation),
    validateGameConfig: UtilValidation.isValidGameConfig.bind(UtilValidation),
    validateAIConfig: UtilValidation.isValidAIConfig.bind(UtilValidation),
    validateUIConfig: UtilValidation.isValidUIConfig.bind(UtilValidation),
    validatePhase: UtilValidation.isValidPhase.bind(UtilValidation),
    validatePosition: UtilValidation.validatePosition.bind(UtilValidation),
    validatePercentage: UtilValidation.validatePercentage.bind(UtilValidation),
    validateProbability: UtilValidation.validateProbability.bind(UtilValidation)
};

console.log('util_validation.js loaded');
