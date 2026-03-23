window.DEFAULT_UI_CONFIG = {
    theme: 'dark',
    animationSpeed: 300,
    cardDealDelay: 150,
    chipMoveDuration: 200,
    showLog: true,
    logMaxEntries: 100,
    logLevel: 'info',
    showPlayerAvatars: true,
    showCardAnimations: true,
    showChipAnimations: true,
    soundEnabled: false,
    soundVolume: 0.5,
    autoCenterCards: true,
    cardBackDesign: 'classic',
    highlightActivePlayer: true,
    highlightWinner: true,
    showPotBreakdown: true,
    showHandStrength: true,
    showActionHistory: true,
    buttonLayout: 'horizontal',
    confirmBeforeFold: true,
    confirmBeforeRaise: false,
    autoCheckFold: false,
    autoCheckFoldDelay: 10,
    enableKeyboardShortcuts: true,
    showTooltips: true,
    tooltipDelay: 500,
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    cardWidth: 70,
    cardHeight: 95,
    tableBackground: 'green',
    tableStyle: 'felt',
    enableBlurEffects: true,
    showDealerButton: true,
    showPhaseIndicator: true,
    showTurnIndicator: true,
    compactMode: false,
    mobileOptimized: true,
    language: 'ru',
    dateFormat: 'HH:MM:SS',
    logTimestamp: true,
    showFPS: false
};

window.UI_THEMES = {
    dark: {
        background: '#1a1a2e',
        tableColor: '#0f6e3a',
        textColor: '#ffffff',
        cardBackground: '#ffffff',
        cardTextColor: '#000000',
        buttonBackground: '#2c2c2c',
        buttonTextColor: '#ffffff',
        logBackground: '#1e1e1e',
        logTextColor: '#cccccc'
    },
    light: {
        background: '#f0f0f0',
        tableColor: '#2e8b57',
        textColor: '#333333',
        cardBackground: '#ffffff',
        cardTextColor: '#000000',
        buttonBackground: '#dddddd',
        buttonTextColor: '#333333',
        logBackground: '#fafafa',
        logTextColor: '#333333'
    },
    classic: {
        background: '#2c3e2c',
        tableColor: '#1a5a2a',
        textColor: '#f5e6d3',
        cardBackground: '#fff5e6',
        cardTextColor: '#2c2c2c',
        buttonBackground: '#b87c4f',
        buttonTextColor: '#ffffff',
        logBackground: '#2d2d2d',
        logTextColor: '#dddddd'
    },
    neon: {
        background: '#0a0f1a',
        tableColor: '#00ff9d',
        textColor: '#00ff9d',
        cardBackground: '#111111',
        cardTextColor: '#00ff9d',
        buttonBackground: '#1f3a2f',
        buttonTextColor: '#00ff9d',
        logBackground: '#0a0f1a',
        logTextColor: '#00ff9d'
    }
};

window.getUIConfig = function() {
    const saved = window.loadFromStorage('uiConfig');
    if (saved) return { ...window.DEFAULT_UI_CONFIG, ...saved };
    return { ...window.DEFAULT_UI_CONFIG };
};

window.setUIConfig = function(newConfig) {
    const current = window.getUIConfig();
    const updated = { ...current, ...newConfig };
    window.saveToStorage('uiConfig', updated);
    window.applyTheme(updated.theme);
    return updated;
};

window.resetUIConfig = function() {
    window.saveToStorage('uiConfig', window.DEFAULT_UI_CONFIG);
    window.applyTheme(window.DEFAULT_UI_CONFIG.theme);
    return { ...window.DEFAULT_UI_CONFIG };
};

window.getAnimationSpeed = function() {
    return window.getUIConfig().animationSpeed;
};

window.setAnimationSpeed = function(speed) {
    const config = window.getUIConfig();
    config.animationSpeed = Math.max(0, Math.min(2000, speed));
    window.setUIConfig(config);
};

