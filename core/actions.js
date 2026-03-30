(() => {
    const app = window.StickmanExt;

    app.actions.resetActiveElement = () => {
        const state = app.state;
        if (state.currentActiveElement) {
            if (state.currentMode !== 'study') {
                if (state.currentActiveElement.dataset.physicsType === 'tilt') {
                    state.currentActiveElement.style.transform = 'translateY(0px) rotate(0deg)';
                } else {
                    const spans = state.currentActiveElement.querySelectorAll('span');
                    spans.forEach(s => s.style.transform = 'translateY(0px)');
                }
            }
            state.currentActiveElement = null;
            state.currentTiltAngle = 0;
        }
    };

    app.actions.jump = () => {
        const state = app.state;
        if (state.jumpCount < app.config.MAX_JUMPS) {
            state.velocityY = -10;
            state.jumpCount++;
            app.actions.resetActiveElement();

            if (state.isWallSliding) {
                if (state.wallSlideSide === 'left') state.velocityX = 6;
                else if (state.wallSlideSide === 'right') state.velocityX = -6;
                state.isWallSliding = false;
            }
        }
    };

    app.actions.throwElement = (el) => {
        if (!el) return;
        el.dataset.thrown = 'true';

        const rect = el.getBoundingClientRect();
        document.body.appendChild(el);

        el.style.transition = 'none';
        el.style.transform = 'none';
        el.style.position = 'fixed';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.margin = '0';
        el.style.zIndex = '2147483646';

        void el.offsetWidth;

        el.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
        el.style.left = (window.innerWidth + 200) + 'px';
        el.style.top = (rect.top - 200) + 'px';
        el.style.transform = 'rotate(720deg)';

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 1000);
    };

    app.actions.eatElement = (el) => {
        if (!el) return;
        el.dataset.thrown = 'true';

        const rect = el.getBoundingClientRect();
        document.body.appendChild(el);

        el.style.transition = 'none';
        el.style.transform = 'none';
        el.style.position = 'fixed';
        el.style.left = rect.left + 'px';
        el.style.top = rect.top + 'px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.margin = '0';
        el.style.zIndex = '2147483646';

        void el.offsetWidth;

        el.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        el.style.top = (rect.top - 150) + 'px';
        el.style.transform = 'scale(0.1) rotate(360deg)';
        el.style.opacity = '0';

        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 600);
    };
})();
