(() => {
    const app = window.StickmanExt;

    app.state.isDragging = false;
    app.state.offsetX = 0;
    app.state.offsetY = 0;
    app.state.posX = 100;
    app.state.posY = 100;
    app.state.velocityX = 0;
    app.state.velocityY = 0;

    app.state.lastPosX = 100;
    app.state.lastPosY = 100;
    app.state.dragVelocityX = 0;
    app.state.dragVelocityY = 0;
    app.state.mouseX = window.innerWidth / 2;
    app.state.mouseY = window.innerHeight / 2;
    app.state.isForcedDragging = false;
    app.state.catchCooldown = 0;

    app.state.frameCount = 0;
    app.state.facingRight = true;
    app.state.jumpCount = 0;
    app.state.isWallSliding = false;
    app.state.wallSlideSide = null;
    app.state.isEating = false;
    app.state.eatTimer = 0;

    app.state.studyState = 'sitting';
    app.state.studyTimer = 60;

    app.state.isLeftPressed = false;
    app.state.isRightPressed = false;

    app.state.currentActiveElement = null;
    app.state.currentTiltAngle = 0;

    app.state.globalTargetElement = null;
    app.state.reachedTarget = false;
    app.state.normalTargetAction = 'eat';

    app.state.currentMode = 'manual';
    app.state.availableModes = ['manual', 'normal', 'chaos', 'mouse_chase', 'study', 'page_insight'];
    app.state.autoDirection = 1;

    app.state.pageContext = null;
    app.state.pageScrapeIntervalMs = 12000;
    app.state.pageQuestionIntervalFrames = 420;
    app.state.lastQuestionFrame = -99999;
    app.state.pageQuestionQueue = [];
    app.state.pageInsightModeState = {
        status: 'idle',
        lastScrapeMs: 0,
        lastError: ''
    };
    app.state.pageScrapeInProgress = false;
    app.state.pageLastType = 'unknown';

    app.state.hasExplainApiKey = false;
    app.state.explainEndpoint = app.config.AI_DEFAULT_ENDPOINT;
    app.state.explainInFlight = false;
    app.state.lastExplainError = '';
    app.state.lastExplainSelectionHash = '';
    app.state.aiAskInFlight = false;
    app.state.lastAskError = '';
    app.state.voiceRecognitionActive = false;
    app.state.stickmanPointerDownX = 0;
    app.state.stickmanPointerDownY = 0;
    app.state.stickmanPointerDownAtMs = 0;

    app.state.speechTimerId = null;

    app.state.widgetTimers = [];
    app.state.widgetNotes = [];
    app.state.widgetIdCounter = 0;
    app.state.zapEffectsQueue = [];
    app.state.noteDragState = {
        activeNoteId: null,
        offsetX: 0,
        offsetY: 0
    };
    app.state.timerPanelVisible = false;
    app.state.widgetTimerTickIntervalId = null;
})();