window.getCardDealDelay = function() {
    return window.getUIConfig().cardDealDelay;
};

window.getChipMoveDuration = function() {
    return window.getUIConfig().chipMoveDuration;
};

window.isLogEnabled = function() {
    return window.getUIConfig().showLog;
};

window.getLogMaxEntries = function() {
    return window.getUIConfig().logMaxEntries;
};

window.getLogLevel = function() {
    return window.getUIConfig().logLevel;
};

window.isSoundEnabled = function() {
    return window.getUIConfig().soundEnabled;
};

window.getSoundVolume = function() {
    return window.getUIConfig().soundVolume;
};

window.isCardAnimationsEnabled = function() {
    return window.getUIConfig().showCardAnimations;
};

window.isChipAnimationsEnabled = function() {
    return window.getUIConfig().showChipAnimations;
};

window.isAutoCenterCards = function() {
    return window.getUIConfig().autoCenterCards;
};

window.getCardBackDesign = function() {
    return window.getUIConfig().cardBackDesign;
};

window.isHighlightActivePlayer = function() {
    return window.getUIConfig().highlightActivePlayer;
};

window.isHighlightWinner = function() {
    return window.getUIConfig().highlightWinner;
};

window.isShowPotBreakdown = function() {
    return window.getUIConfig().showPotBreakdown;
};

window.isShowHandStrength = function() {
    return window.getUIConfig().showHandStrength;
};

window.isShowActionHistory = function() {
    return window.getUIConfig().showActionHistory;
};

window.getButtonLayout = function() {
    return window.getUIConfig().buttonLayout;
};

window.isConfirmBeforeFold = function() {
    return window.getUIConfig().confirmBeforeFold;
};

window.isConfirmBeforeRaise = function() {
    return window.getUIConfig().confirmBeforeRaise;
};

window.isAutoCheckFold = function() {
    return window.getUIConfig().autoCheckFold;
};

window.getAutoCheckFoldDelay = function() {
    return window.getUIConfig().autoCheckFoldDelay;
};

window.isKeyboardShortcutsEnabled = function() {
    return window.getUIConfig().enableKeyboardShortcuts;
};

window.isTooltipsEnabled = function() {
    return window.getUIConfig().showTooltips;
};

window.getTooltipDelay = function() {
    return window.getUIConfig().tooltipDelay;
};

window.getFontFamily = function() {
    return window.getUIConfig().fontFamily;
};

window.getCardWidth = function() {
    return window.getUIConfig().cardWidth;
};

window.getCardHeight = function() {
    return window.getUIConfig().cardHeight;
};

window.getTableBackground = function() {
    return window.getUIConfig().tableBackground;
};

window.getTableStyle = function() {
    return window.getUIConfig().tableStyle;
};

window.isBlurEffectsEnabled = function() {
    return window.getUIConfig().enableBlurEffects;
};

window.isDealerButtonVisible = function() {
    return window.getUIConfig().showDealerButton;
};

window.isPhaseIndicatorVisible = function() {
    return window.getUIConfig().showPhaseIndicator;
};

window.isTurnIndicatorVisible = function() {
    return window.getUIConfig().showTurnIndicator;
};

window.isCompactMode = function() {
    return window.getUIConfig().compactMode;
};

window.isMobileOptimized = function() {
    return window.getUIConfig().mobileOptimized;
};

window.getLanguage = function() {
    return window.getUIConfig().language;
};

window.getDateFormat = function() {
    return window.getUIConfig().dateFormat;
};

window.isLogTimestampEnabled = function() {
    return window.getUIConfig().logTimestamp;
};

window.isFPSDisplayEnabled = function() {
    return window.getUIConfig().showFPS;
};

window.getCurrentTheme = function() {
    return window.getUIConfig().theme;
};

