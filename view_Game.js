window.ViewGame = class ViewGame {
    constructor() {
        this.container = document.querySelector('.poker-table');
        this.communityCardsContainer = document.getElementById('communityCardsArea');
        this.potAmountElement = document.getElementById('mainPotAmount');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.dealerButton = document.querySelector('.dealer-button');
        this.playerElements = new Map();
        this.highlightedPlayerId = null;
        this.highlightedWinnerId = null;
        this.animationQueue = [];
        this.isAnimating = false;
        this.cardElements = new Map();
        this.init();
    }

    init() {
        this.createPlayerElements();
        this.updateCommunityCards([]);
        this.updatePot(0);
        this.updatePhase(window.GamePhase.PREFLOP);
        this.updateTurn(null);
    }

    createPlayerElements() {
        const positions = document.querySelectorAll('.player-position');
        positions.forEach((el, idx) => {
            const playerId = parseInt(el.getAttribute('data-player-index'));
            this.playerElements.set(playerId, {
                container: el,
                name: el.querySelector('.player-name'),
                chips: el.querySelector('.player-chips'),
                bet: el.querySelector('.player-bet'),
                cards: el.querySelector('.player-cards'),
                status: el.querySelector('.player-status'),
                avatar: el.querySelector('.player-avatar')
            });
        });
    }

    updatePlayerList(players) {
        for (let player of players) {
            const elements = this.playerElements.get(player.id);
            if (!elements) continue;
            elements.name.textContent = player.name;
            elements.chips.textContent = player.chips;
            elements.bet.textContent = player.currentBet > 0 ? player.currentBet : '';
            if (player.folded) {
                elements.status.textContent = 'FOLD';
                elements.status.style.color = '#ff6666';
            } else if (player.isAllIn()) {
                elements.status.textContent = 'ALL-IN';
                elements.status.style.color = '#ffaa66';
            } else {
                elements.status.textContent = '';
            }
            this.updatePlayerCards(player.id, player.hand, player.folded);
            this.updatePlayerActive(player.id, player.isActive && !player.folded);
        }
    }

    updatePlayerCards(playerId, hand, isFolded = false) {
        const elements = this.playerElements.get(playerId);
        if (!elements) return;
        const container = elements.cards;
        if (!container) return;
        container.innerHTML = '';
        if (isFolded) {
            const backDiv = document.createElement('div');
            backDiv.className = 'card card-back';
            backDiv.style.background = window.getCardBackStyle();
            backDiv.style.width = '45px';
            backDiv.style.height = '60px';
            container.appendChild(backDiv.cloneNode(true));
            container.appendChild(backDiv.cloneNode(true));
            return;
        }
        for (let card of hand) {
            const cardHtml = this.createCardElement(card, false);
            container.appendChild(cardHtml);
        }
    }

    updateCommunityCards(cards) {
        if (!this.communityCardsContainer) return;
        this.communityCardsContainer.innerHTML = '';
        const placeholders = 5;
        for (let i = 0; i < placeholders; i++) {
            if (i < cards.length) {
                const card = cards[i];
                const cardEl = this.createCardElement(card, false);
                cardEl.classList.add('community-card');
                this.communityCardsContainer.appendChild(cardEl);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'card-placeholder';
                this.communityCardsContainer.appendChild(placeholder);
            }
        }
    }

    createCardElement(card, faceDown = false) {
        const div = document.createElement('div');
        div.className = 'card';
        if (faceDown) {
            div.classList.add('card-back');
            div.style.background = window.getCardBackStyle();
            return div;
        }
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
        return div;
    }

    updatePot(amount) {
        if (this.potAmountElement) {
            this.potAmountElement.textContent = amount;
        }
    }

    updatePhase(phase) {
        if (this.phaseIndicator) {
            this.phaseIndicator.textContent = window.getPhaseDisplayName(phase);
            this.phaseIndicator.style.color = window.getPhaseColor(phase);
        }
    }

    updateTurn(player) {
        if (!this.turnIndicator) return;
        if (player) {
            this.turnIndicator.textContent = `Ход: ${player.name}`;
        } else {
            this.turnIndicator.textContent = '';
        }
    }

    highlightPlayer(playerId, isActive) {
        if (this.highlightedPlayerId === playerId && isActive) return;
        if (this.highlightedPlayerId !== null) {
            const prevEl = this.playerElements.get(this.highlightedPlayerId)?.container;
            if (prevEl) prevEl.classList.remove('active-turn');
        }
        this.highlightedPlayerId = isActive ? playerId : null;
        if (isActive && playerId !== null) {
            const el = this.playerElements.get(playerId)?.container;
            if (el) el.classList.add('active-turn');
        }
    }

    highlightWinner(playerId) {
        if (this.highlightedWinnerId === playerId) return;
        if (this.highlightedWinnerId !== null) {
            const prevEl = this.playerElements.get(this.highlightedWinnerId)?.container;
            if (prevEl) prevEl.classList.remove('winner');
        }
        this.highlightedWinnerId = playerId;
        const el = this.playerElements.get(playerId)?.container;
        if (el) el.classList.add('winner');
        setTimeout(() => {
            if (this.highlightedWinnerId === playerId) {
                const winnerEl = this.playerElements.get(playerId)?.container;
                if (winnerEl) winnerEl.classList.remove('winner');
                this.highlightedWinnerId = null;
            }
        }, 3000);
    }

    updatePlayerBet(playerId, betAmount) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.bet) {
            elements.bet.textContent = betAmount > 0 ? betAmount : '';
        }
    }

    updatePlayerChips(playerId, chips) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.chips) {
            elements.chips.textContent = chips;
        }
    }

    updatePlayerStatus(playerId, status) {
        const elements = this.playerElements.get(playerId);
        if (elements && elements.status) {
            elements.status.textContent = status;
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

    updateDealerButton(dealerIndex) {
        const dealerPos = document.querySelector(`.player-position[data-player-index="${dealerIndex}"]`);
        if (dealerPos && this.dealerButton) {
            const rect = dealerPos.getBoundingClientRect();
            const tableRect = this.container.getBoundingClientRect();
            this.dealerButton.style.position = 'absolute';
            this.dealerButton.style.top = `${rect.top - tableRect.top - 15}px`;
            this.dealerButton.style.left = `${rect.left - tableRect.left + rect.width / 2 - 20}px`;
            this.dealerButton.style.display = 'flex';
        } else if (this.dealerButton) {
            this.dealerButton.style.display = 'none';
        }
    }

    animateCardDeal(cardElement, fromPosition, toPosition, duration = 300) {
        return new Promise((resolve) => {
            const clone = cardElement.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = `${fromPosition.y}px`;
            clone.style.left = `${fromPosition.x}px`;
            clone.style.width = `${cardElement.offsetWidth}px`;
            clone.style.height = `${cardElement.offsetHeight}px`;
            clone.style.zIndex = '1000';
            clone.style.transition = `all ${duration}ms ease-out`;
            document.body.appendChild(clone);
            requestAnimationFrame(() => {
                clone.style.top = `${toPosition.y}px`;
                clone.style.left = `${toPosition.x}px`;
            });
            setTimeout(() => {
                clone.remove();
                resolve();
            }, duration);
        });
    }

    animateChipMove(fromElement, toElement, amount, duration = 200) {
        return new Promise((resolve) => {
            const fromRect = fromElement.getBoundingClientRect();
            const toRect = toElement.getBoundingClientRect();
            const chip = document.createElement('div');
            chip.className = 'chip-effect';
            chip.style.position = 'fixed';
            chip.style.left = `${fromRect.left + fromRect.width / 2}px`;
            chip.style.top = `${fromRect.top + fromRect.height / 2}px`;
            chip.style.width = '20px';
            chip.style.height = '20px';
            chip.style.background = 'radial-gradient(circle, gold, #b8860b)';
            chip.style.borderRadius = '50%';
            chip.style.zIndex = '1000';
            chip.style.transition = `all ${duration}ms ease-out`;
            document.body.appendChild(chip);
            requestAnimationFrame(() => {
                chip.style.left = `${toRect.left + toRect.width / 2}px`;
                chip.style.top = `${toRect.top + toRect.height / 2}px`;
                chip.style.transform = 'scale(0.5)';
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                resolve();
            }, duration);
        });
    }

    async animateDealCards(players, deckPosition) {
        const animations = [];
        for (let player of players) {
            const playerEl = this.playerElements.get(player.id)?.container;
            if (!playerEl) continue;
            const cardsContainer = this.playerElements.get(player.id)?.cards;
            if (!cardsContainer) continue;
            for (let i = 0; i < player.hand.length; i++) {
                const cardEl = this.createCardElement(player.hand[i], false);
                cardEl.style.visibility = 'hidden';
                cardsContainer.appendChild(cardEl);
                const targetRect = cardEl.getBoundingClientRect();
                cardEl.remove();
                const anim = this.animateCardDeal(cardEl, deckPosition, { x: targetRect.left, y: targetRect.top }, 300);
                animations.push(anim);
                await new Promise(r => setTimeout(r, 100));
            }
        }
        await Promise.all(animations);
        for (let player of players) {
            this.updatePlayerCards(player.id, player.hand, false);
        }
    }

    animateCommunityCards(cards, deckPosition) {
        return new Promise(async (resolve) => {
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const placeholder = this.communityCardsContainer.children[i];
                const targetRect = placeholder.getBoundingClientRect();
                const cardEl = this.createCardElement(card, false);
                cardEl.style.visibility = 'hidden';
                placeholder.parentNode.insertBefore(cardEl, placeholder);
                placeholder.remove();
                await this.animateCardDeal(cardEl, deckPosition, { x: targetRect.left, y: targetRect.top }, 200);
                cardEl.style.visibility = 'visible';
                await new Promise(r => setTimeout(r, 100));
            }
            resolve();
        });
    }

    showMessage(message, type = 'info', duration = 3000) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `game-message ${type}`;
        msgDiv.textContent = message;
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '20px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = type === 'error' ? '#cc4444' : (type === 'winner' ? '#ffd966' : '#2c2c2c');
        msgDiv.style.color = type === 'winner' ? '#000' : '#fff';
        msgDiv.style.padding = '10px 20px';
        msgDiv.style.borderRadius = '30px';
        msgDiv.style.zIndex = '2000';
        msgDiv.style.fontWeight = 'bold';
        msgDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        document.body.appendChild(msgDiv);
        setTimeout(() => {
            msgDiv.remove();
        }, duration);
    }

    showGameOver() {
        this.showMessage('Игра окончена! Обновите страницу для новой игры.', 'error', 5000);
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = '<div class="game-over-box"><h2>Игра завершена</h2><button onclick="location.reload()">Новая игра</button></div>';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '3000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        document.body.appendChild(overlay);
    }

    resetHighlights() {
        if (this.highlightedPlayerId !== null) {
            const el = this.playerElements.get(this.highlightedPlayerId)?.container;
            if (el) el.classList.remove('active-turn');
            this.highlightedPlayerId = null;
        }
        if (this.highlightedWinnerId !== null) {
            const el = this.playerElements.get(this.highlightedWinnerId)?.container;
            if (el) el.classList.remove('winner');
            this.highlightedWinnerId = null;
        }
        for (let [id, elements] of this.playerElements.entries()) {
            elements.container.classList.remove('active-turn', 'winner', 'inactive');
        }
    }

    setDealerButtonPosition(playerId) {
        const playerEl = this.playerElements.get(playerId)?.container;
        if (playerEl && this.dealerButton) {
            const rect = playerEl.getBoundingClientRect();
            const tableRect = this.container.getBoundingClientRect();
            this.dealerButton.style.position = 'absolute';
            this.dealerButton.style.top = `${rect.top - tableRect.top - 15}px`;
            this.dealerButton.style.left = `${rect.left - tableRect.left + rect.width / 2 - 20}px`;
            this.dealerButton.style.display = 'flex';
        }
    }

    setPhaseIndicatorText(text, color = null) {
        if (this.phaseIndicator) {
            this.phaseIndicator.textContent = text;
            if (color) this.phaseIndicator.style.color = color;
        }
    }

    setTurnIndicatorText(text) {
        if (this.turnIndicator) this.turnIndicator.textContent = text;
    }

    updatePotDisplay(potManager) {
        const total = potManager.getTotal();
        this.updatePot(total);
        if (window.isShowPotBreakdown() && potManager.getAllPots().length > 1) {
            const pots = potManager.getAllPots();
            let breakdown = `Банки: основной ${pots[0].amount}`;
            for (let i = 1; i < pots.length; i++) {
                breakdown += `, сайд ${i} ${pots[i].amount}`;
            }
            this.showMessage(breakdown, 'info', 2000);
        }
    }

    async fadeInElement(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms`;
        await new Promise(r => setTimeout(r, 10));
        element.style.opacity = '1';
        await new Promise(r => setTimeout(r, duration));
    }

    async fadeOutElement(element, duration = 300) {
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms`;
        await new Promise(r => setTimeout(r, 10));
        element.style.opacity = '0';
        await new Promise(r => setTimeout(r, duration));
    }

    shakeElement(element, intensity = 5, duration = 300) {
        return new Promise((resolve) => {
            const originalPos = element.style.position;
            element.style.position = 'relative';
            let start = Date.now();
            const shakeInterval = setInterval(() => {
                const elapsed = Date.now() - start;
                if (elapsed >= duration) {
                    clearInterval(shakeInterval);
                    element.style.left = '0px';
                    element.style.position = originalPos;
                    resolve();
                    return;
                }
                const offset = (Math.random() - 0.5) * intensity * 2;
                element.style.left = `${offset}px`;
            }, 30);
        });
    }
};

window.ViewGame = window.ViewGame;

console.log('view_Game.js loaded');
