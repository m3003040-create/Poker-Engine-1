window.ViewCard = class ViewCard {
    constructor() {
        this.cardElements = new Map();
        this.animationQueue = [];
        this.isAnimating = false;
        this.cardWidth = window.getCardWidth();
        this.cardHeight = window.getCardHeight();
        this.cardBackStyle = window.getCardBackStyle();
    }

    createCardElement(card, faceDown = false, additionalClasses = []) {
        const div = document.createElement('div');
        div.className = 'card';
        if (additionalClasses.length) div.classList.add(...additionalClasses);
        if (faceDown) {
            div.classList.add('card-back');
            div.style.background = this.cardBackStyle;
            div.style.width = `${this.cardWidth}px`;
            div.style.height = `${this.cardHeight}px`;
            return div;
        }
        const color = window.getSuitColor(card.suit);
        div.setAttribute('data-rank', card.rank);
        div.setAttribute('data-suit', card.suit);
        div.style.color = color;
        div.style.width = `${this.cardWidth}px`;
        div.style.height = `${this.cardHeight}px`;
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

    createCardBackElement() {
        const div = document.createElement('div');
        div.className = 'card card-back';
        div.style.background = this.cardBackStyle;
        div.style.width = `${this.cardWidth}px`;
        div.style.height = `${this.cardHeight}px`;
        return div;
    }

    updateCardSize() {
        this.cardWidth = window.getCardWidth();
        this.cardHeight = window.getCardHeight();
        this.cardBackStyle = window.getCardBackStyle();
        for (let [id, cardEl] of this.cardElements.entries()) {
            if (cardEl) {
                cardEl.style.width = `${this.cardWidth}px`;
                cardEl.style.height = `${this.cardHeight}px`;
            }
        }
    }

    renderPlayerCards(container, cards, faceDown = false, cardSpacing = 5) {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardEl = this.createCardElement(card, faceDown);
            cardEl.style.marginRight = i < cards.length - 1 ? `${cardSpacing}px` : '0';
            container.appendChild(cardEl);
        }
    }

    renderCommunityCards(container, cards, cardSpacing = 10) {
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardEl = this.createCardElement(card, false, ['community-card']);
            cardEl.style.marginRight = i < cards.length - 1 ? `${cardSpacing}px` : '0';
            container.appendChild(cardEl);
        }
        const placeholders = 5 - cards.length;
        for (let i = 0; i < placeholders; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-placeholder';
            placeholder.style.width = `${this.cardWidth}px`;
            placeholder.style.height = `${this.cardHeight}px`;
            container.appendChild(placeholder);
        }
    }

    async animateCardDeal(cardElement, fromRect, toRect, duration = 300) {
        return new Promise((resolve) => {
            const clone = cardElement.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = `${fromRect.top}px`;
            clone.style.left = `${fromRect.left}px`;
            clone.style.width = `${fromRect.width}px`;
            clone.style.height = `${fromRect.height}px`;
            clone.style.zIndex = '10000';
            clone.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            requestAnimationFrame(() => {
                clone.style.top = `${toRect.top}px`;
                clone.style.left = `${toRect.left}px`;
                clone.style.width = `${toRect.width}px`;
                clone.style.height = `${toRect.height}px`;
            });
            setTimeout(() => {
                clone.remove();
                resolve();
            }, duration);
        });
    }

    async animateCardFlip(cardElement, duration = 200) {
        return new Promise((resolve) => {
            cardElement.style.transition = `transform ${duration}ms`;
            cardElement.style.transform = 'rotateY(90deg)';
            setTimeout(() => {
                cardElement.style.transform = 'rotateY(0deg)';
                setTimeout(() => {
                    cardElement.style.transition = '';
                    resolve();
                }, duration);
            }, duration);
        });
    }

    async animateCardMove(cardElement, targetElement, duration = 300) {
        const fromRect = cardElement.getBoundingClientRect();
        const toRect = targetElement.getBoundingClientRect();
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${fromRect.top}px`;
        clone.style.left = `${fromRect.left}px`;
        clone.style.width = `${fromRect.width}px`;
        clone.style.height = `${fromRect.height}px`;
        clone.style.zIndex = '10000';
        clone.style.transition = `all ${duration}ms ease-out`;
        document.body.appendChild(clone);
        requestAnimationFrame(() => {
            clone.style.top = `${toRect.top}px`;
            clone.style.left = `${toRect.left}px`;
            clone.style.width = `${toRect.width}px`;
            clone.style.height = `${toRect.height}px`;
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                clone.remove();
                resolve();
            }, duration);
        });
    }

    async animateDealCardsToPlayer(cards, playerElement, deckPosition, onCardDealt = null) {
        const container = playerElement.querySelector('.player-cards');
        if (!container) return;
        const targetRects = [];
        for (let i = 0; i < cards.length; i++) {
            const placeholder = document.createElement('div');
            placeholder.style.width = `${this.cardWidth}px`;
            placeholder.style.height = `${this.cardHeight}px`;
            placeholder.style.visibility = 'hidden';
            placeholder.style.display = 'inline-block';
            container.appendChild(placeholder);
            targetRects.push(placeholder.getBoundingClientRect());
            placeholder.remove();
        }
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardEl = this.createCardElement(card, true);
            const targetRect = targetRects[i];
            await this.animateCardDeal(cardEl, deckPosition, targetRect, 250);
            if (onCardDealt) onCardDealt(card, i);
        }
        this.renderPlayerCards(container, cards, false);
    }

    async animateDealCommunityCards(cards, communityContainer, deckPosition, onCardDealt = null) {
        const placeholders = communityContainer.querySelectorAll('.card-placeholder');
        const targetRects = [];
        for (let i = 0; i < cards.length && i < placeholders.length; i++) {
            targetRects.push(placeholders[i].getBoundingClientRect());
        }
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardEl = this.createCardElement(card, true);
            const targetRect = targetRects[i];
            await this.animateCardDeal(cardEl, deckPosition, targetRect, 200);
            if (onCardDealt) onCardDealt(card, i);
        }
        this.renderCommunityCards(communityContainer, cards);
    }

    async animateBurnCard(deckPosition, burnPilePosition, duration = 200) {
        const burnCardEl = this.createCardBackElement();
        burnCardEl.style.position = 'fixed';
        burnCardEl.style.left = `${deckPosition.left}px`;
        burnCardEl.style.top = `${deckPosition.top}px`;
        burnCardEl.style.zIndex = '10000';
        document.body.appendChild(burnCardEl);
        await this.animateCardMove(burnCardEl, { getBoundingClientRect: () => burnPilePosition }, duration);
        burnCardEl.remove();
    }

    getDeckPosition() {
        const deckElement = document.querySelector('.deck-area') || document.querySelector('.poker-table');
        if (deckElement) return deckElement.getBoundingClientRect();
        return { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 70, height: 95 };
    }

    getBurnPilePosition() {
        const burnElement = document.querySelector('.burn-pile') || document.querySelector('.poker-table');
        if (burnElement) return burnElement.getBoundingClientRect();
        return { left: window.innerWidth / 2 + 100, top: window.innerHeight / 2, width: 70, height: 95 };
    }

    async animateDealHoleCards(players, deckPosition) {
        const animations = [];
        for (let player of players) {
            const playerEl = document.querySelector(`.player-position[data-player-index="${player.id}"]`);
            if (!playerEl) continue;
            const cardsContainer = playerEl.querySelector('.player-cards');
            if (!cardsContainer) continue;
            const targetRects = [];
            for (let i = 0; i < 2; i++) {
                const placeholder = document.createElement('div');
                placeholder.style.width = `${this.cardWidth}px`;
                placeholder.style.height = `${this.cardHeight}px`;
                placeholder.style.visibility = 'hidden';
                placeholder.style.display = 'inline-block';
                cardsContainer.appendChild(placeholder);
                targetRects.push(placeholder.getBoundingClientRect());
                placeholder.remove();
            }
            for (let i = 0; i < 2; i++) {
                const card = player.hand[i];
                const cardEl = this.createCardElement(card, true);
                const anim = this.animateCardDeal(cardEl, deckPosition, targetRects[i], 250);
                animations.push(anim);
                await new Promise(r => setTimeout(r, 50));
            }
        }
        await Promise.all(animations);
        for (let player of players) {
            const playerEl = document.querySelector(`.player-position[data-player-index="${player.id}"]`);
            if (playerEl) {
                const cardsContainer = playerEl.querySelector('.player-cards');
                if (cardsContainer) this.renderPlayerCards(cardsContainer, player.hand, false);
            }
        }
    }

    async animateRevealCard(cardElement, newCard, duration = 200) {
        await this.animateCardFlip(cardElement, duration);
        const newCardEl = this.createCardElement(newCard, false);
        newCardEl.style.width = cardElement.offsetWidth + 'px';
        newCardEl.style.height = cardElement.offsetHeight + 'px';
        cardElement.parentNode.replaceChild(newCardEl, cardElement);
        return newCardEl;
    }

    async animateShowdown(players, communityCards, communityContainer) {
        for (let player of players) {
            const playerEl = document.querySelector(`.player-position[data-player-index="${player.id}"]`);
            if (!playerEl || player.folded) continue;
            const cardsContainer = playerEl.querySelector('.player-cards');
            if (cardsContainer && player.hand.length) {
                this.renderPlayerCards(cardsContainer, player.hand, false);
                await new Promise(r => setTimeout(r, 300));
            }
        }
        if (communityContainer && communityCards.length) {
            this.renderCommunityCards(communityContainer, communityCards);
        }
    }

    async animateCardGlow(cardElement, duration = 1000, color = 'gold') {
        const originalTransition = cardElement.style.transition;
        const originalBoxShadow = cardElement.style.boxShadow;
        cardElement.style.transition = `box-shadow ${duration}ms`;
        cardElement.style.boxShadow = `0 0 15px ${color}`;
        await new Promise(r => setTimeout(r, duration));
        cardElement.style.boxShadow = originalBoxShadow;
        cardElement.style.transition = originalTransition;
    }

    async animateCardShake(cardElement, intensity = 5, duration = 300) {
        const originalLeft = cardElement.style.left;
        const originalPosition = cardElement.style.position;
        cardElement.style.position = 'relative';
        const startTime = Date.now();
        const shakeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                clearInterval(shakeInterval);
                cardElement.style.left = originalLeft;
                cardElement.style.position = originalPosition;
                return;
            }
            const offset = (Math.random() - 0.5) * intensity * 2;
            cardElement.style.left = `${offset}px`;
        }, 30);
        return new Promise(r => setTimeout(r, duration));
    }

    setCardBackStyle(style) {
        this.cardBackStyle = style;
        const allBacks = document.querySelectorAll('.card-back');
        for (let el of allBacks) {
            el.style.background = style;
        }
    }

    setCardSize(width, height) {
        this.cardWidth = width;
        this.cardHeight = height;
        const allCards = document.querySelectorAll('.card');
        for (let el of allCards) {
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
        }
        const placeholders = document.querySelectorAll('.card-placeholder');
        for (let el of placeholders) {
            el.style.width = `${width}px`;
            el.style.height = `${height}px`;
        }
    }

    updateCardBacks() {
        const backs = document.querySelectorAll('.card-back');
        for (let el of backs) {
            el.style.background = this.cardBackStyle;
        }
    }

    registerCardElement(id, element) {
        this.cardElements.set(id, element);
    }

    unregisterCardElement(id) {
        this.cardElements.delete(id);
    }

    getCardElement(id) {
        return this.cardElements.get(id);
    }

    clearCardElements() {
        this.cardElements.clear();
    }

    async animateDeckShuffle(deckElement, duration = 500) {
        if (!deckElement) return;
        const originalTransform = deckElement.style.transform;
        deckElement.style.transition = `transform ${duration}ms`;
        deckElement.style.transform = 'rotate(360deg)';
        await new Promise(r => setTimeout(r, duration));
        deckElement.style.transform = originalTransform;
        deckElement.style.transition = '';
    }

    async animateCardDraw(cardElement, fromPosition, toElement, duration = 300) {
        const toRect = toElement.getBoundingClientRect();
        return this.animateCardDeal(cardElement, fromPosition, toRect, duration);
    }

    async animateCardDiscard(cardElement, discardPilePosition, duration = 200) {
        const fromRect = cardElement.getBoundingClientRect();
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${fromRect.top}px`;
        clone.style.left = `${fromRect.left}px`;
        clone.style.width = `${fromRect.width}px`;
        clone.style.height = `${fromRect.height}px`;
        clone.style.zIndex = '10000';
        clone.style.transition = `all ${duration}ms ease-in`;
        document.body.appendChild(clone);
        requestAnimationFrame(() => {
            clone.style.top = `${discardPilePosition.top}px`;
            clone.style.left = `${discardPilePosition.left}px`;
            clone.style.opacity = '0';
            clone.style.transform = 'scale(0.5)';
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                clone.remove();
                resolve();
            }, duration);
        });
    }

    async animateCardsToWinner(winnerElements, potElement, duration = 500) {
        const potRect = potElement.getBoundingClientRect();
        for (let el of winnerElements) {
            const rect = el.getBoundingClientRect();
            const chip = document.createElement('div');
            chip.className = 'chip-effect';
            chip.style.position = 'fixed';
            chip.style.left = `${rect.left + rect.width / 2}px`;
            chip.style.top = `${rect.top + rect.height / 2}px`;
            chip.style.width = '15px';
            chip.style.height = '15px';
            chip.style.background = 'radial-gradient(circle, gold, #b8860b)';
            chip.style.borderRadius = '50%';
            chip.style.zIndex = '10000';
            chip.style.transition = `all ${duration}ms ease-out`;
            document.body.appendChild(chip);
            requestAnimationFrame(() => {
                chip.style.left = `${potRect.left + potRect.width / 2}px`;
                chip.style.top = `${potRect.top + potRect.height / 2}px`;
                chip.style.transform = 'scale(0.2)';
                chip.style.opacity = '0';
            });
            await new Promise(r => setTimeout(r, 50));
            setTimeout(() => chip.remove(), duration);
        }
    }

    getCardHtml(card, faceDown = false) {
        if (faceDown) {
            return `<div class="card card-back" style="background: ${this.cardBackStyle}; width: ${this.cardWidth}px; height: ${this.cardHeight}px;"></div>`;
        }
        const color = window.getSuitColor(card.suit);
        return `<div class="card" data-rank="${card.rank}" data-suit="${card.suit}" style="color: ${color}; width: ${this.cardWidth}px; height: ${this.cardHeight}px;">
                    <div class="card-rank-top">${card.rank}</div>
                    <div class="card-suit">${card.suit}</div>
                    <div class="card-rank-bottom">${card.rank}</div>
                </div>`;
    }

    getCardsHtml(cards, faceDown = false, separator = '') {
        return cards.map(c => this.getCardHtml(c, faceDown)).join(separator);
    }
};

window.ViewCard = window.ViewCard;

console.log('view_Card.js loaded');