window.setTheme = function(themeName) {
    if (window.UI_THEMES[themeName]) {
        const config = window.getUIConfig();
        config.theme = themeName;
        window.setUIConfig(config);
        return true;
    }
    return false;
};

window.applyTheme = function(themeName) {
    const theme = window.UI_THEMES[themeName] || window.UI_THEMES.dark;
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.background);
    root.style.setProperty('--table-color', theme.tableColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--card-bg', theme.cardBackground);
    root.style.setProperty('--card-text', theme.cardTextColor);
    root.style.setProperty('--button-bg', theme.buttonBackground);
    root.style.setProperty('--button-text', theme.buttonTextColor);
    root.style.setProperty('--log-bg', theme.logBackground);
    root.style.setProperty('--log-text', theme.logTextColor);
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.textColor;
};

window.getCardBackStyle = function() {
    const design = window.getCardBackDesign();
    switch (design) {
        case 'classic':
            return 'repeating-linear-gradient(45deg, #2c2c2c, #2c2c2c 10px, #3c3c3c 10px, #3c3c3c 20px)';
        case 'dots':
            return 'radial-gradient(circle at 30% 40%, #444 2px, transparent 2px), radial-gradient(circle at 70% 60%, #444 2px, transparent 2px)';
        case 'stripes':
            return 'linear-gradient(135deg, #2c2c2c 25%, #3c3c3c 25%, #3c3c3c 50%, #2c2c2c 50%, #2c2c2c 75%, #3c3c3c 75%)';
        default:
            return '#2c2c2c';
    }
};

window.getActionButtonStyle = function(action) {
    const color = window.getActionColor(action);
    return `background-color: ${color}; color: white; border-radius: 30px; padding: 10px 20px; font-weight: bold;`;
};

window.getPlayerPositionStyle = function(index, isActive) {
    let style = '';
    if (isActive && window.isHighlightActivePlayer()) {
        style = 'border: 2px solid gold; box-shadow: 0 0 10px gold;';
    }
    return style;
};

window.getWinnerHighlightStyle = function(isWinner) {
    if (isWinner && window.isHighlightWinner()) {
        return 'border: 3px solid gold; background: rgba(255, 215, 0, 0.2);';
    }
    return '';
};

window.getLogLevelPriority = function(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] !== undefined ? levels[level] : 1;
};

window.shouldLog = function(messageLevel) {
    const currentLevel = window.getLogLevel();
    return window.getLogLevelPriority(messageLevel) >= window.getLogLevelPriority(currentLevel);
};

