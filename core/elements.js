(() => {
    const app = window.StickmanExt;
    const stickFigureAssets = app.assets.stickFigureAssets;

    const ball = document.createElement('div');
    ball.id = 'screen-pet-ball';
    ball.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
    ball.style.position = 'fixed';
    ball.style.width = `${app.config.BALL_SIZE}px`;
    ball.style.height = `${app.config.BALL_SIZE}px`;
    ball.style.borderRadius = '10px';
    ball.style.zIndex = '2147483647';
    ball.style.cursor = 'grab';
    ball.style.userSelect = 'none';
    ball.style.backgroundImage = `url("${stickFigureAssets.idle}")`;
    ball.style.backgroundSize = 'contain';
    ball.style.backgroundRepeat = 'no-repeat';
    ball.style.backgroundPosition = 'center';
    document.body.appendChild(ball);

    app.refs.ball = ball;
})();
