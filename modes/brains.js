(() => {
    const app = window.StickmanExt;

    app.brains.BrainMap = {
        manual: () => {},

        normal: () => {
            const state = app.state;

            if (!state.globalTargetElement) {
                const textElements = app.dom.getEligibleTextElements();
                if (textElements.length > 0) {
                    const randomIndex = Math.floor(Math.random() * textElements.length);
                    state.globalTargetElement = textElements[randomIndex];
                    app.dom.highlightNormalTarget(state.globalTargetElement);
                    state.reachedTarget = false;
                }
            }

            if (state.globalTargetElement && !state.reachedTarget) {
                if (state.currentActiveElement === state.globalTargetElement) {
                    if (state.normalTargetAction === 'sit') {
                        state.reachedTarget = true;
                        state.isLeftPressed = false;
                        state.isRightPressed = false;
                    } else if (state.normalTargetAction === 'throw') {
                        app.actions.throwElement(state.globalTargetElement);
                        state.globalTargetElement = null;
                        app.actions.resetActiveElement();
                        app.actions.jump();
                    } else if (state.normalTargetAction === 'eat') {
                        app.actions.eatElement(state.globalTargetElement);
                        state.globalTargetElement = null;
                        app.actions.resetActiveElement();
                        state.isEating = true;
                        state.eatTimer = 45;
                        state.velocityX = 0;
                    }
                } else {
                    const targetRect = state.globalTargetElement.getBoundingClientRect();
                    const targetCenterX = targetRect.left + (targetRect.width / 2);
                    const myCenterX = state.posX + (app.config.BALL_SIZE / 2);
                    const myBottomY = state.posY + app.config.BALL_SIZE;

                    state.isLeftPressed = false;
                    state.isRightPressed = false;

                    const isUnderTarget = (targetRect.top < state.posY) && Math.abs(myCenterX - targetCenterX) < (targetRect.width / 2 + 20);
                    const distanceY = state.posY - targetRect.bottom;

                    if (targetRect.top > myBottomY && state.currentActiveElement && state.currentActiveElement !== state.globalTargetElement) {
                        const currentRect = state.currentActiveElement.getBoundingClientRect();
                        const distToLeftEdge = myCenterX - currentRect.left;
                        const distToRightEdge = currentRect.right - myCenterX;

                        if (distToLeftEdge < distToRightEdge) state.isLeftPressed = true;
                        else state.isRightPressed = true;
                    } else if (isUnderTarget && distanceY > 120) {
                        if (myCenterX < window.innerWidth / 2) state.isLeftPressed = true;
                        else state.isRightPressed = true;

                        if (state.isWallSliding) app.actions.jump();
                    } else {
                        if (myCenterX < targetCenterX - 30) state.isRightPressed = true;
                        else if (myCenterX > targetCenterX + 30) state.isLeftPressed = true;

                        const isStuck = Math.abs(state.velocityX) < 0.5 && (state.isLeftPressed || state.isRightPressed);

                        if (Math.abs(state.velocityY) < 1.5 || state.currentActiveElement || state.isWallSliding) {
                            if (isStuck || (isUnderTarget && Math.random() < 0.1) || (targetRect.top < state.posY && Math.random() < 0.02) || state.isWallSliding) {
                                app.actions.jump();
                            }
                        }
                    }
                }
            }
        },

        chaos: () => {
            const state = app.state;

            state.isLeftPressed = false;
            state.isRightPressed = false;

            if (state.frameCount % 60 === 0 && Math.random() > 0.5) {
                state.autoDirection *= -1;
            }

            if (state.autoDirection === 1) state.isRightPressed = true;
            else if (state.autoDirection === -1) state.isLeftPressed = true;

            if (Math.abs(state.velocityY) < 1.5 || state.currentActiveElement || state.isWallSliding) {
                if (Math.random() < 0.03 || state.isWallSliding) app.actions.jump();
            }
        },

        mouse_chase: () => {
            const state = app.state;

            state.isLeftPressed = false;
            state.isRightPressed = false;

            const myCenterX = state.posX + (app.config.BALL_SIZE / 2);
            const myCenterY = state.posY + (app.config.BALL_SIZE / 2);
            const myBottomY = state.posY + app.config.BALL_SIZE;

            const dist = Math.hypot(state.mouseX - myCenterX, state.mouseY - myCenterY);
            if (dist < (app.config.BALL_SIZE / 2) + 15 && !state.isDragging && state.catchCooldown <= 0) {
                state.isDragging = true;
                state.isForcedDragging = true;
                state.offsetX = app.config.BALL_SIZE / 2;
                state.offsetY = app.config.BALL_SIZE / 2;
                state.posX = state.mouseX - state.offsetX;
                state.posY = state.mouseY - state.offsetY;
                state.velocityX = 0;
                state.velocityY = 0;
                state.jumpCount = 0;
                app.actions.resetActiveElement();
                app.refs.ball.style.cursor = 'grabbing';
                return;
            }

            if (Math.random() < 0.005) {
                app.ui.talk('im gonna catch ya!', 1500);
            }

            const distanceY = state.posY - state.mouseY;
            const isMouseBelow = state.mouseY > myBottomY + 20;
            const isMouseAbove = state.mouseY < state.posY;

            if (isMouseBelow && state.currentActiveElement) {
                const currentRect = state.currentActiveElement.getBoundingClientRect();
                const distToLeftEdge = myCenterX - currentRect.left;
                const distToRightEdge = currentRect.right - myCenterX;

                if (distToLeftEdge < distToRightEdge) state.isLeftPressed = true;
                else state.isRightPressed = true;
            } else if (isMouseAbove && distanceY > 470) {
                if (myCenterX < window.innerWidth / 2) state.isLeftPressed = true;
                else state.isRightPressed = true;
            } else {
                if (myCenterX < state.mouseX - 20) state.isRightPressed = true;
                else if (myCenterX > state.mouseX + 20) state.isLeftPressed = true;
            }

            const isStuck = Math.abs(state.velocityX) < 0.5 && (state.isLeftPressed || state.isRightPressed);
            const isCharacterUnderMouse = isMouseAbove && Math.abs(myCenterX - state.mouseX) < 100;

            if (Math.abs(state.velocityY) < 1.5 || state.currentActiveElement || state.isWallSliding) {
                if (isMouseAbove && distanceY > 470 && state.isWallSliding) {
                    app.actions.jump();
                } else if (!isMouseBelow) {
                    if (isStuck || (isCharacterUnderMouse && Math.random() < 0.1) || (isMouseAbove && Math.random() < 0.02) || state.isWallSliding) {
                        app.actions.jump();
                    }
                } else if (isStuck) {
                    if (Math.random() < 0.05) app.actions.jump();
                }
            }
        },

        page_insight: () => {
            const state = app.state;

            state.isLeftPressed = false;
            state.isRightPressed = false;

            if (state.frameCount % 45 === 0) {
                app.dom.refreshPageContextIfDue();
            }

            const context = state.pageContext;
            const pageType = context && context.pageType ? context.pageType : 'general';

            if (state.frameCount % 180 === 0) {
                state.autoDirection *= -1;
            }

            if (pageType === 'google_doc' || pageType === 'form_heavy') {
                if (Math.abs(state.velocityX) < 0.6) {
                    if (state.autoDirection === 1) state.isRightPressed = true;
                    else state.isLeftPressed = true;
                }
            } else if (pageType === 'data_table' || pageType === 'code_docs') {
                if (state.autoDirection === 1) state.isRightPressed = true;
                else state.isLeftPressed = true;

                const isStuck = Math.abs(state.velocityX) < 0.35 && (state.isLeftPressed || state.isRightPressed);
                if ((Math.abs(state.velocityY) < 1.5 || state.currentActiveElement || state.isWallSliding) && (isStuck || state.isWallSliding)) {
                    app.actions.jump();
                }
            } else {
                if (state.autoDirection === 1) state.isRightPressed = true;
                else state.isLeftPressed = true;

                if ((Math.abs(state.velocityY) < 1.5 || state.currentActiveElement || state.isWallSliding) && (Math.random() < 0.01 || state.isWallSliding)) {
                    app.actions.jump();
                }
            }

            const framesSinceLastQuestion = state.frameCount - state.lastQuestionFrame;
            if (framesSinceLastQuestion >= state.pageQuestionIntervalFrames) {
                if (state.pageQuestionQueue.length === 0) {
                    state.pageQuestionQueue = app.dom.buildQuestionQueue(state.pageContext || {
                        pageType: state.pageLastType || 'general',
                        scrapeStatus: state.pageInsightModeState.status || 'error',
                        keywords: []
                    });
                }

                if (state.pageQuestionQueue.length > 0) {
                    const nextQuestion = state.pageQuestionQueue.shift();
                    app.ui.talk(nextQuestion, 3800);
                    state.lastQuestionFrame = state.frameCount;
                }
            }

            if (state.frameCount % 300 === 0 && (state.pageInsightModeState.status === 'blocked' || state.pageInsightModeState.status === 'error')) {
                app.ui.talk('I cannot fully read this page, but I can still keep you company.', 3000);
            }
        },

        study: () => {
            const state = app.state;

            state.isLeftPressed = false;
            state.isRightPressed = false;

            if (state.studyTimer > 0) state.studyTimer--;

            if (state.studyTimer <= 0) {
                if (state.studyState === 'sitting') {
                    state.studyState = 'wandering';
                    state.studyTimer = 60 + Math.random() * 120;
                    state.autoDirection = Math.random() > 0.5 ? 1 : -1;
                } else {
                    state.studyState = 'sitting';
                    state.studyTimer = 180 + Math.random() * 300;
                }
            }

            if (state.studyState === 'wandering') {
                if (state.autoDirection === 1) state.isRightPressed = true;
                else state.isLeftPressed = true;

                const isStuck = Math.abs(state.velocityX) < 0.2 && (state.isLeftPressed || state.isRightPressed);
                if (Math.abs(state.velocityY) < 1.5 || state.currentActiveElement) {
                    if (isStuck && Math.random() < 0.1) app.actions.jump();
                }
            } else {
                state.velocityX *= 0.5;
            }
        }
    };
})();