window.getLogTimestamp = function() {
    if (!window.isLogTimestampEnabled()) return '';
    const now = new Date();
    const format = window.getDateFormat();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}] `;
};

window.getResponsiveCardSize = function() {
    if (window.innerWidth < 700) return { width: 50, height: 68 };
    if (window.innerWidth < 1000) return { width: 60, height: 82 };
    return { width: window.getCardWidth(), height: window.getCardHeight() };
};

window.getResponsiveFontSize = function() {
    if (window.innerWidth < 700) return '12px';
    if (window.innerWidth < 1000) return '14px';
    return '16px';
};

window.updateUIConfigFromModal = function(modalData) {
    const newConfig = {};
    if (modalData.theme) newConfig.theme = modalData.theme;
    if (modalData.animationSpeed !== undefined) newConfig.animationSpeed = modalData.animationSpeed;
    if (modalData.soundEnabled !== undefined) newConfig.soundEnabled = modalData.soundEnabled;
    if (modalData.cardAnimations !== undefined) newConfig.showCardAnimations = modalData.cardAnimations;
    if (modalData.chipAnimations !== undefined) newConfig.showChipAnimations = modalData.chipAnimations;
    if (modalData.confirmFold !== undefined) newConfig.confirmBeforeFold = modalData.confirmFold;
    if (modalData.autoCheckFold !== undefined) newConfig.autoCheckFold = modalData.autoCheckFold;
    if (modalData.keyboardShortcuts !== undefined) newConfig.enableKeyboardShortcuts = modalData.keyboardShortcuts;
    if (modalData.language) newConfig.language = modalData.language;
    if (modalData.compactMode !== undefined) newConfig.compactMode = modalData.compactMode;
    window.setUIConfig(newConfig);
};

window.getUIConfigForExport = function() {
    const config = window.getUIConfig();
    return {
        theme: config.theme,
        animationSpeed: config.animationSpeed,
        soundEnabled: config.soundEnabled,
        showCardAnimations: config.showCardAnimations,
        showChipAnimations: config.showChipAnimations,
        confirmBeforeFold: config.confirmBeforeFold,
        autoCheckFold: config.autoCheckFold,
        enableKeyboardShortcuts: config.enableKeyboardShortcuts,
        language: config.language,
        compactMode: config.compactMode
    };
};

window.getUIConfigValidationErrors = function(config) {
    const errors = [];
    if (config.animationSpeed < 0 || config.animationSpeed > 2000) errors.push('animationSpeed must be between 0 and 2000');
    if (config.cardDealDelay < 0 || config.cardDealDelay > 1000) errors.push('cardDealDelay must be between 0 and 1000');
    if (config.chipMoveDuration < 0 || config.chipMoveDuration > 1000) errors.push('chipMoveDuration must be between 0 and 1000');
    if (config.logMaxEntries < 10 || config.logMaxEntries > 1000) errors.push('logMaxEntries must be between 10 and 1000');
    if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) errors.push('invalid logLevel');
    if (config.soundVolume < 0 || config.soundVolume > 1) errors.push('soundVolume must be between 0 and 1');
    if (!['horizontal', 'vertical'].includes(config.buttonLayout)) errors.push('invalid buttonLayout');
    if (config.autoCheckFoldDelay < 0 || config.autoCheckFoldDelay > 60) errors.push('autoCheckFoldDelay must be between 0 and 60');
    if (config.tooltipDelay < 0 || config.tooltipDelay > 2000) errors.push('tooltipDelay must be between 0 and 2000');
    if (config.cardWidth < 40 || config.cardWidth > 120) errors.push('cardWidth must be between 40 and 120');
    if (config.cardHeight < 60 || config.cardHeight > 160) errors.push('cardHeight must be between 60 and 160');
    return errors;
};

window.initializeUI = function() {
    window.applyTheme(window.getCurrentTheme());
    if (window.isMobileOptimized()) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    if (window.isCompactMode()) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --bg-color: ${window.UI_THEMES.dark.background};
            --table-color: ${window.UI_THEMES.dark.tableColor};
            --text-color: ${window.UI_THEMES.dark.textColor};
            --card-bg: ${window.UI_THEMES.dark.cardBackground};
            --card-text: ${window.UI_THEMES.dark.cardTextColor};
            --button-bg: ${window.UI_THEMES.dark.buttonBackground};
            --button-text: ${window.UI_THEMES.dark.buttonTextColor};
            --log-bg: ${window.UI_THEMES.dark.logBackground};
            --log-text: ${window.UI_THEMES.dark.logTextColor};
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: ${window.getFontFamily()};
        }
        .poker-table {
            background-color: var(--table-color);
        }
        .card {
            background: var(--card-bg);
            color: var(--card-text);
            width: ${window.getCardWidth()}px;
            height: ${window.getCardHeight()}px;
        }
        .action-btn {
            background-color: var(--button-bg);
            color: var(--button-text);
        }
        .game-log {
            background-color: var(--log-bg);
            color: var(--log-text);
        }
        @media (max-width: 700px) {
            .card {
                width: ${window.getResponsiveCardSize().width}px;
                height: ${window.getResponsiveCardSize().height}px;
            }
        }
        @media (max-width: 700px) {
            body {
                font-size: ${window.getResponsiveFontSize()};
            }
        }
    `;
    document.head.appendChild(style);
};

