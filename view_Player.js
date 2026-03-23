window.ViewPlayer = class ViewPlayer {
    constructor() {
        this.playerElements = new Map();
        this.playerContainers = new Map();
        this.activeHighlights = new Map();
        this.winnerHighlights = new Map();
        this.tooltips = new Map();
        this.tooltipTimeout = null;
        this.init();
    }

    init() {
        this.scanPlayerElements();
        this.attachEventListeners();
    }

    scanPlayerElements() {
        const positions = document.querySelectorAll('.player-position');
        positions.forEach((el, idx) => {
            const playerId = parseInt(el.getAttribute('data-player-index'));
            if (!isNaN(playerId)) {
                this.registerPlayerElement(playerId, el);
            }
        });
    }

    registerPlayerElement(playerId, element) {
        this.playerContainers.set(playerId, element);
        const elements = {
            container: element,
            name: element.querySelector('.player-name'),
            chips: element.querySelector('.player-chips'),
            bet: element.querySelector('.player-bet'),
            cards: element.querySelector('.player-cards'),
            status: element.querySelector('.player-status'),
            avatar: element.querySelector('.player-avatar')
        };
        this.playerElements.set(playerId, elements);
    }

    unregisterPlayerElement(playerId) {
        this.playerElements.delete(playerId);
        this.playerContainers.delete(playerId);
        this.activeHighlights.delete(playerId);
        this.winnerHighlights.delete(playerId);
    }

    attachEventListeners() {
        for (let [playerId, elements] of this.playerElements.entries()) {
            if (elements.container && window.isTooltipsEnabled()) {
                elements.container.addEventListener('mouseenter', () => this.showTooltip(playerId));
                elements.container.addEventListener('mouseleave', () => this.hideTooltip());
            }
        }
    }

    updatePlayer(player) {
        const elements = this.playerElements.get(player.id);
        if (!elements) return;
        if (elements.name) elements.name.textContent = player.name;
        if (elements.chips) elements.chips.textContent = player.chips;
        if (elements.bet) elements.bet.textContent = player.currentBet > 0 ? player.currentBet : '';
        if (elements.status) {
            if (player.folded) {
                elements.status.textContent = 'FOLD';
                elements.status.style.color = '#ff6666';
            } else if (player.isAllIn()) {
                elements.status.textContent = 'ALL-IN';
                elements.status.style.color = '#ffaa66';
            } else if (player.sitOut) {
                elements.status.textContent = 'SIT OUT';
                elements.status.style.color = '#888';
            } else {
                elements.status.textContent = '';
            }
        }
        this.updatePlayerActive(player.id, !player.folded && player.isActive && player.chips > 0);
        this.updatePlayerCards(player.id, player.hand, player.folded);
    }

    updatePlayers(players) {
        for (let player of players) {
            this.updatePlayer(player);
        }
    }

    updatePlayerCards(playerId, hand, isFolded = false) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.cards) return;
        const container = elements.cards;
        container.innerHTML = '';
        if (isFolded) {
            const backDiv = document.createElement('div');
            backDiv.className = 'card card-back';
            backDiv.style.background = window.getCardBackStyle();
            backDiv.style.width = `${window.getCardWidth()}px`;
            backDiv.style.height = `${window.getCardHeight()}px`;
            container.appendChild(backDiv.cloneNode(true));
            container.appendChild(backDiv.cloneNode(true));
            return;
        }
        const isHuman = (playerId === 0);
        for (let card of hand) {
            const cardEl = this.createCardElement(card, !isHuman);
            container.appendChild(cardEl);
        }
    }

    createCardElement(card, faceDown = false) {
        const div = document.createElement('div');
        div.className = 'card';
        if (faceDown) {
            div.classList.add('card-back');
            div.style.background = window.getCardBackStyle();
        } else {
            const color = window.getSuitColor(card.suit);
            div.setAttribute('data-rank', card.rank);
            div.setAttribute('data-suit', card.suit);
            div.style.color = color;
            const rankTop = document.createElement('div');
            rankTop.className = 'card-rank-top';
            rankTop.textContent = card.rank;
            const suitMid = document.createElement('div');
            suitMid.className = 'card-suit';
            suitMid.textContent = card.suit;
            const rankBottom = document.createElement('div');
            rankBottom.className = 'card-rank-bottom';
            rankBottom.textContent = card.rank;
            div.appendChild(rankTop);
            div.appendChild(suitMid);
            div.appendChild(rankBottom);
        }
        div.style.width = `${window.getCardWidth()}px`;
        div.style.height = `${window.getCardHeight()}px`;
        return div;
    }

    updatePlayerChips(playerId, chips) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.chips) elements.chips.textContent = chips;
    }

    updatePlayerBet(playerId, betAmount) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.bet) elements.bet.textContent = betAmount > 0 ? betAmount : '';
    }

    updatePlayerStatus(playerId, statusText, color = null) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.status) {
            elements.status.textContent = statusText;
            if (color) elements.status.style.color = color;
        }
    }

    updatePlayerActive(playerId, isActive) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.container) {
            if (isActive) {
                elements.container.classList.remove('inactive');
            } else {
                elements.container.classList.add('inactive');
            }
        }
    }

    highlightPlayer(playerId, isActive = true) {
        if (this.activeHighlights.has(playerId) && this.activeHighlights.get(playerId) === isActive) return;
        for (let [id, highlight] of this.activeHighlights.entries()) {
            const elements = this.playerElements.get(id);
            if (elements && elements.container) {
                elements.container.classList.remove('active-turn');
            }
            this.activeHighlights.delete(id);
        }
        if (isActive && playerId !== null) {
            const elements = this.playerElements.get(playerId);
            if (elements && elements.container) {
                elements.container.classList.add('active-turn');
                this.activeHighlights.set(playerId, true);
            }
        }
    }

    highlightWinner(playerId, duration = 3000) {
        if (this.winnerHighlights.has(playerId)) {
            const prevTimeout = this.winnerHighlights.get(playerId);
            if (prevTimeout) clearTimeout(prevTimeout);
        }
        const elements = this.playerElements.get(playerId);
        if (elements && elements.container) {
            elements.container.classList.add('winner');
            const timeout = setTimeout(() => {
                const winnerEl = this.playerElements.get(playerId)?.container;
                if (winnerEl) winnerEl.classList.remove('winner');
                this.winnerHighlights.delete(playerId);
            }, duration);
            this.winnerHighlights.set(playerId, timeout);
        }
    }

    showTooltip(playerId) {
        if (!window.isTooltipsEnabled()) return;
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return;
        const player = this.getPlayerById(playerId);
        if (!player) return;
        const tooltipText = this.generateTooltipText(player);
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'player-tooltip';
        tooltipDiv.textContent = tooltipText;
        tooltipDiv.style.position = 'fixed';
        const rect = elements.container.getBoundingClientRect();
        tooltipDiv.style.left = `${rect.left + rect.width / 2}px`;
        tooltipDiv.style.top = `${rect.top - 30}px`;
        tooltipDiv.style.transform = 'translateX(-50%)';
        tooltipDiv.style.backgroundColor = 'rgba(0,0,0,0.9)';
        tooltipDiv.style.color = '#ffd966';
        tooltipDiv.style.padding = '5px 10px';
        tooltipDiv.style.borderRadius = '8px';
        tooltipDiv.style.fontSize = '12px';
        tooltipDiv.style.whiteSpace = 'nowrap';
        tooltipDiv.style.zIndex = '2000';
        tooltipDiv.style.pointerEvents = 'none';
        document.body.appendChild(tooltipDiv);
        this.tooltips.set(playerId, tooltipDiv);
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => this.hideTooltip(), window.getTooltipDelay());
    }

    hideTooltip() {
        for (let tooltip of this.tooltips.values()) {
            tooltip.remove();
        }
        this.tooltips.clear();
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    }

    generateTooltipText(player) {
        let text = `${player.name}\n`;
        text += `Фишки: ${player.chips}\n`;
        if (player.currentBet) text += `Ставка: ${player.currentBet}\n`;
        if (player.handsPlayed) text += `Руки: ${player.handsPlayed}\n`;
        if (player.handsWon) text += `Победы: ${player.handsWon}\n`;
        if (player.isAI && player.ai) {
            const stats = player.ai.getStats ? player.ai.getStats() : null;
            if (stats) {
                text += `Агрессия: ${stats.aggression?.toFixed(2) || 'N/A'}\n`;
                text += `VPIP: ${(stats.vpipTarget || 0).toFixed(2)}\n`;
            }
        }
        return text;
    }

    getPlayerById(playerId) {
        if (window.gameState) {
            return window.gameState.getPlayerById(playerId);
        }
        return null;
    }

    updateDealerButton(playerId) {
        const dealerButton = document.querySelector('.dealer-button');
        if (!dealerButton) return;
        const playerEl = this.playerContainers.get(playerId);
        if (playerEl) {
            const rect = playerEl.getBoundingClientRect();
            const tableRect = document.querySelector('.poker-table')?.getBoundingClientRect();
            if (tableRect) {
                dealerButton.style.position = 'absolute';
                dealerButton.style.top = `${rect.top - tableRect.top - 15}px`;
                dealerButton.style.left = `${rect.left - tableRect.left + rect.width / 2 - 20}px`;
                dealerButton.style.display = 'flex';
            }
        } else {
            dealerButton.style.display = 'none';
        }
    }

    animateChipStack(playerId, amount, duration = 500) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return Promise.resolve();
        const chip = document.createElement('div');
        chip.className = 'chip-effect';
        chip.style.position = 'fixed';
        const rect = elements.container.getBoundingClientRect();
        chip.style.left = `${rect.left + rect.width / 2}px`;
        chip.style.top = `${rect.top + rect.height / 2}px`;
        chip.style.width = '20px';
        chip.style.height = '20px';
        chip.style.background = 'radial-gradient(circle, gold, #b8860b)';
        chip.style.borderRadius = '50%';
        chip.style.zIndex = '1000';
        chip.style.transition = `all ${duration}ms ease-out`;
        document.body.appendChild(chip);
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                chip.style.transform = `translateY(-${Math.min(50, amount / 10)}px) scale(1.5)`;
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                resolve();
            }, duration);
        });
    }

    animateBetChip(playerId, amount, potElement, duration = 400) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return Promise.resolve();
        const fromRect = elements.container.getBoundingClientRect();
        const toRect = potElement.getBoundingClientRect();
        const chip = document.createElement('div');
        chip.className = 'chip-effect';
        chip.style.position = 'fixed';
        chip.style.left = `${fromRect.left + fromRect.width / 2}px`;
        chip.style.top = `${fromRect.top + fromRect.height / 2}px`;
        chip.style.width = '15px';
        chip.style.height = '15px';
        chip.style.background = 'radial-gradient(circle, #ffaa66, #cc8844)';
        chip.style.borderRadius = '50%';
        chip.style.zIndex = '1000';
        chip.style.transition = `all ${duration}ms ease-out`;
        document.body.appendChild(chip);
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                chip.style.left = `${toRect.left + toRect.width / 2}px`;
                chip.style.top = `${toRect.top + toRect.height / 2}px`;
                chip.style.transform = 'scale(0.3)';
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                resolve();
            }, duration);
        });
    }

    async animateAllIn(playerId, duration = 800) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return;
        elements.container.classList.add('all-in-flash');
        await new Promise(r => setTimeout(r, duration));
        elements.container.classList.remove('all-in-flash');
    }

    async animateFold(playerId, duration = 300) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.cards) return;
        const cards = elements.cards.children;
        for (let card of cards) {
            card.style.transition = `all ${duration}ms`;
            card.style.opacity = '0';
            card.style.transform = 'rotate(90deg)';
        }
        await new Promise(r => setTimeout(r, duration));
        this.updatePlayerCards(playerId, [], true);
    }

    showPlayerAvatar(playerId, avatarUrl = null) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.avatar) return;
        if (avatarUrl) {
            elements.avatar.style.backgroundImage = `url(${avatarUrl})`;
            elements.avatar.style.backgroundSize = 'cover';
        } else {
            elements.avatar.style.backgroundImage = '';
        }
    }

    setPlayerNameColor(playerId, color) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.name) elements.name.style.color = color;
    }

    setPlayerChipsColor(playerId, color) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.chips) elements.chips.style.color = color;
    }

    flashPlayer(playerId, color = 'gold', duration = 500) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return;
        const originalBorder = elements.container.style.border;
        elements.container.style.transition = `border ${duration}ms`;
        elements.container.style.border = `3px solid ${color}`;
        setTimeout(() => {
            elements.container.style.border = originalBorder;
        }, duration);
    }

    shakePlayer(playerId, intensity = 3, duration = 300) {
        const elements = this.playerElements.get(playerId);
        if (!elements || !elements.container) return Promise.resolve();
        const originalLeft = elements.container.style.left;
        const originalPosition = elements.container.style.position;
        elements.container.style.position = 'relative';
        const startTime = Date.now();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= duration) {
                    clearInterval(interval);
                    elements.container.style.left = originalLeft;
                    elements.container.style.position = originalPosition;
                    resolve();
                    return;
                }
                const offset = (Math.random() - 0.5) * intensity * 2;
                elements.container.style.left = `${offset}px`;
            }, 30);
        });
    }

    resizeCards() {
        const cardWidth = window.getCardWidth();
        const cardHeight = window.getCardHeight();
        for (let [playerId, elements] of this.playerElements.entries()) {
            if (elements.cards) {
                const cards = elements.cards.querySelectorAll('.card');
                for (let card of cards) {
                    card.style.width = `${cardWidth}px`;
                    card.style.height = `${cardHeight}px`;
                }
            }
        }
    }

    updateResponsivePositions() {
        const isCompact = window.isCompactMode();
        for (let [playerId, elements] of this.playerElements.entries()) {
            if (elements.container) {
                if (isCompact) {
                    elements.container.classList.add('compact');
                } else {
                    elements.container.classList.remove('compact');
                }
            }
        }
    }

    resetAllHighlights() {
        for (let [id, highlight] of this.activeHighlights.entries()) {
            const elements = this.playerElements.get(id);
            if (elements && elements.container) elements.container.classList.remove('active-turn');
        }
        for (let [id, timeout] of this.winnerHighlights.entries()) {
            const elements = this.playerElements.get(id);
            if (elements && elements.container) elements.container.classList.remove('winner');
            if (timeout) clearTimeout(timeout);
        }
        this.activeHighlights.clear();
        this.winnerHighlights.clear();
    }

    resetAll() {
        this.resetAllHighlights();
        for (let [playerId, elements] of this.playerElements.entries()) {
            if (elements.cards) elements.cards.innerHTML = '';
            if (elements.bet) elements.bet.textContent = '';
            if (elements.status) elements.status.textContent = '';
        }
    }

    getPlayerElement(playerId) {
        return this.playerContainers.get(playerId);
    }

    getAllPlayerElements() {
        return new Map(this.playerContainers);
    }

    destroy() {
        this.resetAll();
        for (let tooltip of this.tooltips.values()) tooltip.remove();
        this.tooltips.clear();
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
        this.playerElements.clear();
        this.playerContainers.clear();
        this.activeHighlights.clear();
        this.winnerHighlights.clear();
    }
};

window.ViewPlayer = window.ViewPlayer;

console.log('view_Player.js loaded');
