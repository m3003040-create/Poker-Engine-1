window.ViewSettingsModal = class ViewSettingsModal {
    constructor() {
        this.modal = document.getElementById('settingsModal');
        this.settingsButton = document.getElementById('settingsButton');
        this.closeButton = document.querySelector('.close-button');
        this.saveButton = document.getElementById('saveSettingsBtn');
        this.cancelButton = document.getElementById('cancelSettingsBtn');
        this.form = document.getElementById('settingsForm');
        this.playerCountInput = document.getElementById('playerCount');
        this.startChipsInput = document.getElementById('startChips');
        this.smallBlindInput = document.getElementById('smallBlind');
        this.bigBlindInput = document.getElementById('bigBlind');
        this.aiAggressionSlider = document.getElementById('aiAggression');
        this.aiAggressionValue = document.getElementById('aiAggressionValue');
        this.animationSpeedSlider = document.getElementById('animationSpeed');
        this.animationSpeedValue = document.getElementById('animationSpeedValue');
        this.isOpen = false;
        this.onSaveCallbacks = [];
        this.onCancelCallbacks = [];
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadSettingsToForm();
    }

    attachEventListeners() {
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => this.open());
        }
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => this.save());
        }
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this.cancel());
        }
        if (this.aiAggressionSlider && this.aiAggressionValue) {
            this.aiAggressionSlider.addEventListener('input', (e) => {
                this.aiAggressionValue.textContent = e.target.value;
            });
        }
        if (this.animationSpeedSlider && this.animationSpeedValue) {
            this.animationSpeedSlider.addEventListener('input', (e) => {
                this.animationSpeedValue.textContent = e.target.value;
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    loadSettingsToForm() {
        const gameConfig = window.getGameConfig();
        const uiConfig = window.getUIConfig();
        const aiConfig = window.getAIConfig();
        if (this.playerCountInput) this.playerCountInput.value = gameConfig.playerCount;
        if (this.startChipsInput) this.startChipsInput.value = gameConfig.startChips;
        if (this.smallBlindInput) this.smallBlindInput.value = gameConfig.smallBlind;
        if (this.bigBlindInput) this.bigBlindInput.value = gameConfig.bigBlind;
        if (this.aiAggressionSlider) {
            this.aiAggressionSlider.value = aiConfig.aggressionBase;
            if (this.aiAggressionValue) this.aiAggressionValue.textContent = aiConfig.aggressionBase;
        }
        if (this.animationSpeedSlider) {
            this.animationSpeedSlider.value = uiConfig.animationSpeed;
            if (this.animationSpeedValue) this.animationSpeedValue.textContent = uiConfig.animationSpeed;
        }
    }

    getSettingsFromForm() {
        const gameConfig = {
            playerCount: parseInt(this.playerCountInput?.value) || 6,
            startChips: parseInt(this.startChipsInput?.value) || 1000,
            smallBlind: parseInt(this.smallBlindInput?.value) || 10,
            bigBlind: parseInt(this.bigBlindInput?.value) || 20
        };
        const aiConfig = {
            aggressionBase: parseInt(this.aiAggressionSlider?.value) || 5
        };
        const uiConfig = {
            animationSpeed: parseInt(this.animationSpeedSlider?.value) || 300
        };
        return { gameConfig, aiConfig, uiConfig };
    }

    validateSettings(gameConfig, aiConfig, uiConfig) {
        const errors = [];
        if (gameConfig.playerCount < 2 || gameConfig.playerCount > 6) errors.push('Количество игроков должно быть от 2 до 6');
        if (gameConfig.startChips < 100 || gameConfig.startChips > 10000) errors.push('Стартовые фишки должны быть от 100 до 10000');
        if (gameConfig.smallBlind < 5 || gameConfig.smallBlind > 200) errors.push('Малый блайнд должен быть от 5 до 200');
        if (gameConfig.bigBlind < 10 || gameConfig.bigBlind > 400) errors.push('Большой блайнд должен быть от 10 до 400');
        if (gameConfig.smallBlind >= gameConfig.bigBlind) errors.push('Малый блайнд должен быть меньше большого');
        if (aiConfig.aggressionBase < 1 || aiConfig.aggressionBase > 10) errors.push('Агрессивность ИИ должна быть от 1 до 10');
        if (uiConfig.animationSpeed < 0 || uiConfig.animationSpeed > 2000) errors.push('Скорость анимации должна быть от 0 до 2000');
        return errors;
    }

    showValidationErrors(errors) {
        const errorDiv = document.getElementById('settingsErrors') || this.createErrorContainer();
        errorDiv.innerHTML = errors.map(e => `<div style="color: #ff8888;">⚠️ ${e}</div>`).join('');
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }

    createErrorContainer() {
        const div = document.createElement('div');
        div.id = 'settingsErrors';
        div.style.position = 'absolute';
        div.style.bottom = '100%';
        div.style.left = '0';
        div.style.right = '0';
        div.style.backgroundColor = 'rgba(0,0,0,0.8)';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '10px';
        div.style.fontSize = '12px';
        div.style.display = 'none';
        const modalContent = this.modal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.position = 'relative';
            modalContent.appendChild(div);
        }
        return div;
    }

    save() {
        const { gameConfig, aiConfig, uiConfig } = this.getSettingsFromForm();
        const errors = this.validateSettings(gameConfig, aiConfig, uiConfig);
        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return;
        }
        const currentGameConfig = window.getGameConfig();
        const newGameConfig = { ...currentGameConfig, ...gameConfig };
        window.setGameConfig(newGameConfig);
        const currentAIConfig = window.getAIConfig();
        const newAIConfig = { ...currentAIConfig, ...aiConfig };
        window.setAIConfig(newAIConfig);
        const currentUIConfig = window.getUIConfig();
        const newUIConfig = { ...currentUIConfig, ...uiConfig };
        window.setUIConfig(newUIConfig);
        this.triggerOnSave(newGameConfig, newAIConfig, newUIConfig);
        this.close();
        if (window.gameController && window.gameController.resetGame) {
            window.gameController.resetGame();
        } else if (window.location) {
            window.location.reload();
        }
    }

    cancel() {
        this.triggerOnCancel();
        this.close();
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.isOpen = true;
            this.loadSettingsToForm();
            this.addThemeSelector();
            this.addAdditionalControls();
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
        }
    }

    addThemeSelector() {
        const themeContainer = document.getElementById('themeSelectorContainer');
        if (themeContainer) return;
        const container = document.createElement('div');
        container.id = 'themeSelectorContainer';
        container.style.marginTop = '15px';
        const label = document.createElement('label');
        label.textContent = 'Тема:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        const select = document.createElement('select');
        select.id = 'themeSelect';
        select.style.width = '100%';
        select.style.padding = '8px';
        select.style.borderRadius = '8px';
        select.style.backgroundColor = '#3e3e3e';
        select.style.color = 'white';
        select.style.border = 'none';
        const themes = ['dark', 'light', 'classic', 'neon'];
        const currentTheme = window.getCurrentTheme();
        for (let theme of themes) {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            if (theme === currentTheme) option.selected = true;
            select.appendChild(option);
        }
        select.addEventListener('change', (e) => {
            window.setTheme(e.target.value);
        });
        container.appendChild(label);
        container.appendChild(select);
        const form = document.getElementById('settingsForm');
        if (form) form.appendChild(container);
    }

    addAdditionalControls() {
        const controlsContainer = document.getElementById('additionalControls');
        if (controlsContainer) return;
        const container = document.createElement('div');
        container.id = 'additionalControls';
        container.style.marginTop = '15px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        const soundCheckbox = this.createCheckbox('soundEnabled', 'Включить звук', window.isSoundEnabled());
        const cardAnimCheckbox = this.createCheckbox('cardAnimations', 'Анимации карт', window.isCardAnimationsEnabled());
        const chipAnimCheckbox = this.createCheckbox('chipAnimations', 'Анимации фишек', window.isChipAnimationsEnabled());
        const confirmFoldCheckbox = this.createCheckbox('confirmFold', 'Подтверждение фолда', window.isConfirmBeforeFold());
        const autoCheckFoldCheckbox = this.createCheckbox('autoCheckFold', 'Авто-чек/фолд', window.isAutoCheckFold());
        const keyboardCheckbox = this.createCheckbox('keyboardShortcuts', 'Горячие клавиши', window.isKeyboardShortcutsEnabled());
        const compactCheckbox = this.createCheckbox('compactMode', 'Компактный режим', window.isCompactMode());
        soundCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.soundEnabled = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        cardAnimCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.showCardAnimations = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        chipAnimCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.showChipAnimations = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        confirmFoldCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.confirmBeforeFold = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        autoCheckFoldCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.autoCheckFold = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        keyboardCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.enableKeyboardShortcuts = e.target.checked;
            window.setUIConfig(uiConfig);
        });
        compactCheckbox.addEventListener('change', (e) => {
            const uiConfig = window.getUIConfig();
            uiConfig.compactMode = e.target.checked;
            window.setUIConfig(uiConfig);
            if (window.ViewGame && window.viewGame) window.viewGame.updateResponsivePositions?.();
        });
        container.appendChild(soundCheckbox);
        container.appendChild(cardAnimCheckbox);
        container.appendChild(chipAnimCheckbox);
        container.appendChild(confirmFoldCheckbox);
        container.appendChild(autoCheckFoldCheckbox);
        container.appendChild(keyboardCheckbox);
        container.appendChild(compactCheckbox);
        const form = document.getElementById('settingsForm');
        if (form) form.appendChild(container);
    }

    createCheckbox(id, labelText, checked) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = checked;
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
        label.style.margin = '0';
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        return wrapper;
    }

    addCustomControl(labelText, controlElement) {
        const container = document.getElementById('customControls') || this.createCustomControlsContainer();
        const wrapper = document.createElement('div');
        wrapper.style.marginTop = '10px';
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        wrapper.appendChild(label);
        wrapper.appendChild(controlElement);
        container.appendChild(wrapper);
    }

    createCustomControlsContainer() {
        const container = document.createElement('div');
        container.id = 'customControls';
        container.style.marginTop = '15px';
        const form = document.getElementById('settingsForm');
        if (form) form.appendChild(container);
        return container;
    }

    addResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.textContent = 'Сбросить настройки по умолчанию';
        resetBtn.style.backgroundColor = '#cc4444';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.padding = '8px 16px';
        resetBtn.style.borderRadius = '30px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.marginTop = '15px';
        resetBtn.style.width = '100%';
        resetBtn.addEventListener('click', () => {
            if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
                window.resetGameConfig();
                window.resetAIConfig();
                window.resetUIConfig();
                this.loadSettingsToForm();
                const themeSelect = document.getElementById('themeSelect');
                if (themeSelect) themeSelect.value = 'dark';
                const soundChk = document.getElementById('soundEnabled');
                if (soundChk) soundChk.checked = false;
                const cardAnimChk = document.getElementById('cardAnimations');
                if (cardAnimChk) cardAnimChk.checked = true;
                const chipAnimChk = document.getElementById('chipAnimations');
                if (chipAnimChk) chipAnimChk.checked = true;
                const confirmFoldChk = document.getElementById('confirmFold');
                if (confirmFoldChk) confirmFoldChk.checked = true;
                const autoCheckFoldChk = document.getElementById('autoCheckFold');
                if (autoCheckFoldChk) autoCheckFoldChk.checked = false;
                const keyboardChk = document.getElementById('keyboardShortcuts');
                if (keyboardChk) keyboardChk.checked = true;
                const compactChk = document.getElementById('compactMode');
                if (compactChk) compactChk.checked = false;
                this.showMessage('Настройки сброшены', 'success');
            }
        });
        const modalButtons = document.querySelector('.modal-buttons');
        if (modalButtons) modalButtons.parentNode.insertBefore(resetBtn, modalButtons);
    }

    showMessage(message, type = 'info') {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '20px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = type === 'success' ? '#4caf50' : '#ffaa66';
        msgDiv.style.color = 'white';
        msgDiv.style.padding = '8px 16px';
        msgDiv.style.borderRadius = '30px';
        msgDiv.style.zIndex = '10000';
        msgDiv.style.fontWeight = 'bold';
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2000);
    }

    onSave(callback) {
        this.onSaveCallbacks.push(callback);
    }

    onCancel(callback) {
        this.onCancelCallbacks.push(callback);
    }

    triggerOnSave(gameConfig, aiConfig, uiConfig) {
        for (let cb of this.onSaveCallbacks) {
            try { cb(gameConfig, aiConfig, uiConfig); } catch(e) { console.warn(e); }
        }
    }

    triggerOnCancel() {
        for (let cb of this.onCancelCallbacks) {
            try { cb(); } catch(e) { console.warn(e); }
        }
    }

    setModalContent(content) {
        if (this.modal && this.modal.querySelector('.modal-content')) {
            const contentDiv = this.modal.querySelector('.modal-content');
            contentDiv.innerHTML = content;
            this.reattachEvents();
        }
    }

    reattachEvents() {
        this.closeButton = document.querySelector('.close-button');
        this.saveButton = document.getElementById('saveSettingsBtn');
        this.cancelButton = document.getElementById('cancelSettingsBtn');
        if (this.closeButton) this.closeButton.addEventListener('click', () => this.close());
        if (this.saveButton) this.saveButton.addEventListener('click', () => this.save());
        if (this.cancelButton) this.cancelButton.addEventListener('click', () => this.cancel());
    }

    addTabNavigation(tabs) {
        const container = document.createElement('div');
        container.className = 'settings-tabs';
        container.style.display = 'flex';
        container.style.gap = '5px';
        container.style.marginBottom = '15px';
        for (let tab of tabs) {
            const btn = document.createElement('button');
            btn.textContent = tab.label;
            btn.style.flex = '1';
            btn.style.padding = '8px';
            btn.style.backgroundColor = '#3a3a3a';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '8px';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => {
                for (let b of container.children) b.style.backgroundColor = '#3a3a3a';
                btn.style.backgroundColor = '#ffaa66';
                tab.callback();
            });
            container.appendChild(btn);
        }
        const form = document.getElementById('settingsForm');
        if (form) form.insertBefore(container, form.firstChild);
    }

    destroy() {
        if (this.modal) this.modal.remove();
        if (this.settingsButton) this.settingsButton.removeEventListener('click', this.open);
        this.onSaveCallbacks = [];
        this.onCancelCallbacks = [];
    }
};

window.ViewSettingsModal = window.ViewSettingsModal;

console.log('view_SettingsModal.js loaded');
