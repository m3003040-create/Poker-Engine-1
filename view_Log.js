window.ViewLog = class ViewLog {
    constructor() {
        this.logContainer = document.getElementById('logContent');
        this.logHeader = document.querySelector('.log-header');
        this.maxEntries = window.getLogMaxEntries();
        this.logLevel = window.getLogLevel();
        this.timestampEnabled = window.isLogTimestampEnabled();
        this.entries = [];
        this.filteredTypes = new Set();
        this.searchQuery = '';
        this.autoScroll = true;
        this.init();
    }

    init() {
        this.createFilterControls();
        this.createSearchInput();
        this.attachScrollListener();
        this.addDefaultMessage('system', 'Добро пожаловать в Техасский Холдем!');
        this.addDefaultMessage('system', 'Игра началась.');
    }

    createFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'log-filters';
        filterContainer.style.display = 'flex';
        filterContainer.style.gap = '8px';
        filterContainer.style.padding = '5px 10px';
        filterContainer.style.borderBottom = '1px solid #444';
        const types = ['system', 'player', 'ai', 'winner'];
        const labels = { system: 'Система', player: 'Игрок', ai: 'AI', winner: 'Победитель' };
        for (let type of types) {
            const btn = document.createElement('button');
            btn.textContent = labels[type];
            btn.style.backgroundColor = '#3a3a3a';
            btn.style.color = '#ccc';
            btn.style.border = 'none';
            btn.style.padding = '2px 8px';
            btn.style.borderRadius = '12px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '11px';
            btn.dataset.type = type;
            btn.addEventListener('click', () => this.toggleFilter(type, btn));
            filterContainer.appendChild(btn);
            this.filterButtons = this.filterButtons || {};
            this.filterButtons[type] = btn;
        }
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Сбросить';
        clearBtn.style.backgroundColor = '#cc4444';
        clearBtn.style.color = 'white';
        clearBtn.style.border = 'none';
        clearBtn.style.padding = '2px 8px';
        clearBtn.style.borderRadius = '12px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.fontSize = '11px';
        clearBtn.addEventListener('click', () => this.resetFilters());
        filterContainer.appendChild(clearBtn);
        this.logContainer.parentElement.insertBefore(filterContainer, this.logContainer);
    }

    createSearchInput() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'log-search';
        searchContainer.style.display = 'flex';
        searchContainer.style.gap = '5px';
        searchContainer.style.padding = '5px 10px';
        searchContainer.style.borderBottom = '1px solid #444';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Поиск...';
        input.style.flex = '1';
        input.style.backgroundColor = '#2a2a2a';
        input.style.color = '#fff';
        input.style.border = '1px solid #555';
        input.style.borderRadius = '15px';
        input.style.padding = '4px 10px';
        input.style.fontSize = '12px';
        input.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        const clearSearch = document.createElement('button');
        clearSearch.textContent = '✖';
        clearSearch.style.backgroundColor = '#555';
        clearSearch.style.color = 'white';
        clearSearch.style.border = 'none';
        clearSearch.style.borderRadius = '15px';
        clearSearch.style.padding = '4px 8px';
        clearSearch.style.cursor = 'pointer';
        clearSearch.addEventListener('click', () => {
            input.value = '';
            this.searchQuery = '';
            this.render();
        });
        searchContainer.appendChild(input);
        searchContainer.appendChild(clearSearch);
        this.logContainer.parentElement.insertBefore(searchContainer, this.logContainer);
        this.searchInput = input;
    }

    attachScrollListener() {
        if (this.logContainer) {
            this.logContainer.addEventListener('scroll', () => {
                const isAtBottom = this.logContainer.scrollHeight - this.logContainer.scrollTop <= this.logContainer.clientHeight + 10;
                this.autoScroll = isAtBottom;
            });
        }
    }

    toggleFilter(type, btn) {
        if (this.filteredTypes.has(type)) {
            this.filteredTypes.delete(type);
            btn.style.backgroundColor = '#3a3a3a';
            btn.style.color = '#ccc';
        } else {
            this.filteredTypes.add(type);
            btn.style.backgroundColor = '#ffaa66';
            btn.style.color = '#000';
        }
        this.render();
    }

    resetFilters() {
        this.filteredTypes.clear();
        for (let [type, btn] of Object.entries(this.filterButtons || {})) {
            btn.style.backgroundColor = '#3a3a3a';
            btn.style.color = '#ccc';
        }
        this.render();
    }

    addMessage(type, message, options = {}) {
        if (!window.shouldLog(options.level || 'info')) return;
        const entry = {
            id: Date.now() + Math.random(),
            type: type,
            message: message,
            timestamp: Date.now(),
            level: options.level || 'info',
            phase: options.phase || null,
            playerId: options.playerId || null
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
        this.render();
        if (this.autoScroll && this.logContainer) {
            setTimeout(() => {
                this.logContainer.scrollTop = this.logContainer.scrollHeight;
            }, 50);
        }
    }

    addDefaultMessage(type, message) {
        this.addMessage(type, message, { level: 'info' });
    }

    addSystemMessage(message, options = {}) {
        this.addMessage('system', message, options);
    }

    addPlayerMessage(playerName, message, options = {}) {
        this.addMessage('player', `${playerName}: ${message}`, options);
    }

    addAIMessage(aiName, message, options = {}) {
        this.addMessage('ai', `${aiName}: ${message}`, options);
    }

    addWinnerMessage(winnerName, potAmount, handDescription = '', options = {}) {
        let msg = `${winnerName} выигрывает ${potAmount}`;
        if (handDescription) msg += ` с комбинацией ${handDescription}`;
        this.addMessage('winner', msg, { ...options, level: 'winner' });
    }

    addActionLog(player, action, amount, currentBet) {
        const msg = window.getActionLogMessage(player, action, amount, currentBet);
        const type = player.isHuman ? 'player' : 'ai';
        this.addMessage(type, msg, { playerId: player.id });
    }

    addPhaseMessage(phase) {
        const msg = window.getPhaseStartMessage(phase);
        if (msg) this.addSystemMessage(msg, { phase: phase });
    }

    addError(message) {
        this.addMessage('system', `Ошибка: ${message}`, { level: 'error' });
    }

    addWarning(message) {
        this.addMessage('system', `Предупреждение: ${message}`, { level: 'warn' });
    }

    addDebug(message) {
        if (this.logLevel === 'debug') {
            this.addMessage('system', `[DEBUG] ${message}`, { level: 'debug' });
        }
    }

    render() {
        if (!this.logContainer) return;
        const filtered = this.entries.filter(entry => {
            if (this.filteredTypes.size > 0 && !this.filteredTypes.has(entry.type)) return false;
            if (this.searchQuery && !entry.message.toLowerCase().includes(this.searchQuery)) return false;
            return true;
        });
        this.logContainer.innerHTML = '';
        for (let entry of filtered) {
            const div = document.createElement('div');
            div.className = `log-entry ${entry.type}`;
            div.setAttribute('data-id', entry.id);
            let content = '';
            if (this.timestampEnabled) {
                const date = new Date(entry.timestamp);
                const timeStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`;
                content += `[${timeStr}] `;
            }
            content += entry.message;
            div.textContent = content;
            if (entry.phase) div.setAttribute('data-phase', entry.phase);
            if (entry.playerId) div.setAttribute('data-player', entry.playerId);
            this.logContainer.appendChild(div);
        }
        if (filtered.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'log-entry empty';
            emptyDiv.textContent = 'Нет сообщений';
            emptyDiv.style.color = '#888';
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '20px';
            this.logContainer.appendChild(emptyDiv);
        }
    }

    clear() {
        this.entries = [];
        this.render();
    }

    setMaxEntries(max) {
        this.maxEntries = max;
        while (this.entries.length > this.maxEntries) this.entries.shift();
        this.render();
    }

    setLogLevel(level) {
        this.logLevel = level;
    }

    setTimestampEnabled(enabled) {
        this.timestampEnabled = enabled;
        this.render();
    }

    exportLog() {
        const lines = this.entries.map(e => {
            const date = new Date(e.timestamp);
            return `[${date.toISOString()}] [${e.type.toUpperCase()}] ${e.message}`;
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poker_log_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importLog(data) {
        try {
            const lines = data.split('\n');
            for (let line of lines) {
                const match = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
                if (match) {
                    const timestamp = new Date(match[1]).getTime();
                    const type = match[2].toLowerCase();
                    const message = match[3];
                    this.entries.push({ id: Date.now() + Math.random(), type, message, timestamp });
                }
            }
            this.render();
        } catch(e) {
            this.addError('Ошибка импорта лога');
        }
    }

    addCustomMessage(type, message, color = null, icon = null) {
        const div = document.createElement('div');
        div.className = `log-entry custom`;
        if (icon) div.innerHTML = `${icon} ${message}`;
        else div.textContent = message;
        if (color) div.style.color = color;
        this.logContainer.appendChild(div);
        if (this.autoScroll) this.logContainer.scrollTop = this.logContainer.scrollHeight;
        setTimeout(() => div.remove(), 5000);
    }

    highlightLastMessage(duration = 2000) {
        const last = this.logContainer.lastChild;
        if (last) {
            last.style.backgroundColor = '#ffaa66';
            last.style.color = '#000';
            setTimeout(() => {
                last.style.backgroundColor = '';
                last.style.color = '';
            }, duration);
        }
    }

    showStatistics(players) {
        this.addSystemMessage('=== Статистика игры ===');
        for (let p of players) {
            let stats = `${p.name}: фишки ${p.chips}`;
            if (p.handsPlayed) stats += `, руки ${p.handsPlayed}`;
            if (p.handsWon) stats += `, победы ${p.handsWon}`;
            this.addSystemMessage(stats);
        }
        if (window.gameState && window.gameState.potManager) {
            this.addSystemMessage(`Общий банк: ${window.gameState.potManager.getTotal()}`);
        }
    }

    showHandSummary(handNumber, winnerNames, potAmount, handDescription) {
        this.addWinnerMessage(winnerNames.join(', '), potAmount, handDescription, { level: 'winner' });
        this.addSystemMessage(`--- Раздача #${handNumber} завершена ---`);
    }

    setAutoScroll(enabled) {
        this.autoScroll = enabled;
    }

    scrollToBottom() {
        if (this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }

    scrollToTop() {
        if (this.logContainer) this.logContainer.scrollTop = 0;
    }

    getEntryCount() {
        return this.entries.length;
    }

    getFilteredEntryCount() {
        return this.logContainer ? this.logContainer.children.length : 0;
    }

    addDivider() {
        const divider = document.createElement('div');
        divider.className = 'log-divider';
        divider.textContent = '───── ' + new Date().toLocaleTimeString() + ' ─────';
        divider.style.textAlign = 'center';
        divider.style.color = '#888';
        divider.style.padding = '5px';
        divider.style.borderTop = '1px solid #444';
        this.logContainer.appendChild(divider);
        if (this.autoScroll) this.scrollToBottom();
    }

    addHandStartMessage(handNumber, dealerName) {
        this.addSystemMessage(`=== Начало раздачи #${handNumber} ===`);
        this.addSystemMessage(`Дилер: ${dealerName}`);
    }

    addBlindMessage(playerName, blindType, amount) {
        this.addSystemMessage(`${playerName} ставит ${blindType} ${amount}`);
    }

    addCommunityCardMessage(cards) {
        this.addSystemMessage(`Общие карты: ${cards.map(c => c.toString()).join(', ')}`);
    }

    addShowdownMessage(players) {
        this.addSystemMessage('=== Шоудаун ===');
        for (let p of players) {
            if (!p.folded && p.hand.length) {
                const eval = window.getBestHandFromCards([...p.hand, ...window.gameState.communityCards]);
                const handDesc = eval ? window.getHandStrengthDescription(eval) : 'нет комбинации';
                this.addMessage('player', `${p.name}: ${p.hand.map(c=>c.toString()).join(' ')} - ${handDesc}`, { playerId: p.id });
            }
        }
    }

    addWinnersMessage(winners, potAmount) {
        if (winners.length === 1) {
            this.addWinnerMessage(winners[0].name, potAmount);
        } else {
            const share = Math.floor(potAmount / winners.length);
            this.addWinnerMessage(winners.map(w => w.name).join(', '), potAmount, `каждый получает ${share}`);
        }
    }

    addErrorMessage(message) {
        this.addError(message);
    }

    addWarningMessage(message) {
        this.addWarning(message);
    }

    addDebugMessage(message) {
        this.addDebug(message);
    }

    clearAndAddWelcome() {
        this.clear();
        this.addDefaultMessage('system', 'Добро пожаловать в Техасский Холдем!');
        this.addDefaultMessage('system', 'Игра началась.');
    }

    setLogContainer(container) {
        this.logContainer = container;
        this.init();
    }

    destroy() {
        if (this.logContainer) this.logContainer.innerHTML = '';
        this.entries = [];
        this.filteredTypes.clear();
        this.searchQuery = '';
    }
};

window.ViewLog = window.ViewLog;

console.log('view_Log.js loaded');
