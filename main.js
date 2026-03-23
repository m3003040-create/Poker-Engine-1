(function() {
    let gameController = null;
    let viewGame = null;
    let viewLog = null;
    let viewActionButtons = null;
    let viewPot = null;
    let viewPlayer = null;
    let viewSettingsModal = null;
    let viewAnimation = null;
    let isInitialized = false;

    async function init() {
        if (isInitialized) return;
        isInitialized = true;

        info('Инициализация покерного движка...');

        try {
            await loadSettings();
            initializeViews();
            initializeGame();
            setupEventListeners();
            info('Инициализация завершена. Добро пожаловать в Техасский Холдем!');
        } catch (error) {
            error('Ошибка инициализации:', error);
            showFatalError(error.message);
        }
    }

    function loadSettings() {
        if (window.loadSettings) window.loadSettings();
        if (window.loadFromStorage) {
            const gameConfig = window.loadFromStorage('gameConfig');
            if (gameConfig) window.setGameConfig(gameConfig);
            const aiConfig = window.loadFromStorage('aiConfig');
            if (aiConfig) window.setAIConfig(aiConfig);
            const uiConfig = window.loadFromStorage('uiConfig');
            if (uiConfig) window.setUIConfig(uiConfig);
        }
        if (window.applyTheme && window.getCurrentTheme) window.applyTheme(window.getCurrentTheme());
    }

    function initializeViews() {
        viewGame = new window.ViewGame();
        viewLog = new window.ViewLog();
        viewActionButtons = new window.ViewActionButtons();
        viewPot = new window.ViewPot();
        viewPlayer = new window.ViewPlayer();
        viewAnimation = new window.ViewAnimation();
        viewSettingsModal = new window.ViewSettingsModal();

        window.viewGame = viewGame;
        window.viewLog = viewLog;
        window.viewActionButtons = viewActionButtons;
        window.viewPot = viewPot;
        window.viewPlayer = viewPlayer;
        window.viewAnimation = viewAnimation;
        window.viewSettingsModal = viewSettingsModal;
    }

    function initializeGame() {
        const config = window.getGameConfig();
        const players = createPlayers(config);
        const dealerIndex = 0;

        gameController = new window.GameController();
        gameController.initialize(players, dealerIndex);
        gameController.queueAction({ type: 'startHand' });

        window.gameController = gameController;
        window.gameState = gameController.gameState;

        viewActionButtons.registerAllHandlers({
            [window.GameAction.FOLD]: (action, amount) => handlePlayerAction(action, amount),
            [window.GameAction.CHECK]: (action, amount) => handlePlayerAction(action, amount),
            [window.GameAction.CALL]: (action, amount) => handlePlayerAction(action, amount),
            [window.GameAction.RAISE]: (action, amount) => handlePlayerAction(action, amount),
            [window.GameAction.ALL_IN]: (action, amount) => handlePlayerAction(action, amount)
        });

        function handlePlayerAction(action, amount) {
            if (gameController && gameController.gameState) {
                const currentPlayer = gameController.gameState.getCurrentPlayer();
                if (currentPlayer && currentPlayer.isHuman) {
                    gameController.handlePlayerAction(currentPlayer.id, action, amount);
                }
            }
        }
    }

    function createPlayers(config) {
        const players = [];
        const startChips = config.startChips;
        const playerCount = config.playerCount;

        players.push(new window.HumanPlayer(0, 'Вы', startChips));

        const styleSequence = [
            window.AI_STYLES.TIGHT,
            window.AI_STYLES.AGGRESSIVE,
            window.AI_STYLES.RANDOM,
            window.AI_STYLES.ADAPTIVE,
            window.AI_STYLES.LAG,
            window.AI_STYLES.TAG
        ];

        for (let i = 1; i < playerCount; i++) {
            const style = styleSequence[(i - 1) % styleSequence.length];
            const styleName = window.AI_STYLE_NAMES[style] || style;
            const name = `AI ${i} (${styleName})`;
            players.push(new window.AIPlayer(i, name, startChips, style));
        }

        while (players.length < 6) {
            players.push(null);
        }

        return players.filter(p => p !== null);
    }

    function setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                debug('Страница скрыта, приостановка анимаций');
            } else {
                debug('Страница видима, возобновление');
            }
        });

        window.addEventListener('resize', debounce(() => {
            if (viewGame) viewGame.updateResponsivePositions?.();
            if (viewPlayer) viewPlayer.resizeCards?.();
            if (viewPot) viewPot.updateForResponsive?.();
        }, 200));

        if (window.isKeyboardShortcutsEnabled()) {
            document.addEventListener('keydown', handleGlobalShortcuts);
        }
    }

    function handleGlobalShortcuts(e) {
        if (viewSettingsModal && viewSettingsModal.isOpen) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const key = e.key.toLowerCase();
        if (key === 's' && e.ctrlKey) {
            e.preventDefault();
            if (gameController && gameController.gameState) {
                const state = gameController.gameState;
                if (window.saveGameState) {
                    window.saveGameState(state, 'quicksave');
                    viewLog?.addMessage('system', 'Игра сохранена (Ctrl+S)');
                }
            }
        }
        if (key === 'l' && e.ctrlKey) {
            e.preventDefault();
            if (window.loadGameState) {
                const state = window.loadGameState('quicksave');
                if (state && gameController) {
                    gameController.gameState = state;
                    viewLog?.addMessage('system', 'Загрузка сохранения...');
                    gameController.queueAction({ type: 'startHand' });
                }
            }
        }
        if (key === 'h') {
            e.preventDefault();
            viewLog?.addMessage('system', '=== Справка ===\nF: фолд | C: чек | K: колл | R: рейз | A: all-in\nCtrl+S: сохранить | Ctrl+L: загрузить | H: справка');
        }
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function info(msg) {
        if (window.info) window.info(msg);
        else console.log(msg);
    }

    function debug(msg) {
        if (window.debug) window.debug(msg);
        else console.debug(msg);
    }

    function error(msg, err) {
        if (window.error) window.error(msg, err);
        else console.error(msg, err);
    }

    function showFatalError(message) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.flexDirection = 'column';
        overlay.innerHTML = `
            <div style="background: #2c2c2c; padding: 30px; border-radius: 20px; text-align: center; max-width: 400px;">
                <h2 style="color: #ff6666;">Ошибка инициализации</h2>
                <p style="color: white;">${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #ffaa66; border: none; border-radius: 30px; cursor: pointer;">Обновить страницу</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function cleanup() {
        if (gameController) gameController.pause?.();
        if (viewAnimation) viewAnimation.cancelAllAnimations?.();
        if (viewPlayer) viewPlayer.destroy?.();
        if (viewLog) viewLog.destroy?.();
        if (viewSettingsModal) viewSettingsModal.destroy?.();
        isInitialized = false;
    }

    window.PokerGame = {
        init,
        cleanup,
        getController: () => gameController,
        getState: () => gameController?.gameState
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

console.log('main.js loaded');