window.DEFAULT_UI_CONFIG = window.DEFAULT_UI_CONFIG;
window.UI_THEMES = window.UI_THEMES;
window.getUIConfig = window.getUIConfig;
window.setUIConfig = window.setUIConfig;
window.resetUIConfig = window.resetUIConfig;
window.getAnimationSpeed = window.getAnimationSpeed;
window.setAnimationSpeed = window.setAnimationSpeed;
window.getCardDealDelay = window.getCardDealDelay;
window.getChipMoveDuration = window.getChipMoveDuration;
window.isLogEnabled = window.isLogEnabled;
window.getLogMaxEntries = window.getLogMaxEntries;
window.getLogLevel = window.getLogLevel;
window.isSoundEnabled = window.isSoundEnabled;
window.getSoundVolume = window.getSoundVolume;
window.isCardAnimationsEnabled = window.isCardAnimationsEnabled;
window.isChipAnimationsEnabled = window.isChipAnimationsEnabled;
window.isAutoCenterCards = window.isAutoCenterCards;
window.getCardBackDesign = window.getCardBackDesign;
window.isHighlightActivePlayer = window.isHighlightActivePlayer;
window.isHighlightWinner = window.isHighlightWinner;
window.isShowPotBreakdown = window.isShowPotBreakdown;
window.isShowHandStrength = window.isShowHandStrength;
window.isShowActionHistory = window.isShowActionHistory;
window.getButtonLayout = window.getButtonLayout;
window.isConfirmBeforeFold = window.isConfirmBeforeFold;
window.isConfirmBeforeRaise = window.isConfirmBeforeRaise;
window.isAutoCheckFold = window.isAutoCheckFold;
window.getAutoCheckFoldDelay = window.getAutoCheckFoldDelay;
window.isKeyboardShortcutsEnabled = window.isKeyboardShortcutsEnabled;
window.isTooltipsEnabled = window.isTooltipsEnabled;
window.getTooltipDelay = window.getTooltipDelay;
window.getFontFamily = window.getFontFamily;
window.getCardWidth = window.getCardWidth;
window.getCardHeight = window.getCardHeight;
window.getTableBackground = window.getTableBackground;
window.getTableStyle = window.getTableStyle;
window.isBlurEffectsEnabled = window.isBlurEffectsEnabled;
window.isDealerButtonVisible = window.isDealerButtonVisible;
window.isPhaseIndicatorVisible = window.isPhaseIndicatorVisible;
window.isTurnIndicatorVisible = window.isTurnIndicatorVisible;
window.isCompactMode = window.isCompactMode;
window.isMobileOptimized = window.isMobileOptimized;
window.getLanguage = window.getLanguage;
window.getDateFormat = window.getDateFormat;
window.isLogTimestampEnabled = window.isLogTimestampEnabled;
window.isFPSDisplayEnabled = window.isFPSDisplayEnabled;
window.getCurrentTheme = window.getCurrentTheme;
window.setTheme = window.setTheme;
window.applyTheme = window.applyTheme;
window.getCardBackStyle = window.getCardBackStyle;
window.getActionButtonStyle = window.getActionButtonStyle;
window.getPlayerPositionStyle = window.getPlayerPositionStyle;
window.getWinnerHighlightStyle = window.getWinnerHighlightStyle;
window.getLogLevelPriority = window.getLogLevelPriority;
window.shouldLog = window.shouldLog;
window.getLogTimestamp = window.getLogTimestamp;
window.getResponsiveCardSize = window.getResponsiveCardSize;
window.getResponsiveFontSize = window.getResponsiveFontSize;
window.updateUIConfigFromModal = window.updateUIConfigFromModal;
window.getUIConfigForExport = window.getUIConfigForExport;
window.getUIConfigValidationErrors = window.getUIConfigValidationErrors;
window.initializeUI = window.initializeUI;

console.log('config_ui.js loaded');
