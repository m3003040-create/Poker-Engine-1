window.ViewPot = class ViewPot {
    constructor() {
        this.potElement = document.getElementById('mainPotAmount');
        this.potContainer = document.querySelector('.pot-display');
        this.sidePotContainer = null;
        this.potBreakdownElement = null;
        this.animationQueue = [];
        this.isAnimating = false;
        this.currentTotal = 0;
        this.lastUpdateTime = 0;
        this.potHistory = [];
        this.init();
    }

    init() {
        this.createSidePotContainer();
        this.createPotBreakdownElement();
        this.updatePot(0);
    }

    createSidePotContainer() {
        this.sidePotContainer = document.createElement('div');
        this.sidePotContainer.className = 'side-pots-container';
        this.sidePotContainer.style.position = 'absolute';
        this.sidePotContainer.style.top = '60%';
        this.sidePotContainer.style.left = '50%';
        this.sidePotContainer.style.transform = 'translateX(-50%)';
        this.sidePotContainer.style.display = 'flex';
        this.sidePotContainer.style.gap = '10px';
        this.sidePotContainer.style.zIndex = '4';
        this.sidePotContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.sidePotContainer.style.padding = '5px 10px';
        this.sidePotContainer.style.borderRadius = '20px';
        this.sidePotContainer.style.backdropFilter = 'blur(4px)';
        const table = document.querySelector('.poker-table');
        if (table) table.appendChild(this.sidePotContainer);
    }

    createPotBreakdownElement() {
        this.potBreakdownElement = document.createElement('div');
        this.potBreakdownElement.className = 'pot-breakdown';
        this.potBreakdownElement.style.position = 'absolute';
        this.potBreakdownElement.style.top = '70%';
        this.potBreakdownElement.style.left = '50%';
        this.potBreakdownElement.style.transform = 'translateX(-50%)';
        this.potBreakdownElement.style.backgroundColor = 'rgba(0,0,0,0.6)';
        this.potBreakdownElement.style.color = '#ffd966';
        this.potBreakdownElement.style.fontSize = '12px';
        this.potBreakdownElement.style.padding = '3px 8px';
        this.potBreakdownElement.style.borderRadius = '15px';
        this.potBreakdownElement.style.whiteSpace = 'nowrap';
        this.potBreakdownElement.style.zIndex = '4';
        this.potBreakdownElement.style.display = 'none';
        const table = document.querySelector('.poker-table');
        if (table) table.appendChild(this.potBreakdownElement);
    }

    updatePot(amount) {
        if (this.potElement) {
            this.potElement.textContent = amount;
        }
        this.currentTotal = amount;
        this.addToHistory(amount);
    }

    updatePots(potManager) {
        if (!potManager) return;
        const mainPot = potManager.getMainPot();
        const sidePots = potManager.getSidePots();
        this.updatePot(mainPot ? mainPot.amount : 0);
        this.updateSidePots(sidePots);
        if (window.isShowPotBreakdown() && (sidePots.length > 0 || (mainPot && mainPot.eligiblePlayers && mainPot.eligiblePlayers.length > 1))) {
            this.showPotBreakdown(potManager);
        } else {
            this.hidePotBreakdown();
        }
    }

    updateSidePots(sidePots) {
        if (!this.sidePotContainer) return;
        this.sidePotContainer.innerHTML = '';
        if (!sidePots || sidePots.length === 0) return;
        for (let i = 0; i < sidePots.length; i++) {
            const pot = sidePots[i];
            const potDiv = document.createElement('div');
            potDiv.className = 'side-pot';
            potDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
            potDiv.style.color = '#ffaa66';
            potDiv.style.padding = '2px 8px';
            potDiv.style.borderRadius = '15px';
            potDiv.style.fontSize = '12px';
            potDiv.style.fontWeight = 'bold';
            potDiv.style.border = '1px solid #ffaa66';
            potDiv.innerHTML = `Сайд ${i+1}: ${pot.amount}`;
            if (pot.eligiblePlayers && pot.eligiblePlayers.length) {
                potDiv.title = `Участники: ${pot.eligiblePlayers.map(p => p.name).join(', ')}`;
            }
            this.sidePotContainer.appendChild(potDiv);
        }
    }

    showPotBreakdown(potManager) {
        if (!this.potBreakdownElement) return;
        const allPots = potManager.getAllPots();
        if (!allPots.length) return;
        let breakdownText = '';
        for (let i = 0; i < allPots.length; i++) {
            const pot = allPots[i];
            const eligibleNames = pot.eligiblePlayers.map(p => p.name).join(',');
            breakdownText += `${i === 0 ? 'Главный' : `Сайд ${i}`}: ${pot.amount} (${eligibleNames}) `;
        }
        this.potBreakdownElement.textContent = breakdownText;
        this.potBreakdownElement.style.display = 'block';
        if (this.breakdownTimeout) clearTimeout(this.breakdownTimeout);
        this.breakdownTimeout = setTimeout(() => this.hidePotBreakdown(), 3000);
    }

    hidePotBreakdown() {
        if (this.potBreakdownElement) this.potBreakdownElement.style.display = 'none';
    }

    async animatePotIncrease(oldAmount, newAmount, duration = 500) {
        if (!this.potElement) return;
        const diff = newAmount - oldAmount;
        if (diff <= 0) {
            this.updatePot(newAmount);
            return;
        }
        const startTime = Date.now();
        const startAmount = oldAmount;
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const current = Math.floor(startAmount + diff * progress);
            this.potElement.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.potElement.textContent = newAmount;
            }
        };
        requestAnimationFrame(animate);
        await new Promise(r => setTimeout(r, duration));
    }

    async animateChipToPot(fromElement, amount, potElement = this.potElement, duration = 300) {
        if (!fromElement || !potElement) return;
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = potElement.getBoundingClientRect();
        const chip = document.createElement('div');
        chip.className = 'chip-effect';
        chip.style.position = 'fixed';
        chip.style.left = `${fromRect.left + fromRect.width / 2}px`;
        chip.style.top = `${fromRect.top + fromRect.height / 2}px`;
        chip.style.width = '20px';
        chip.style.height = '20px';
        chip.style.background = 'radial-gradient(circle, #ffaa66, #cc8844)';
        chip.style.borderRadius = '50%';
        chip.style.zIndex = '2000';
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

    async animateMultipleChipsToPot(fromElements, amounts, potElement, duration = 400) {
        const animations = [];
        for (let i = 0; i < fromElements.length; i++) {
            const anim = this.animateChipToPot(fromElements[i], amounts[i] || 1, potElement, duration);
            animations.push(anim);
            await new Promise(r => setTimeout(r, 50));
        }
        await Promise.all(animations);
    }

    async animatePotWinner(potElement, winnerElement, amount, duration = 800) {
        if (!potElement || !winnerElement) return;
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
        chip.style.zIndex = '2000';
        chip.style.transition = `all ${duration}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`;
        document.body.appendChild(chip);
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                chip.style.left = `${winnerRect.left + winnerRect.width / 2}px`;
                chip.style.top = `${winnerRect.top + winnerRect.height / 2}px`;
                chip.style.transform = 'scale(1.5)';
                chip.style.opacity = '0';
            });
            setTimeout(() => {
                chip.remove();
                resolve();
            }, duration);
        });
    }

    showPotTooltip(potAmount, eligiblePlayers) {
        const tooltip = document.createElement('div');
        tooltip.className = 'pot-tooltip';
        tooltip.style.position = 'fixed';
        const potRect = this.potElement.getBoundingClientRect();
        tooltip.style.left = `${potRect.left + potRect.width / 2}px`;
        tooltip.style.top = `${potRect.top - 30}px`;
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
        tooltip.style.color = '#ffd966';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.fontSize = '12px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.zIndex = '2000';
        tooltip.innerHTML = `Банк: ${potAmount}<br>Участники: ${eligiblePlayers.map(p => p.name).join(', ')}`;
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
    }

    addToHistory(amount) {
        this.potHistory.push({ amount, timestamp: Date.now() });
        if (this.potHistory.length > 50) this.potHistory.shift();
    }

    getPotHistory() {
        return [...this.potHistory];
    }

    clearPotHistory() {
        this.potHistory = [];
    }

    reset() {
        this.updatePot(0);
        if (this.sidePotContainer) this.sidePotContainer.innerHTML = '';
        this.hidePotBreakdown();
        this.potHistory = [];
    }

    setPotStyle(style) {
        if (!this.potElement) return;
        if (style === 'large') {
            this.potElement.style.fontSize = '28px';
            this.potElement.style.fontWeight = 'bold';
        } else if (style === 'small') {
            this.potElement.style.fontSize = '18px';
        } else {
            this.potElement.style.fontSize = '24px';
        }
    }

    setPotColor(color) {
        if (this.potElement) this.potElement.style.color = color;
    }

    highlightPot(duration = 500) {
        if (!this.potElement) return;
        const originalColor = this.potElement.style.color;
        this.potElement.style.color = '#ffaa66';
        this.potElement.style.textShadow = '0 0 5px gold';
        setTimeout(() => {
            this.potElement.style.color = originalColor;
            this.potElement.style.textShadow = '';
        }, duration);
    }

    showPotMessage(message, type = 'info', duration = 2000) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'pot-message';
        msgDiv.textContent = message;
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '120px';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translateX(-50%)';
        msgDiv.style.backgroundColor = type === 'winner' ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.7)';
        msgDiv.style.color = type === 'winner' ? '#000' : '#ffd966';
        msgDiv.style.padding = '8px 16px';
        msgDiv.style.borderRadius = '30px';
        msgDiv.style.fontSize = '14px';
        msgDiv.style.fontWeight = 'bold';
        msgDiv.style.zIndex = '2000';
        msgDiv.style.whiteSpace = 'nowrap';
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), duration);
    }

    displaySidePots(sidePots) {
        this.updateSidePots(sidePots);
    }

    hideSidePots() {
        if (this.sidePotContainer) this.sidePotContainer.innerHTML = '';
    }

    toggleSidePots(visible) {
        if (this.sidePotContainer) {
            this.sidePotContainer.style.display = visible ? 'flex' : 'none';
        }
    }

    toggleBreakdown(visible) {
        if (this.potBreakdownElement) {
            this.potBreakdownElement.style.display = visible ? 'block' : 'none';
        }
    }

    updateForResponsive() {
        const isMobile = window.innerWidth < 700;
        if (this.sidePotContainer) {
            if (isMobile) {
                this.sidePotContainer.style.fontSize = '10px';
                this.sidePotContainer.style.padding = '2px 5px';
            } else {
                this.sidePotContainer.style.fontSize = '12px';
                this.sidePotContainer.style.padding = '5px 10px';
            }
        }
    }

    animatePotFromPlayers(players, potManager) {
        const animations = [];
        for (let player of players) {
            if (player.currentBet > 0) {
                const playerEl = document.querySelector(`.player-position[data-player-index="${player.id}"]`);
                if (playerEl) {
                    const anim = this.animateChipToPot(playerEl, player.currentBet, this.potElement, 300);
                    animations.push(anim);
                }
            }
        }
        return Promise.all(animations);
    }

    async animatePotDistribution(winners, pots, potManager) {
        const allPots = potManager.getAllPots();
        for (let i = 0; i < allPots.length; i++) {
            const pot = allPots[i];
            const eligible = pot.eligiblePlayers;
            const potWinners = winners.filter(w => eligible.includes(w));
            if (potWinners.length === 0) continue;
            const potElement = i === 0 ? this.potElement : this.sidePotContainer?.children[i-1];
            if (!potElement) continue;
            for (let winner of potWinners) {
                const winnerEl = document.querySelector(`.player-position[data-player-index="${winner.id}"]`);
                if (winnerEl) {
                    await this.animatePotWinner(potElement, winnerEl, pot.amount / potWinners.length, 500);
                    await new Promise(r => setTimeout(r, 200));
                }
            }
        }
    }

    createPotBar() {
        const bar = document.createElement('div');
        bar.className = 'pot-bar';
        bar.style.position = 'absolute';
        bar.style.bottom = '0';
        bar.style.left = '0';
        bar.style.height = '4px';
        bar.style.backgroundColor = '#ffd966';
        bar.style.width = '0%';
        bar.style.transition = 'width 0.3s';
        if (this.potElement && this.potElement.parentElement) {
            this.potElement.parentElement.style.position = 'relative';
            this.potElement.parentElement.appendChild(bar);
            this.potBar = bar;
        }
    }

    updatePotBar(maxPot) {
        if (!this.potBar) return;
        const percent = (this.currentTotal / maxPot) * 100;
        this.potBar.style.width = `${Math.min(100, percent)}%`;
    }

    setPotTheme(theme) {
        if (!this.potElement) return;
        if (theme === 'dark') {
            this.potElement.style.color = '#ffd966';
            if (this.sidePotContainer) this.sidePotContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        } else if (theme === 'light') {
            this.potElement.style.color = '#b87c4f';
            if (this.sidePotContainer) this.sidePotContainer.style.backgroundColor = 'rgba(255,255,255,0.5)';
        }
    }

    setPotFontSize(size) {
        if (this.potElement) this.potElement.style.fontSize = size;
    }

    setPotFontWeight(weight) {
        if (this.potElement) this.potElement.style.fontWeight = weight;
    }

    addPotInfoTooltip() {
        if (!this.potElement) return;
        this.potElement.addEventListener('mouseenter', () => {
            if (window.gameState && window.gameState.potManager) {
                const allPots = window.gameState.potManager.getAllPots();
                let text = '';
                for (let i = 0; i < allPots.length; i++) {
                    text += `${i === 0 ? 'Главный' : `Сайд ${i}`}: ${allPots[i].amount} (${allPots[i].eligiblePlayers.map(p => p.name).join(',')})\n`;
                }
                this.showPotTooltip(this.currentTotal, allPots[0]?.eligiblePlayers || []);
            }
        });
    }

    destroy() {
        if (this.sidePotContainer) this.sidePotContainer.remove();
        if (this.potBreakdownElement) this.potBreakdownElement.remove();
        if (this.potBar) this.potBar.remove();
        this.potElement = null;
        this.sidePotContainer = null;
        this.potBreakdownElement = null;
        if (this.breakdownTimeout) clearTimeout(this.breakdownTimeout);
    }
};

window.ViewPot = window.ViewPot;

console.log('view_Pot.js loaded');
