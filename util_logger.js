window.UtilLogger = class UtilLogger {
    constructor() {
        this.logLevel = window.getLogLevel ? window.getLogLevel() : 'info';
        this.logToConsole = true;
        this.logToUI = true;
        this.logToStorage = false;
        this.maxStorageEntries = 1000;
        this.storageKey = 'poker_logs';
        this.logBuffer = [];
        this.bufferSize = 100;
        this.flushInterval = 5000;
        this.flushTimer = null;
        this.logHistory = [];
        this.maxHistory = 1000;
        this.uiLogContainer = null;
        this.uiLogMaxEntries = window.getLogMaxEntries ? window.getLogMaxEntries() : 100;
        this.timestampEnabled = window.isLogTimestampEnabled ? window.isLogTimestampEnabled() : true;
        this.init();
    }

    init() {
        this.startFlushTimer();
        this.uiLogContainer = document.getElementById('logContent');
        if (this.logToStorage) this.loadFromStorage();
    }

    setLogLevel(level) {
        if (['debug', 'info', 'warn', 'error'].includes(level)) {
            this.logLevel = level;
        }
    }

    setLogToConsole(enabled) {
        this.logToConsole = enabled;
    }

    setLogToUI(enabled) {
        this.logToUI = enabled;
        if (!enabled && this.uiLogContainer) this.uiLogContainer.innerHTML = '';
    }

    setLogToStorage(enabled) {
        this.logToStorage = enabled;
        if (!enabled) this.clearStorage();
        else this.flush();
    }

    setUIContainer(container) {
        this.uiLogContainer = container;
        if (this.logToUI && container) this.renderUI();
    }

    setUIEntryLimit(limit) {
        this.uiLogMaxEntries = limit;
        if (this.logToUI) this.renderUI();
    }

    getLevelPriority(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] !== undefined ? levels[level] : 1;
    }

    shouldLog(level) {
        return this.getLevelPriority(level) >= this.getLevelPriority(this.logLevel);
    }

    formatMessage(level, message, data = null, timestamp = null) {
        const ts = timestamp || new Date();
        const timeStr = this.timestampEnabled ? `[${ts.toLocaleTimeString()}]` : '';
        let formatted = `${timeStr} [${level.toUpperCase()}] ${message}`;
        if (data) {
            if (typeof data === 'object') formatted += ` ${JSON.stringify(data)}`;
            else formatted += ` ${data}`;
        }
        return formatted;
    }

    log(level, message, data = null) {
        if (!this.shouldLog(level)) return;
        const timestamp = new Date();
        const formatted = this.formatMessage(level, message, data, timestamp);
        const logEntry = {
            level,
            message,
            data,
            timestamp: timestamp.getTime(),
            formatted
        };
        this.logHistory.push(logEntry);
        if (this.logHistory.length > this.maxHistory) this.logHistory.shift();
        if (this.logToConsole) {
            const consoleMethod = level === 'error' ? console.error : (level === 'warn' ? console.warn : (level === 'debug' ? console.debug : console.log));
            consoleMethod(formatted);
        }
        if (this.logToUI) this.addToUI(logEntry);
        if (this.logToStorage) this.addToBuffer(logEntry);
    }

    debug(message, data = null) {
        this.log('debug', message, data);
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    warn(message, data = null) {
        this.log('warn', message, data);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }

    addToUI(entry) {
        if (!this.uiLogContainer) return;
        const div = document.createElement('div');
        div.className = `log-entry ${entry.level}`;
        div.textContent = entry.formatted;
        this.uiLogContainer.appendChild(div);
        while (this.uiLogContainer.children.length > this.uiLogMaxEntries) {
            this.uiLogContainer.removeChild(this.uiLogContainer.firstChild);
        }
        this.uiLogContainer.scrollTop = this.uiLogContainer.scrollHeight;
    }

    renderUI() {
        if (!this.uiLogContainer) return;
        this.uiLogContainer.innerHTML = '';
        const entries = this.logHistory.slice(-this.uiLogMaxEntries);
        for (let entry of entries) {
            const div = document.createElement('div');
            div.className = `log-entry ${entry.level}`;
            div.textContent = entry.formatted;
            this.uiLogContainer.appendChild(div);
        }
        this.uiLogContainer.scrollTop = this.uiLogContainer.scrollHeight;
    }

    clearUI() {
        if (this.uiLogContainer) this.uiLogContainer.innerHTML = '';
    }

    addToBuffer(entry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length >= this.bufferSize) this.flush();
    }

    startFlushTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }

    flush() {
        if (!this.logToStorage || this.logBuffer.length === 0) return;
        let stored = this.loadFromStorageRaw();
        stored.push(...this.logBuffer);
        if (stored.length > this.maxStorageEntries) {
            stored = stored.slice(-this.maxStorageEntries);
        }
        this.saveToStorageRaw(stored);
        this.logBuffer = [];
    }

    saveToStorageRaw(entries) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(entries));
        } catch(e) {}
    }

    loadFromStorageRaw() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    }

    loadFromStorage() {
        const stored = this.loadFromStorageRaw();
        this.logHistory = stored;
        if (this.logToUI) this.renderUI();
    }

    clearStorage() {
        localStorage.removeItem(this.storageKey);
        this.logBuffer = [];
    }

    getLogHistory() {
        return [...this.logHistory];
    }

    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logHistory, null, 2);
        } else if (format === 'text') {
            return this.logHistory.map(e => e.formatted).join('\n');
        }
        return '';
    }

    importLogs(data, format = 'json') {
        try {
            let entries;
            if (format === 'json') {
                entries = JSON.parse(data);
            } else if (format === 'text') {
                entries = data.split('\n').filter(l => l.trim()).map(line => ({
                    level: line.includes('[ERROR]') ? 'error' : (line.includes('[WARN]') ? 'warn' : (line.includes('[DEBUG]') ? 'debug' : 'info')),
                    message: line.replace(/^\[.*?\] \[(ERROR|WARN|DEBUG|INFO)\] /, ''),
                    formatted: line,
                    timestamp: Date.now()
                }));
            } else {
                return false;
            }
            if (!Array.isArray(entries)) return false;
            this.logHistory = entries;
            if (this.logToUI) this.renderUI();
            if (this.logToStorage) this.flush();
            return true;
        } catch(e) {
            return false;
        }
    }

    clearHistory() {
        this.logHistory = [];
        this.clearUI();
        if (this.logToStorage) this.clearStorage();
    }

    setMaxHistory(max) {
        this.maxHistory = max;
        while (this.logHistory.length > this.maxHistory) this.logHistory.shift();
    }

    setMaxStorageEntries(max) {
        this.maxStorageEntries = max;
        if (this.logToStorage) this.flush();
    }

    setBufferSize(size) {
        this.bufferSize = size;
    }

    setFlushInterval(ms) {
        this.flushInterval = ms;
        this.startFlushTimer();
    }

    setTimestampEnabled(enabled) {
        this.timestampEnabled = enabled;
        this.renderUI();
    }

    addSeparator() {
        this.info('─────────────────────────────────');
    }

    logGameStart(gameConfig) {
        this.info('=== ИГРА НАЧАТА ===');
        this.info(`Игроков: ${gameConfig.playerCount}, стартовые фишки: ${gameConfig.startChips}`);
        this.info(`Блайнды: ${gameConfig.smallBlind}/${gameConfig.bigBlind}`);
        if (gameConfig.enableAnte) this.info(`Анте: ${gameConfig.ante}`);
        if (gameConfig.tournamentMode) this.info('Турнирный режим');
    }

    logGameEnd() {
        this.info('=== ИГРА ЗАВЕРШЕНА ===');
    }

    logHandStart(handNumber, dealerName) {
        this.info(`=== РАЗДАЧА #${handNumber} ===`);
        this.info(`Дилер: ${dealerName}`);
    }

    logHandEnd(handNumber, winners, potAmount) {
        if (winners.length === 1) {
            this.info(`Раздача #${handNumber} завершена. Победитель: ${winners[0].name} выиграл ${potAmount}`);
        } else {
            this.info(`Раздача #${handNumber} завершена. Победители: ${winners.map(w => w.name).join(', ')} разделили ${potAmount}`);
        }
    }

    logPlayerAction(player, action, amount, currentBet) {
        const msg = window.getActionLogMessage ? window.getActionLogMessage(player, action, amount, currentBet) : `${player.name} ${action} ${amount}`;
        this.info(msg, { playerId: player.id });
    }

    logPhaseChange(phase) {
        this.info(`=== ${window.getPhaseDisplayName ? window.getPhaseDisplayName(phase) : phase} ===`);
    }

    logCommunityCards(cards) {
        this.info(`Общие карты: ${cards.map(c => c.toString()).join(' ')}`);
    }

    logPlayerCards(player, showHidden = false) {
        if (player.folded) {
            this.debug(`${player.name} сбросил карты`);
        } else if (showHidden || player.isHuman) {
            this.info(`${player.name}: ${player.hand.map(c => c.toString()).join(' ')}`);
        } else {
            this.debug(`${player.name}: [скрыто]`);
        }
    }

    logShowdown(player, handEvaluation) {
        const handDesc = handEvaluation ? window.getHandStrengthDescription ? window.getHandStrengthDescription(handEvaluation) : handEvaluation.toString() : 'нет комбинации';
        this.info(`${player.name}: ${player.hand.map(c => c.toString()).join(' ')} - ${handDesc}`);
    }

    logWinner(player, handEvaluation, potAmount) {
        const handDesc = handEvaluation ? window.getHandStrengthDescription ? window.getHandStrengthDescription(handEvaluation) : handEvaluation.toString() : '';
        this.info(`🏆 ${player.name} выигрывает ${potAmount} с комбинацией ${handDesc}`);
    }

    logAllIn(player, amount) {
        this.warn(`${player.name} идёт ва-банк на ${amount}`);
    }

    logBlind(player, blindType, amount) {
        this.info(`${player.name} ставит ${blindType} ${amount}`);
    }

    logAnte(player, amount) {
        this.info(`${player.name} ставит анте ${amount}`);
    }

    logFold(player) {
        this.info(`${player.name} сбрасывает карты`);
    }

    logCheck(player) {
        this.info(`${player.name} чекает`);
    }

    logCall(player, amount) {
        this.info(`${player.name} коллирует ${amount}`);
    }

    logRaise(player, amount, newBet) {
        this.info(`${player.name} рейзит до ${newBet} (+${amount})`);
    }

    logError(error, context = '') {
        this.error(`${context}: ${error.message || error}`, { stack: error.stack });
    }

    logWarning(message, data = null) {
        this.warn(message, data);
    }

    logPerformance(action, durationMs) {
        this.debug(`[PERF] ${action} занял ${durationMs}ms`);
    }

    logState(state, description = '') {
        if (this.logLevel !== 'debug') return;
        const summary = {
            phase: state.currentPhase,
            currentPlayer: state.getCurrentPlayer()?.name,
            currentBet: state.currentBet,
            pot: state.getPot(),
            activePlayers: state.getActivePlayersCount()
        };
        this.debug(`GameState ${description}: ${JSON.stringify(summary)}`);
    }

    logAI(aiName, decision, handStrength, potOdds) {
        this.debug(`${aiName}: решение=${decision.action}, сумма=${decision.amount}, сила=${handStrength.toFixed(2)}, шансы=${potOdds.toFixed(2)}`);
    }

    logCardsDealt(cards, toWhom) {
        this.info(`Разданы карты ${toWhom}: ${cards.map(c => c.toString()).join(' ')}`);
    }

    logDeckShuffle() {
        this.debug('Колода перемешана');
    }

    logDeckReset() {
        this.debug('Колода сброшена и перетасована');
    }

    logPotUpdate(oldPot, newPot, change) {
        this.debug(`Банк изменился: ${oldPot} → ${newPot} (+${change})`);
    }

    logSidePotCreated(amount, eligiblePlayers) {
        this.info(`Создан сайд-пот на ${amount}, участники: ${eligiblePlayers.map(p => p.name).join(', ')}`);
    }

    logSettingsChanged(category, settings) {
        this.info(`Настройки ${category} обновлены: ${JSON.stringify(settings)}`);
    }

    logAchievementUnlocked(achievement) {
        this.info(`🎉 Достижение разблокировано: ${achievement}`);
    }

    logStatIncrement(stat, value) {
        this.debug(`Статистика ${stat}: +${value}`);
    }

    logStorageOperation(operation, key, success) {
        this.debug(`Storage ${operation}: ${key} ${success ? 'успешно' : 'ошибка'}`);
    }

    logValidationError(field, value, reason) {
        this.warn(`Валидация ${field}=${value} не пройдена: ${reason}`);
    }

    logAnimationStart(animationName) {
        this.debug(`Анимация запущена: ${animationName}`);
    }

    logAnimationEnd(animationName) {
        this.debug(`Анимация завершена: ${animationName}`);
    }

    logNetworkRequest(url, method, status) {
        this.debug(`[NET] ${method} ${url} → ${status}`);
    }

    logAPIResponse(endpoint, data) {
        this.debug(`[API] ${endpoint} ответ: ${JSON.stringify(data).substring(0, 200)}`);
    }

    logUserAction(action, details = null) {
        this.info(`[USER] ${action}${details ? ': ' + JSON.stringify(details) : ''}`);
    }

    getStats() {
        const levels = { debug: 0, info: 0, warn: 0, error: 0 };
        for (let entry of this.logHistory) {
            levels[entry.level]++;
        }
        return {
            total: this.logHistory.length,
            byLevel: levels,
            bufferSize: this.logBuffer.length,
            storageSize: this.logToStorage ? (this.loadFromStorageRaw().length) : 0,
            uiEntries: this.uiLogContainer ? this.uiLogContainer.children.length : 0,
            logLevel: this.logLevel,
            timestampEnabled: this.timestampEnabled
        };
    }

    destroy() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flush();
        this.logHistory = [];
        this.logBuffer = [];
        this.clearUI();
    }
};

window.logger = new window.UtilLogger();
window.log = window.logger.log.bind(window.logger);
window.debug = window.logger.debug.bind(window.logger);
window.info = window.logger.info.bind(window.logger);
window.warn = window.logger.warn.bind(window.logger);
window.error = window.logger.error.bind(window.logger);

console.log('util_logger.js loaded');
