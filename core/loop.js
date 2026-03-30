(() => {
    const app = window.StickmanExt;

    app.loop.animateBall = () => {
        const state = app.state;
        let currentSlantedYDisplay = 'N/A';

        state.frameCount++;
        if (state.catchCooldown > 0) state.catchCooldown--;
        if (state.eatTimer > 0) {
            state.eatTimer--;
            if (state.eatTimer <= 0) state.isEating = false;
        }

        if (!state.isDragging) {
            const physicsResult = app.physics.step();
            app.animation.applyCharacterVisuals(physicsResult.isTouchingAnyElement);
            currentSlantedYDisplay = physicsResult.currentSlantedYDisplay;
        } else {
            app.animation.applyDraggingVisuals();
        }

        if (state.zapEffectsQueue && state.zapEffectsQueue.length > 0) {
            app.animation.renderZapEffects();
        }

        app.animation.updateSpeechBubblePosition();
        app.animation.updateDebugOverlay(currentSlantedYDisplay);

        requestAnimationFrame(app.loop.animateBall);
    };
})();
