window.ViewAnimation = class ViewAnimation {
    constructor() {
        this.activeAnimations = new Set();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        this.defaultDuration = window.getAnimationSpeed();
        this.easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.rafId = null;
    }

    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    async animateCardDeal(cardElement, fromRect, toRect, duration = null) {
        const dur = duration || this.defaultDuration;
        return new Promise((resolve) => {
            const clone = cardElement.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = `${fromRect.top}px`;
            clone.style.left = `${fromRect.left}px`;
            clone.style.width = `${fromRect.width}px`;
            clone.style.height = `${fromRect.height}px`;
            clone.style.zIndex = '10000';
            clone.style.transition = `all ${dur}ms ${this.easing}`;
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            this.activeAnimations.add(clone);
            requestAnimationFrame(() => {
                clone.style.top = `${toRect.top}px`;
                clone.style.left = `${toRect.left}px`;
                clone.style.width = `${toRect.width}px`;
                clone.style.height = `${toRect.height}px`;
            });
            setTimeout(() => {
                clone.remove();
                this.activeAnimations.delete(clone);
                resolve();
            }, dur);
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

    async animateCardMove(cardElement, targetElement, duration = null) {
        const dur = duration || this.defaultDuration;
        const fromRect = cardElement.getBoundingClientRect();
        const toRect = targetElement.getBoundingClientRect();
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${fromRect.top}px`;
        clone.style.left = `${fromRect.left}px`;
        clone.style.width = `${fromRect.width}px`;
        clone.style.height = `${fromRect.height}px`;
        clone.style.zIndex = '10000';
        clone.style.transition = `all ${dur}ms ease-out`;
        document.body.appendChild(clone);
        this.activeAnimations.add(clone);
        requestAnimationFrame(() => {
            clone.style.top = `${toRect.top}px`;
            clone.style.left = `${toRect.left}px`;
            clone.style.width = `${toRect.width}px`;
            clone.style.height = `${toRect.height}px`;
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                clone.remove();
                this.activeAnimations.delete(clone);
                resolve();
            }, dur);
        });
    }

    async animateChip(fromElement, toElement, amount = 1, duration = null) {
        const dur = duration || 300;
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        const chip = document.createElement('div');
        chip.className = 'chip-effect';
        chip.style.position = 'fixed';
        chip.style.left = `${fromRect.left + fromRect.width / 2}px`;
        chip.style.top = `${fromRect.top + fromRect.height / 2}px`;
        chip.style.width = `${15 + Math.min(10, amount / 10)}px`;
        chip.style.height = `${15 + Math.min(10, amount / 10)}px`;
        chip.style.background = 'radial-gradient(circle, #ffaa66, #cc8844)';
        chip.style.borderRadius = '50%';
        chip.style.zIndex = '10000';
        chip.style.transition = `all ${dur}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`;
        document.body.appendChild(chip);
        this.activeAnimations.add(chip);
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                chip.style.left = `${toRect.left + toRect.width / 2}px`;
                chip.style.top = `${toRect.top + toRect.height / 2}px`;
                chip.style.transform = 'scale(0.3)';
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                this.activeAnimations.delete(chip);
                resolve();
            }, dur);
        });
    }

    async animateMultipleChips(fromElements, toElement, amounts, duration = null) {
        const animations = [];
        for (let i = 0; i < fromElements.length; i++) {
            const anim = this.animateChip(fromElements[i], toElement, amounts[i] || 1, duration);
            animations.push(anim);
            await new Promise(r => setTimeout(r, 50));
        }
        await Promise.all(animations);
    }

    async animatePotWin(potElement, winnerElement, amount, duration = 800) {
        const potRect = potElement.getBoundingClientRect();
        const winnerRect = winnerElement.getBoundingClientRect();
        const chip = document.createElement('div');
        chip.className = 'chip-effect';
        chip.style.position = 'fixed';
        chip.style.left = `${potRect.left + potRect.width / 2}px`;
        chip.style.top = `${potRect.top + potRect.height / 2}px`;
        chip.style.width = '30px';
        chip.style.height = '30px';
        chip.style.background = 'radial-gradient(circle, gold, #b8860b)';
        chip.style.borderRadius = '50%';
        chip.style.zIndex = '10000';
        chip.style.transition = `all ${duration}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`;
        document.body.appendChild(chip);
        this.activeAnimations.add(chip);
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                chip.style.left = `${winnerRect.left + winnerRect.width / 2}px`;
                chip.style.top = `${winnerRect.top + winnerRect.height / 2}px`;
                chip.style.transform = 'scale(1.5)';
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                this.activeAnimations.delete(chip);
                resolve();
            }, duration);
        });
    }

    async animateNumber(targetElement, startValue, endValue, duration = 500, formatter = (v) => v) {
        const diff = endValue - startValue;
        const startTime = performance.now();
        return new Promise((resolve) => {
            const update = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                const current = Math.floor(startValue + diff * progress);
                targetElement.textContent = formatter(current);
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    targetElement.textContent = formatter(endValue);
                    resolve();
                }
            };
            requestAnimationFrame(update);
        });
    }

    async animateScale(element, fromScale, toScale, duration = 300) {
        element.style.transition = `transform ${duration}ms ${this.easing}`;
        element.style.transform = `scale(${fromScale})`;
        await new Promise(r => setTimeout(r, 10));
        element.style.transform = `scale(${toScale})`;
        return new Promise((resolve) => {
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    async animateFade(element, fromOpacity, toOpacity, duration = 300) {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = fromOpacity;
        await new Promise(r => setTimeout(r, 10));
        element.style.opacity = toOpacity;
        return new Promise((resolve) => {
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    async animateShake(element, intensity = 5, duration = 300) {
        const originalPosition = element.style.position;
        const originalLeft = element.style.left;
        element.style.position = 'relative';
        const startTime = Date.now();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= duration) {
                    clearInterval(interval);
                    element.style.left = originalLeft;
                    element.style.position = originalPosition;
                    resolve();
                    return;
                }
                const offset = (Math.random() - 0.5) * intensity * 2;
                element.style.left = `${offset}px`;
            }, 30);
        });
    }

    async animatePulse(element, count = 3, duration = 200) {
        const originalTransform = element.style.transform;
        for (let i = 0; i < count; i++) {
            element.style.transition = `transform ${duration}ms`;
            element.style.transform = 'scale(1.1)';
            await new Promise(r => setTimeout(r, duration));
            element.style.transform = 'scale(1)';
            await new Promise(r => setTimeout(r, duration));
        }
        element.style.transition = '';
        element.style.transform = originalTransform;
    }

    async animateGlow(element, color = 'gold', duration = 1000) {
        const originalBoxShadow = element.style.boxShadow;
        element.style.transition = `box-shadow ${duration}ms`;
        element.style.boxShadow = `0 0 15px ${color}`;
        await new Promise(r => setTimeout(r, duration));
        element.style.boxShadow = originalBoxShadow;
        element.style.transition = '';
    }

    async animateSlide(element, fromX, toX, fromY, toY, duration = 300) {
        element.style.transition = `transform ${duration}ms ${this.easing}`;
        element.style.transform = `translate(${fromX}px, ${fromY}px)`;
        await new Promise(r => setTimeout(r, 10));
        element.style.transform = `translate(${toX}px, ${toY}px)`;
        return new Promise((resolve) => {
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    async animateDealCardsToPlayer(playerElement, cards, deckPosition, onCardDealt = null) {
        const cardsContainer = playerElement.querySelector('.player-cards');
        if (!cardsContainer) return;
        const targetRects = [];
        for (let i = 0; i < cards.length; i++) {
            const placeholder = document.createElement('div');
            placeholder.style.width = `${window.getCardWidth()}px`;
            placeholder.style.height = `${window.getCardHeight()}px`;
            placeholder.style.visibility = 'hidden';
            placeholder.style.display = 'inline-block';
            cardsContainer.appendChild(placeholder);
            targetRects.push(placeholder.getBoundingClientRect());
            placeholder.remove();
        }
        for (let i = 0; i < cards.length; i++) {
            const cardEl = this.createCardElement(cards[i], true);
            await this.animateCardDeal(cardEl, deckPosition, targetRects[i], 250);
            if (onCardDealt) onCardDealt(cards[i], i);
        }
        cardsContainer.innerHTML = '';
        for (let card of cards) {
            cardsContainer.appendChild(this.createCardElement(card, false));
        }
    }

    async animateDealCommunityCards(communityContainer, cards, deckPosition, onCardDealt = null) {
        const placeholders = communityContainer.querySelectorAll('.card-placeholder');
        const targetRects = [];
        for (let i = 0; i < cards.length && i < placeholders.length; i++) {
            targetRects.push(placeholders[i].getBoundingClientRect());
        }
        for (let i = 0; i < cards.length; i++) {
            const cardEl = this.createCardElement(cards[i], true);
            await this.animateCardDeal(cardEl, deckPosition, targetRects[i], 200);
            if (onCardDealt) onCardDealt(cards[i], i);
        }
        communityContainer.innerHTML = '';
        for (let card of cards) {
            communityContainer.appendChild(this.createCardElement(card, false));
        }
        for (let i = cards.length; i < 5; i++) {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-placeholder';
            placeholder.style.width = `${window.getCardWidth()}px`;
            placeholder.style.height = `${window.getCardHeight()}px`;
            communityContainer.appendChild(placeholder);
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

    async animateRevealHoleCards(playerElements, players) {
        for (let player of players) {
            const playerEl = playerElements.get(player.id)?.container;
            if (!playerEl || player.folded) continue;
            const cardsContainer = playerEl.querySelector('.player-cards');
            if (!cardsContainer) continue;
            const cardEls = cardsContainer.querySelectorAll('.card');
            for (let i = 0; i < cardEls.length && i < player.hand.length; i++) {
                const newCard = this.createCardElement(player.hand[i], false);
                newCard.style.width = cardEls[i].offsetWidth + 'px';
                newCard.style.height = cardEls[i].offsetHeight + 'px';
                await this.animateCardFlip(cardEls[i], 150);
                cardEls[i].parentNode.replaceChild(newCard, cardEls[i]);
            }
        }
    }

    async animateBurn(deckPosition, burnPilePosition, duration = 200) {
        const burnCard = this.createCardElement(null, true);
        burnCard.style.position = 'fixed';
        burnCard.style.top = `${deckPosition.top}px`;
        burnCard.style.left = `${deckPosition.left}px`;
        burnCard.style.zIndex = '10000';
        document.body.appendChild(burnCard);
        this.activeAnimations.add(burnCard);
        await this.animateCardMove(burnCard, { getBoundingClientRect: () => burnPilePosition }, duration);
        burnCard.remove();
        this.activeAnimations.delete(burnCard);
    }

    async animateShuffle(deckElement, duration = 500) {
        if (!deckElement) return;
        const originalTransform = deckElement.style.transform;
        deckElement.style.transition = `transform ${duration}ms`;
        deckElement.style.transform = 'rotate(360deg)';
        await new Promise(r => setTimeout(r, duration));
        deckElement.style.transform = originalTransform;
        deckElement.style.transition = '';
    }

    queueAnimation(animationFn) {
        this.animationQueue.push(animationFn);
        if (!this.isProcessingQueue) this.processQueue();
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;
        while (this.animationQueue.length > 0) {
            const fn = this.animationQueue.shift();
            await fn();
        }
        this.isProcessingQueue = false;
    }

    cancelAllAnimations() {
        for (let el of this.activeAnimations) {
            if (el && el.remove) el.remove();
        }
        this.activeAnimations.clear();
        this.animationQueue = [];
        this.isProcessingQueue = false;
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
};

window.ViewAnimation = window.ViewAnimation;

console.log('view_Animation.js loaded');
