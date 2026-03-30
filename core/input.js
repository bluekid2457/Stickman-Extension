(() => {
    const app = window.StickmanExt;

    let voiceRecognition = null;

    const formatSecondsForSpeech = (totalSeconds) => {
        const seconds = Math.max(1, Math.floor(totalSeconds || 0));
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        const parts = [];

        if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
        if (remainingSeconds > 0 && hours === 0) {
            parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`);
        }

        return parts.join(' ');
    };

    const executeLocalCommand = (text, source) => {
        const command = app.ai.parseLocalCommand ? app.ai.parseLocalCommand(text) : null;
        if (!command) return false;

        if (command.kind === 'timer') {
            const timerEl = app.dom.createTimerWidget(command);
            if (timerEl) app.dom.emitZapToElement(timerEl);

            const timerType = command.subtype === 'reminder' ? 'Reminder' : 'Timer';
            const spokenDuration = formatSecondsForSpeech(command.durationSeconds);
            app.ui.talk(`${timerType} set for ${spokenDuration}.`, 3000);
            return true;
        }

        if (command.kind === 'note') {
            const noteEl = app.dom.createNoteWidget(command);
            if (noteEl) app.dom.emitZapToElement(noteEl);

            const sourceText = source === 'voice' ? 'voice' : 'typed';
            app.ui.talk(`Note created from ${sourceText} command.`, 2600);
            return true;
        }

        return false;
    };

    const promptAndAsk = async () => {
        const question = window.prompt('Ask Stickman a question:');
        if (question === null) return;

        const trimmedQuestion = (question || '').trim();
        if (!trimmedQuestion) {
            app.ui.talk('Please enter a question first.', 2500);
            return;
        }

        if (executeLocalCommand(trimmedQuestion, 'typed')) return;

        try {
            const answer = await app.ai.askQuestion(trimmedQuestion, 'typed');
            app.ui.talk(answer, 4800);
        } catch (error) {
            const message = (error && error.message) ? error.message : 'Question request failed.';
            app.ui.talk(message, 3600);
        }
    };

    const startVoiceQuestion = () => {
        const state = app.state;
        if (state.voiceRecognitionActive) {
            app.ui.talk('Voice recognition is already active.', 2500);
            return;
        }

        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            app.ui.talk('Voice input is not supported in this browser.', 3000);
            return;
        }

        const recognition = new SpeechRecognitionCtor();
        voiceRecognition = recognition;
        state.voiceRecognitionActive = true;

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = async (event) => {
            const transcript = (event.results && event.results[0] && event.results[0][0] && event.results[0][0].transcript)
                ? event.results[0][0].transcript.trim()
                : '';

            if (!transcript) {
                app.ui.talk('I did not catch that.', 2500);
                return;
            }

            if (executeLocalCommand(transcript, 'voice')) return;

            try {
                const answer = await app.ai.askQuestion(transcript, 'voice');
                app.ui.talk(answer, 4800);
            } catch (error) {
                const message = (error && error.message) ? error.message : 'Question request failed.';
                app.ui.talk(message, 3600);
            }
        };

        recognition.onerror = (event) => {
            if (event && event.error === 'not-allowed') {
                app.ui.talk('Microphone permission was denied.', 3200);
                return;
            }
            app.ui.talk('Voice recognition failed. Try again.', 3000);
        };

        recognition.onend = () => {
            state.voiceRecognitionActive = false;
            voiceRecognition = null;
        };

        try {
            recognition.start();
            app.ui.talk('Listening...', 1500);
        } catch (error) {
            state.voiceRecognitionActive = false;
            voiceRecognition = null;
            app.ui.talk('Unable to start voice recognition.', 3000);
        }
    };

    app.input.stopVoiceRecognition = () => {
        if (!voiceRecognition) {
            app.state.voiceRecognitionActive = false;
            return;
        }

        try {
            voiceRecognition.stop();
        } catch (error) {
        }

        app.state.voiceRecognitionActive = false;
        voiceRecognition = null;
    };

    app.input.bind = () => {
        document.addEventListener('keydown', async (e) => {
            const isExplainShortcut = e.code === 'KeyE' && e.shiftKey && (e.ctrlKey || e.metaKey);
            if (isExplainShortcut) {
                e.preventDefault();

                if (!app.state.hasExplainApiKey) {
                    app.ui.talk('Add your API key in the extension popup first.', 3200);
                    return;
                }

                const selectedText = app.ai.getSelectedText();
                if (!selectedText) {
                    app.ui.talk('Highlight some text, then press Ctrl/Cmd+Shift+E.', 3200);
                    return;
                }

                try {
                    const explanation = await app.ai.explainSelection();
                    app.ui.talk(explanation, 4800);
                } catch (error) {
                    const message = (error && error.message) ? error.message : 'Explain request failed.';
                    app.ui.talk(message, 3600);
                }
                return;
            }

            const isVoiceShortcut = e.code === 'KeyV' && e.shiftKey && (e.ctrlKey || e.metaKey);
            if (isVoiceShortcut) {
                e.preventDefault();
                startVoiceQuestion();
                return;
            }

            if (app.state.currentMode !== 'manual') return;
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                app.actions.jump();
            }
            if (e.code === 'ArrowLeft') app.state.isLeftPressed = true;
            if (e.code === 'ArrowRight') app.state.isRightPressed = true;
        });

        document.addEventListener('keyup', (e) => {
            if (app.state.currentMode !== 'manual') return;
            if (e.code === 'ArrowLeft') app.state.isLeftPressed = false;
            if (e.code === 'ArrowRight') app.state.isRightPressed = false;
        });

        document.addEventListener('mousedown', (e) => {
            const state = app.state;
            if (state.isForcedDragging && e.target !== app.refs.ball) {
                state.isForcedDragging = false;
                state.isDragging = false;
                app.refs.ball.style.cursor = 'grab';
                state.velocityX = state.dragVelocityX;
                state.velocityY = state.dragVelocityY;
                state.catchCooldown = 60;
            }
        });

        app.refs.ball.addEventListener('mousedown', (e) => {
            const state = app.state;

            if (state.isForcedDragging) {
                state.isForcedDragging = false;
                state.isDragging = false;
                app.refs.ball.style.cursor = 'grab';
                state.velocityX = state.dragVelocityX;
                state.velocityY = state.dragVelocityY;
                state.catchCooldown = 60;
                state.stickmanPointerDownAtMs = 0;
                return;
            }

            state.isDragging = true;
            app.refs.ball.style.cursor = 'grabbing';
            state.offsetX = e.clientX - app.refs.ball.getBoundingClientRect().left;
            state.offsetY = e.clientY - app.refs.ball.getBoundingClientRect().top;
            state.velocityX = 0;
            state.velocityY = 0;

            state.lastPosX = state.posX;
            state.lastPosY = state.posY;
            state.dragVelocityX = 0;
            state.dragVelocityY = 0;
            state.jumpCount = 0;
            state.stickmanPointerDownX = e.clientX;
            state.stickmanPointerDownY = e.clientY;
            state.stickmanPointerDownAtMs = Date.now();

            app.actions.resetActiveElement();
        });

        document.addEventListener('mousemove', (e) => {
            const state = app.state;
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;

            if (!state.isDragging) return;

            state.posX = state.mouseX - state.offsetX;
            state.posY = state.mouseY - state.offsetY;
            app.refs.ball.style.left = `${state.posX}px`;
            app.refs.ball.style.top = `${state.posY}px`;
        });

        document.addEventListener('mouseup', async (e) => {
            const state = app.state;
            const wasDragging = state.isDragging;

            if (state.isDragging && !state.isForcedDragging) {
                state.isDragging = false;
                app.refs.ball.style.cursor = 'grab';
                state.velocityX = state.dragVelocityX;
                state.velocityY = state.dragVelocityY;
            }

            if (!wasDragging || state.isForcedDragging || state.stickmanPointerDownAtMs <= 0) {
                state.stickmanPointerDownAtMs = 0;
                return;
            }

            const elapsedMs = Date.now() - state.stickmanPointerDownAtMs;
            const dx = e.clientX - state.stickmanPointerDownX;
            const dy = e.clientY - state.stickmanPointerDownY;
            const movedDistanceSq = (dx * dx) + (dy * dy);
            const movedThresholdSq = app.config.CLICK_MAX_MOVE_PX * app.config.CLICK_MAX_MOVE_PX;
            const isClick = elapsedMs <= app.config.CLICK_MAX_DURATION_MS && movedDistanceSq <= movedThresholdSq;
            state.stickmanPointerDownAtMs = 0;

            if (!isClick) return;
            await promptAndAsk();
        });
    };
})();
