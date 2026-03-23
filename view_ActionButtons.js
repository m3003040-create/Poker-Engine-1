window.ViewActionButtons = class ViewActionButtons {
    constructor() {
        this.panel = document.getElementById('actionPanel');
        this.foldBtn = document.getElementById('foldBtn');
        this.checkBtn = document.getElementById('checkBtn');
        this.callBtn = document.getElementById('callBtn');
        this.raiseBtn = document.getElementById('raiseBtn');
        this.allinBtn = document.getElementById('allinBtn');
        this.raiseSliderContainer = document.getElementById('raiseSliderContainer');
        this.raiseSlider = document.getElementById('raiseSlider');
        this.raiseAmountDisplay = document.getElementById('raiseAmountDisplay');
        this.currentRaiseAmount = 0;
        this.minRaise = 0;
        this.maxRaise = 0;
        this.currentBet = 0;
        this.currentPlayer = null;
        this.callAmount = 0;
        this.isVisible = false;
        this.actionHandlers = new Map();
        this.keyboardShortcuts = {
            'f': window.GameAction.FOLD,
            'c': window.GameAction.CHECK,
            'k': window.GameAction.CALL,
            'r': window.GameAction.RAISE,
            'a': window.GameAction.ALL_IN
        };
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.hideButtons();
        if (window.isKeyboardShortcutsEnabled()) {
            this.attachKeyboardListeners();
        }
    }

    attachEventListeners() {
        if (this.foldBtn) this.foldBtn.addEventListener('click', () => this.onAction(window.GameAction.FOLD));
        if (this.checkBtn) this.checkBtn.addEventListener('click', () => this.onAction(window.GameAction.CHECK));
        if (this.callBtn) this.callBtn.addEventListener('click', () => this.onAction(window.GameAction.CALL));
        if (this.raiseBtn) this.raiseBtn.addEventListener('click', () => this.onRaise());
        if (this.allinBtn) this.allinBtn.addEventListener('click', () => this.onAction(window.GameAction.ALL_IN));
        if (this.raiseSlider) {
            this.raiseSlider.addEventListener('input', (e) => this.updateRaiseAmount(parseInt(e.target.value)));
        }
    }

    attachKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            const key = e.key.toLowerCase();
            const action = this.keyboardShortcuts[key];
            if (action && this.isActionAvailable(action)) {
                e.preventDefault();
                if (action === window.GameAction.RAISE) {
                    this.onRaise();
                } else {
                    this.onAction(action);
                }
            }
        });
    }

    showButtons(availableActions, currentBet, minRaise, gamePhase) {
        this.currentBet = currentBet;
        this.minRaise = minRaise;
        this.isVisible = true;
        this.resetButtonStates();
        this.updateCallAmount();
        this.updateRaiseSlider(currentBet, minRaise);
        this.setButtonVisibility(availableActions);
        this.setButtonEnabledStates(availableActions);
        this.panel.style.display = 'flex';
    }

    hideButtons() {
        this.isVisible = false;
        this.panel.style.display = 'none';
        this.raiseSliderContainer.style.display = 'none';
    }

    resetButtonStates() {
        const buttons = [this.foldBtn, this.checkBtn, this.callBtn, this.raiseBtn, this.allinBtn];
        for (let btn of buttons) {
            if (btn) btn.disabled = true;
        }
    }

    setButtonVisibility(availableActions) {
        const visibility = {
            [window.GameAction.FOLD]: availableActions.includes(window.GameAction.FOLD),
            [window.GameAction.CHECK]: availableActions.includes(window.GameAction.CHECK),
            [window.GameAction.CALL]: availableActions.includes(window.GameAction.CALL),
            [window.GameAction.RAISE]: availableActions.includes(window.GameAction.RAISE),
            [window.GameAction.ALL_IN]: availableActions.includes(window.GameAction.ALL_IN)
        };
        if (this.foldBtn) this.foldBtn.style.display = visibility[window.GameAction.FOLD] ? 'inline-block' : 'none';
        if (this.checkBtn) this.checkBtn.style.display = visibility[window.GameAction.CHECK] ? 'inline-block' : 'none';
        if (this.callBtn) this.callBtn.style.display = visibility[window.GameAction.CALL] ? 'inline-block' : 'none';
        if (this.raiseBtn) this.raiseBtn.style.display = visibility[window.GameAction.RAISE] ? 'inline-block' : 'none';
        if (this.allinBtn) this.allinBtn.style.display = visibility[window.GameAction.ALL_IN] ? 'inline-block' : 'none';
        this.raiseSliderContainer.style.display = visibility[window.GameAction.RAISE] ? 'flex' : 'none';
    }

    setButtonEnabledStates(availableActions) {
        if (this.foldBtn) this.foldBtn.disabled = !availableActions.includes(window.GameAction.FOLD);
        if (this.checkBtn) this.checkBtn.disabled = !availableActions.includes(window.GameAction.CHECK);
        if (this.callBtn) this.callBtn.disabled = !availableActions.includes(window.GameAction.CALL);
        if (this.raiseBtn) this.raiseBtn.disabled = !availableActions.includes(window.GameAction.RAISE);
        if (this.allinBtn) this.allinBtn.disabled = !availableActions.includes(window.GameAction.ALL_IN);
    }

    updateCallAmount() {
        if (this.callBtn && this.currentPlayer) {
            const toCall = Math.max(0, this.currentBet - (this.currentPlayer.currentBet || 0));
            this.callAmount = toCall;
            if (toCall > 0) {
                this.callBtn.textContent = `${window.getActionName(window.GameAction.CALL)} ${toCall}`;
            } else {
                this.callBtn.textContent = window.getActionName(window.GameAction.CALL);
            }
        }
    }

    updateRaiseSlider(currentBet, minRaise) {
        if (!this.raiseSlider || !this.currentPlayer) return;
        const toCall = Math.max(0, currentBet - (this.currentPlayer.currentBet || 0));
        const minRaiseAmount = toCall + minRaise;
        const maxRaiseAmount = this.currentPlayer.chips + (this.currentPlayer.currentBet || 0);
        this.maxRaise = maxRaiseAmount;
        this.minRaise = minRaiseAmount;
        if (minRaiseAmount >= maxRaiseAmount) {
            this.raiseSlider.disabled = true;
            this.raiseAmountDisplay.textContent = maxRaiseAmount;
            this.currentRaiseAmount = maxRaiseAmount;
            return;
        }
        this.raiseSlider.disabled = false;
        this.raiseSlider.min = minRaiseAmount;
        this.raiseSlider.max = maxRaiseAmount;
        this.raiseSlider.step = Math.max(1, Math.floor((maxRaiseAmount - minRaiseAmount) / 100));
        let defaultAmount = Math.min(maxRaiseAmount, minRaiseAmount * 3);
        defaultAmount = Math.max(minRaiseAmount, defaultAmount);
        this.raiseSlider.value = defaultAmount;
        this.currentRaiseAmount = defaultAmount;
        this.raiseAmountDisplay.textContent = defaultAmount;
    }

    updateRaiseAmount(amount) {
        this.currentRaiseAmount = amount;
        this.raiseAmountDisplay.textContent = amount;
    }

    onAction(action) {
        if (!this.currentPlayer) return;
        if (window.isConfirmBeforeFold() && action === window.GameAction.FOLD) {
            if (!confirm(window.getActionConfirmationMessage(action, 0, this.currentPlayer))) {
                return;
            }
        }
        if (action === window.GameAction.RAISE) {
            this.onRaise();
            return;
        }
        let amount = 0;
        if (action === window.GameAction.CALL) {
            amount = this.callAmount;
        } else if (action === window.GameAction.ALL_IN) {
            amount = this.currentPlayer.chips;
        }
        const handler = this.actionHandlers.get(action);
        if (handler) {
            handler(action, amount);
        }
        this.hideButtons();
    }

    onRaise() {
        if (!this.currentPlayer) return;
        let raiseAmount = this.currentRaiseAmount;
        const toCall = Math.max(0, this.currentBet - (this.currentPlayer.currentBet || 0));
        if (raiseAmount < toCall + this.minRaise && raiseAmount < this.currentPlayer.chips + (this.currentPlayer.currentBet || 0)) {
            raiseAmount = toCall + this.minRaise;
        }
        if (raiseAmount > this.currentPlayer.chips + (this.currentPlayer.currentBet || 0)) {
            raiseAmount = this.currentPlayer.chips + (this.currentPlayer.currentBet || 0);
        }
        const finalAmount = raiseAmount - (this.currentPlayer.currentBet || 0);
        if (finalAmount <= 0) return;
        if (window.isConfirmBeforeRaise() && finalAmount > 0) {
            if (!confirm(window.getActionConfirmationMessage(window.GameAction.RAISE, finalAmount, this.currentPlayer))) {
                return;
            }
        }
        const handler = this.actionHandlers.get(window.GameAction.RAISE);
        if (handler) {
            handler(window.GameAction.RAISE, finalAmount);
        }
        this.hideButtons();
    }

    isActionAvailable(action) {
        if (!this.currentPlayer) return false;
        const available = window.getAvailableActions(this.currentPlayer, this.currentBet, this.minRaise, null);
        return available.includes(action);
    }

    setCurrentPlayer(player) {
        this.currentPlayer = player;
        this.updateCallAmount();
        if (this.isVisible && player && this.currentBet !== undefined) {
            this.updateRaiseSlider(this.currentBet, this.minRaise);
        }
    }

    registerActionHandler(action, handler) {
        this.actionHandlers.set(action, handler);
    }

    registerAllHandlers(handlers) {
        for (let [action, handler] of Object.entries(handlers)) {
            this.actionHandlers.set(action, handler);
        }
    }

    clearHandlers() {
        this.actionHandlers.clear();
    }

    setKeyboardShortcuts(shortcuts) {
        this.keyboardShortcuts = { ...this.keyboardShortcuts, ...shortcuts };
    }

    enableKeyboardShortcuts(enabled) {
        if (enabled) {
            this.attachKeyboardListeners();
        } else {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
    }

    updateButtonTexts() {
        if (this.foldBtn) this.foldBtn.textContent = window.getActionName(window.GameAction.FOLD);
        if (this.checkBtn) this.checkBtn.textContent = window.getActionName(window.GameAction.CHECK);
        if (this.callBtn) this.updateCallAmount();
        if (this.raiseBtn) this.raiseBtn.textContent = window.getActionName(window.GameAction.RAISE);
        if (this.allinBtn) this.allinBtn.textContent = window.getActionName(window.GameAction.ALL_IN);
    }

    setButtonColors() {
        if (this.foldBtn) this.foldBtn.style.backgroundColor = window.getActionColor(window.GameAction.FOLD);
        if (this.checkBtn) this.checkBtn.style.backgroundColor = window.getActionColor(window.GameAction.CHECK);
        if (this.callBtn) this.callBtn.style.backgroundColor = window.getActionColor(window.GameAction.CALL);
        if (this.raiseBtn) this.raiseBtn.style.backgroundColor = window.getActionColor(window.GameAction.RAISE);
        if (this.allinBtn) this.allinBtn.style.backgroundColor = window.getActionColor(window.GameAction.ALL_IN);
    }

    showAutoActionIndicator(seconds) {
        const indicator = document.getElementById('autoActionIndicator') || this.createAutoActionIndicator();
        indicator.textContent = `Авто-действие через ${seconds} сек`;
        indicator.style.display = 'block';
        if (this.autoActionTimeout) clearTimeout(this.autoActionTimeout);
        this.autoActionTimeout = setTimeout(() => {
            indicator.style.display = 'none';
        }, 1000);
    }

    createAutoActionIndicator() {
        const div = document.createElement('div');
        div.id = 'autoActionIndicator';
        div.style.position = 'fixed';
        div.style.bottom = '100px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.backgroundColor = 'rgba(0,0,0,0.7)';
        div.style.color = '#ffaa66';
        div.style.padding = '5px 10px';
        div.style.borderRadius = '20px';
        div.style.fontSize = '12px';
        div.style.zIndex = '2000';
        document.body.appendChild(div);
        return div;
    }

    setRaisePresets(presets) {
        if (!this.raiseSliderContainer) return;
        const presetContainer = document.createElement('div');
        presetContainer.className = 'raise-presets';
        presetContainer.style.display = 'flex';
        presetContainer.style.gap = '5px';
        for (let preset of presets) {
            const btn = document.createElement('button');
            btn.textContent = preset.label;
            btn.style.padding = '2px 8px';
            btn.style.fontSize = '12px';
            btn.onclick = () => {
                let amount = preset.value;
                if (typeof amount === 'function') amount = amount(this.currentPlayer, this.currentBet, this.minRaise);
                if (amount >= this.raiseSlider.min && amount <= this.raiseSlider.max) {
                    this.raiseSlider.value = amount;
                    this.updateRaiseAmount(amount);
                }
            };
            presetContainer.appendChild(btn);
        }
        this.raiseSliderContainer.appendChild(presetContainer);
    }

    getButtonState() {
        return {
            fold: this.foldBtn ? !this.foldBtn.disabled : false,
            check: this.checkBtn ? !this.checkBtn.disabled : false,
            call: this.callBtn ? !this.callBtn.disabled : false,
            raise: this.raiseBtn ? !this.raiseBtn.disabled : false,
            allIn: this.allinBtn ? !this.allinBtn.disabled : false
        };
    }

    disableAll() {
        if (this.foldBtn) this.foldBtn.disabled = true;
        if (this.checkBtn) this.checkBtn.disabled = true;
        if (this.callBtn) this.callBtn.disabled = true;
        if (this.raiseBtn) this.raiseBtn.disabled = true;
        if (this.allinBtn) this.allinBtn.disabled = true;
        if (this.raiseSlider) this.raiseSlider.disabled = true;
    }

    enableAll() {
        if (this.foldBtn) this.foldBtn.disabled = false;
        if (this.checkBtn) this.checkBtn.disabled = false;
        if (this.callBtn) this.callBtn.disabled = false;
        if (this.raiseBtn) this.raiseBtn.disabled = false;
        if (this.allinBtn) this.allinBtn.disabled = false;
        if (this.raiseSlider) this.raiseSlider.disabled = false;
    }

    reset() {
        this.hideButtons();
        this.currentPlayer = null;
        this.currentBet = 0;
        this.minRaise = 0;
        this.callAmount = 0;
        this.currentRaiseAmount = 0;
        this.actionHandlers.clear();
    }

    updateForNewPhase(currentBet, minRaise) {
        this.currentBet = currentBet;
        this.minRaise = minRaise;
        if (this.isVisible && this.currentPlayer) {
            this.updateCallAmount();
            this.updateRaiseSlider(currentBet, minRaise);
        }
    }

    setTheme(theme) {
        const colors = {
            fold: '#cc4444',
            check: '#3a6ea5',
            call: '#3a9e5a',
            raise: '#e09d32',
            allIn: '#cc3333'
        };
        if (this.foldBtn) this.foldBtn.style.backgroundColor = colors.fold;
        if (this.checkBtn) this.checkBtn.style.backgroundColor = colors.check;
        if (this.callBtn) this.callBtn.style.backgroundColor = colors.call;
        if (this.raiseBtn) this.raiseBtn.style.backgroundColor = colors.raise;
        if (this.allinBtn) this.allinBtn.style.backgroundColor = colors.allIn;
    }

    setButtonLayout(layout) {
        if (layout === 'vertical') {
            this.panel.style.flexDirection = 'column';
            this.panel.style.alignItems = 'stretch';
        } else {
            this.panel.style.flexDirection = 'row';
            this.panel.style.alignItems = 'center';
        }
    }

    showTemporaryMessage(message, duration = 2000) {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '80px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        msgDiv.style.color = '#ffd966';
        msgDiv.style.padding = '5px 15px';
        msgDiv.style.borderRadius = '20px';
        msgDiv.style.fontSize = '14px';
        msgDiv.style.zIndex = '2000';
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), duration);
    }

    setAutoCheckFold(enabled) {
        this.autoCheckFold = enabled;
        if (enabled && this.isVisible && this.checkBtn && !this.checkBtn.disabled) {
            setTimeout(() => {
                if (this.isVisible && this.checkBtn && !this.checkBtn.disabled) {
                    this.onAction(window.GameAction.CHECK);
                }
            }, window.getAutoCheckFoldDelay() * 1000);
        }
    }
};

window.ViewActionButtons = window.ViewActionButtons;

console.log('view_ActionButtons.js loaded');
