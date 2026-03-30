(() => {
    const app = window.StickmanExt;

    app.animation.applyCharacterVisuals = (isTouchingAnyElement) => {
        const state = app.state;
        const ball = app.refs.ball;
        const stickFigureAssets = app.assets.stickFigureAssets;

        if (state.velocityX > 0.5) state.facingRight = true;
        if (state.velocityX < -0.5) state.facingRight = false;

        let currentSvg = stickFigureAssets.idle;

        if (state.isEating) {
            currentSvg = stickFigureAssets.eat;
        } else if (state.isWallSliding) {
            currentSvg = stickFigureAssets.wallSlide;
            state.facingRight = (state.wallSlideSide === 'right');
        } else if ((state.currentMode === 'normal' && state.reachedTarget && state.normalTargetAction === 'sit') || (state.currentMode === 'study' && state.studyState === 'sitting' && isTouchingAnyElement)) {
            currentSvg = stickFigureAssets.sit;
        } else if (!isTouchingAnyElement && state.velocityY < -1) {
            currentSvg = stickFigureAssets.jump;
        } else if (!isTouchingAnyElement && state.velocityY > 1) {
            currentSvg = stickFigureAssets.fall;
        } else if (Math.abs(state.velocityX) > 0.5) {
            const animSpeed = state.currentMode === 'study' ? 24 : 16;
            currentSvg = (Math.floor(state.frameCount / animSpeed) % 2 === 0) ? stickFigureAssets.run1 : stickFigureAssets.run2;
        }

        ball.style.backgroundImage = `url("${currentSvg}")`;
        ball.style.transform = state.facingRight ? 'scaleX(1)' : 'scaleX(-1)';

        if (isTouchingAnyElement) {
            ball.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        } else {
            ball.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
            if (state.currentActiveElement && state.velocityY > 0) {
                app.actions.resetActiveElement();
            }
        }

        ball.style.left = `${state.posX}px`;
        ball.style.top = `${state.posY}px`;
    };

    app.animation.applyDraggingVisuals = () => {
        const state = app.state;

        state.dragVelocityX = state.posX - state.lastPosX;
        state.dragVelocityY = state.posY - state.lastPosY;
        state.lastPosX = state.posX;
        state.lastPosY = state.posY;

        app.refs.ball.style.backgroundImage = `url("${app.assets.stickFigureAssets.fall}")`;
    };

    app.animation.updateSpeechBubblePosition = () => {
        const state = app.state;
        const speechBubble = app.refs.speechBubble;

        if (speechBubble.style.display === 'block') {
            let bubbleX = state.posX + (app.config.BALL_SIZE / 2) - (speechBubble.offsetWidth / 2);
            if (bubbleX < 5) bubbleX = 5;
            if (bubbleX + speechBubble.offsetWidth > window.innerWidth - 5) {
                bubbleX = window.innerWidth - speechBubble.offsetWidth - 5;
            }
            speechBubble.style.left = `${bubbleX}px`;
            speechBubble.style.top = `${state.posY - speechBubble.offsetHeight - 10}px`;
        }
    };

    app.animation.updateDebugOverlay = (currentSlantedYDisplay) => {
        const state = app.state;
        const context = state.pageContext;
        const pageType = context && context.pageType ? context.pageType : state.pageLastType;
        const keywordCount = context && context.keywords ? context.keywords.length : 0;
        const scrapeStatus = state.pageScrapeInProgress ? 'scraping' : (state.pageInsightModeState.status || 'idle');

        app.refs.debugOverlay.innerHTML = `
        Char X: ${state.posX.toFixed(2)}<br>
        Char Y: ${state.posY.toFixed(2)}<br>
        Slanted Y: ${currentSlantedYDisplay}<br>
        Angle: ${state.currentTiltAngle.toFixed(2)}°<br>
        Mode: ${state.currentMode}<br>
        Page Type: ${pageType || 'unknown'}<br>
        Scrape: ${scrapeStatus}<br>
        Keywords: ${keywordCount}<br>
        Jumps: ${state.jumpCount}/${app.config.MAX_JUMPS}<br>
        WallSlide: ${state.isWallSliding}
    `;
    };

    const applyZapLine = (lineEl, x1, y1, x2, y2, opacity) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy);
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        lineEl.style.left = `${x1}px`;
        lineEl.style.top = `${y1}px`;
        lineEl.style.width = `${Math.max(1, length)}px`;
        lineEl.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        lineEl.style.transform = `rotate(${angleDeg}deg)`;
    };

    app.animation.renderZapEffects = () => {
        const state = app.state;
        const effects = state.zapEffectsQueue;
        const hasEffects = Array.isArray(effects) && effects.length > 0;

        if (!hasEffects) {
            if (app.refs.zapLayer) {
                app.refs.zapLayer.style.display = 'none';
                while (app.refs.zapLayer.lastChild) app.refs.zapLayer.removeChild(app.refs.zapLayer.lastChild);
            }
            return;
        }

        const layer = app.dom.ensureZapLayer();
        if (!layer) return;

        const now = Date.now();
        const survivors = [];
        const requiredLines = effects.length * 2;

        while (layer.childElementCount < requiredLines) {
            const line = document.createElement('div');
            line.className = 'screen-pet-zap-line';
            layer.appendChild(line);
        }

        let lineIndex = 0;
        for (let i = 0; i < effects.length; i++) {
            const effect = effects[i];
            const ageMs = now - effect.createdAtMs;
            const durationMs = Math.max(1, effect.durationMs || app.config.WIDGET_ZAP_DURATION_MS);
            if (ageMs >= durationMs) continue;

            survivors.push(effect);

            const progress = ageMs / durationMs;
            const jitterScale = (1 - progress) * 12;
            const phase = (now + i * 31) * 0.04;
            const midX = ((effect.startX + effect.endX) / 2) + (Math.sin(phase) * jitterScale);
            const midY = ((effect.startY + effect.endY) / 2) + (Math.cos(phase) * jitterScale);
            const opacity = 1 - progress;

            const lineA = layer.children[lineIndex++];
            const lineB = layer.children[lineIndex++];
            applyZapLine(lineA, effect.startX, effect.startY, midX, midY, opacity);
            applyZapLine(lineB, midX, midY, effect.endX, effect.endY, opacity);
        }

        while (layer.childElementCount > lineIndex) {
            layer.removeChild(layer.lastChild);
        }

        state.zapEffectsQueue = survivors;
        layer.style.display = survivors.length > 0 ? 'block' : 'none';
    };
})();
