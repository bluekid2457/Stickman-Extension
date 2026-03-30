(() => {
    const app = window.StickmanExt;

    app.physics.step = () => {
        const state = app.state;
        let currentSlantedYDisplay = 'N/A';

        const brain = app.brains.BrainMap[state.currentMode];
        if (brain) brain();

        let currentMaxSpeed = app.config.MAX_SPEED;
        let currentAcceleration = app.config.ACCELERATION;

        if (state.currentMode === 'study') {
            currentMaxSpeed = 1;
            currentAcceleration = 0.05;
        }

        if (state.isLeftPressed) state.velocityX -= currentAcceleration;
        if (state.isRightPressed) state.velocityX += currentAcceleration;

        if (state.velocityX > currentMaxSpeed) state.velocityX = currentMaxSpeed;
        if (state.velocityX < -currentMaxSpeed) state.velocityX = -currentMaxSpeed;

        state.velocityY += app.config.GRAVITY;
        state.posX += state.velocityX;
        state.posY += state.velocityY;

        state.isWallSliding = false;
        state.wallSlideSide = null;

        if (state.posX <= 0) {
            state.posX = 0;
            if (state.velocityY > 0 && state.isLeftPressed) {
                state.isWallSliding = true;
                state.wallSlideSide = 'left';
                state.velocityX = 0;
            } else {
                if (state.currentMode !== 'manual') state.autoDirection = 1;
                state.velocityX *= -0.8;
            }
        } else if (state.posX + app.config.BALL_SIZE >= window.innerWidth) {
            state.posX = window.innerWidth - app.config.BALL_SIZE;
            if (state.velocityY > 0 && state.isRightPressed) {
                state.isWallSliding = true;
                state.wallSlideSide = 'right';
                state.velocityX = 0;
            } else {
                if (state.currentMode !== 'manual') state.autoDirection = -1;
                state.velocityX *= -0.8;
            }
        }

        if (state.isWallSliding) {
            if (state.velocityY > 2) state.velocityY = 2;
            state.jumpCount = 0;
        }

        if (state.posY + app.config.BALL_SIZE >= window.innerHeight) {
            state.posY = window.innerHeight - app.config.BALL_SIZE;
            state.velocityY *= app.config.BOUNCE;
            if (!state.isLeftPressed && !state.isRightPressed) state.velocityX *= app.config.FRICTION;
            if (Math.abs(state.velocityY) < 1) state.velocityY = 0;
            app.actions.resetActiveElement();
            state.jumpCount = 0;
        }

        const textElements = app.dom.getEligibleTextElements();
        let isTouchingAnyElement = false;
        const ballCenterX = state.posX + (app.config.BALL_SIZE / 2);

        for (let el of textElements) {
            const rect = el.getBoundingClientRect();
            const isCurrent = (el === state.currentActiveElement);
            const physicsType = el.dataset.physicsType;

            const elementCenterX = rect.left + (rect.width / 2);
            let elementTopY = rect.top;
            let slantedY;
            let angleRad = 0;

            if (state.currentMode === 'study') {
                slantedY = elementTopY;
            } else if (physicsType === 'tilt') {
                const angleToUse = isCurrent ? state.currentTiltAngle : 0;
                angleRad = angleToUse * (Math.PI / 180);
                slantedY = elementTopY + Math.tan(angleRad) * (ballCenterX - elementCenterX) * 2;
            } else if (physicsType === 'dip') {
                const currentDip = isCurrent ? 15 : 0;
                slantedY = elementTopY + currentDip;
            }

            if (isCurrent && typeof slantedY === 'number') currentSlantedYDisplay = slantedY.toFixed(2);

            const lookUp = isCurrent ? 50 : 0;
            const lookDown = isCurrent ? 50 : 0;

            if (
                state.velocityY >= -2 &&
                state.posY + app.config.BALL_SIZE >= slantedY - lookUp &&
                state.posY + app.config.BALL_SIZE <= slantedY + 30 + lookDown &&
                state.posX + app.config.BALL_SIZE > rect.left &&
                state.posX < rect.right
            ) {
                isTouchingAnyElement = true;
                state.currentActiveElement = el;
                currentSlantedYDisplay = slantedY.toFixed(2);
                state.jumpCount = 0;

                state.posY = slantedY - app.config.BALL_SIZE;

                if (!isCurrent) state.velocityY *= app.config.BOUNCE;
                else state.velocityY = 0;

                if (!state.isLeftPressed && !state.isRightPressed) state.velocityX *= app.config.FRICTION;

                if (state.currentMode !== 'study') {
                    if (physicsType === 'tilt') {
                        const distanceOffCenter = ballCenterX - elementCenterX;
                        let newTiltAngle = distanceOffCenter / (rect.width / 15);
                        newTiltAngle = Math.max(-15, Math.min(15, newTiltAngle));
                        state.currentTiltAngle = newTiltAngle;
                        el.style.transform = `rotate(${state.currentTiltAngle}deg)`;
                        state.velocityX += Math.sin(angleRad) * 1.5;
                    } else if (physicsType === 'dip') {
                        const spans = el.querySelectorAll('span');
                        spans.forEach(span => {
                            const spanRect = span.getBoundingClientRect();
                            const spanCenterX = spanRect.left + (spanRect.width / 2);
                            const dist = Math.abs(ballCenterX - spanCenterX);

                            if (dist < 60) {
                                const currentDip = 15 * (1 - dist / 60);
                                span.style.transform = `translateY(${currentDip}px)`;
                            } else {
                                span.style.transform = 'translateY(0px)';
                            }
                        });
                    }
                }

                break;
            }
        }

        return {
            isTouchingAnyElement,
            currentSlantedYDisplay
        };
    };
})();
