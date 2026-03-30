(() => {
    const app = window.StickmanExt;

    const speechBubble = document.createElement('div');
    speechBubble.id = 'screen-pet-speech';
    speechBubble.style.position = 'fixed';
    speechBubble.style.backgroundColor = 'white';
    speechBubble.style.color = 'black';
    speechBubble.style.border = '2px solid black';
    speechBubble.style.borderRadius = '15px';
    speechBubble.style.padding = '8px 12px';
    speechBubble.style.fontWeight = 'bold';
    speechBubble.style.fontFamily = 'Comic Sans MS, sans-serif';
    speechBubble.style.fontSize = '14px';
    speechBubble.style.zIndex = '2147483648';
    speechBubble.style.pointerEvents = 'none';
    speechBubble.style.display = 'none';
    speechBubble.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
    document.body.appendChild(speechBubble);

    const modeButton = document.createElement('button');
    modeButton.style.position = 'fixed';
    modeButton.style.top = '10px';
    modeButton.style.left = '10px';
    modeButton.style.padding = '10px 15px';
    modeButton.style.color = 'white';
    modeButton.style.border = 'none';
    modeButton.style.borderRadius = '5px';
    modeButton.style.fontWeight = 'bold';
    modeButton.style.cursor = 'pointer';
    modeButton.style.zIndex = '2147483647';
    document.body.appendChild(modeButton);

    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'screen-pet-debug';
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.top = '10px';
    debugOverlay.style.right = '10px';
    debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugOverlay.style.color = '#00ff00';
    debugOverlay.style.padding = '10px';
    debugOverlay.style.fontFamily = 'monospace';
    debugOverlay.style.fontSize = '14px';
    debugOverlay.style.zIndex = '2147483647';
    debugOverlay.style.pointerEvents = 'none';
    document.body.appendChild(debugOverlay);

    app.refs.speechBubble = speechBubble;
    app.refs.modeButton = modeButton;
    app.refs.debugOverlay = debugOverlay;

    app.ui.talk = (text, duration = 2500) => {
        speechBubble.innerText = text;
        speechBubble.style.display = 'block';

        if (app.state.speechTimerId) clearTimeout(app.state.speechTimerId);

        app.state.speechTimerId = setTimeout(() => {
            speechBubble.style.display = 'none';
        }, duration);
    };

    app.ui.updateModeUI = () => {
        const currentMode = app.state.currentMode;
        let displayText = currentMode.replace('_', ' ').toUpperCase();
        modeButton.innerText = `Mode: ${displayText}`;

        if (currentMode === 'manual') modeButton.style.backgroundColor = '#f44336';
        else if (currentMode === 'normal') modeButton.style.backgroundColor = '#4CAF50';
        else if (currentMode === 'chaos') modeButton.style.backgroundColor = '#9C27B0';
        else if (currentMode === 'mouse_chase') modeButton.style.backgroundColor = '#FF9800';
        else if (currentMode === 'study') modeButton.style.backgroundColor = '#2196F3';
        else if (currentMode === 'page_insight') modeButton.style.backgroundColor = '#607D8B';
    };

    app.ui.bindModeButton = () => {
        modeButton.onclick = () => {
            const state = app.state;
            const previousMode = state.currentMode;
            const nextIndex = (state.availableModes.indexOf(state.currentMode) + 1) % state.availableModes.length;
            state.currentMode = state.availableModes[nextIndex];
            app.ui.updateModeUI();

            state.isLeftPressed = false;
            state.isRightPressed = false;

            if (state.isForcedDragging) {
                state.isForcedDragging = false;
                state.isDragging = false;
                app.refs.ball.style.cursor = 'grab';
                state.catchCooldown = 60;
            }

            if (state.voiceRecognitionActive && app.input.stopVoiceRecognition) {
                app.input.stopVoiceRecognition();
            }

            if (app.dom.clearNoteDragState) {
                app.dom.clearNoteDragState();
            }

            if (state.currentMode === 'study') {
                app.dom.resetStudyTransforms();
            }

            if (previousMode === 'page_insight' || state.currentMode === 'page_insight') {
                state.pageQuestionQueue = [];
                state.lastQuestionFrame = -99999;
                state.pageScrapeInProgress = false;
                state.pageInsightModeState.status = 'idle';
                state.pageInsightModeState.lastError = '';
            }

            if (state.globalTargetElement) {
                app.dom.restorePhysicsHighlight(state.globalTargetElement);
                state.globalTargetElement = null;
            }

            if (state.currentMode === 'normal') {
                const textElements = app.dom.getEligibleTextElements();
                if (textElements.length > 0) {
                    const randomIndex = Math.floor(Math.random() * textElements.length);
                    state.globalTargetElement = textElements[randomIndex];
                    app.dom.highlightNormalTarget(state.globalTargetElement);
                }
                state.reachedTarget = false;
            }
        };
    };
})();
