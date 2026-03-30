(() => {
    const app = window.StickmanExt;

    app.config.SHOW_BOUNDING_BOXES = true;
    app.config.TEXT_ELEMENTS_SELECTOR = 'p, h1, h2, h3';
    app.config.ELIGIBLE_TEXT_ELEMENTS_SELECTOR = 'p:not([data-thrown="true"]), h1:not([data-thrown="true"]), h2:not([data-thrown="true"]), h3:not([data-thrown="true"])';

    app.config.BALL_SIZE = 80;
    app.config.GRAVITY = 0.2;
    app.config.FRICTION = 0.92;
    app.config.BOUNCE = -0.4;
    app.config.ACCELERATION = 0.2;
    app.config.MAX_SPEED = 3;
    app.config.MAX_JUMPS = 2;

    app.config.AI_STORAGE_KEY = 'explainApiKey';
    app.config.AI_ENDPOINT_STORAGE_KEY = 'explainEndpoint';
    app.config.AI_DEFAULT_ENDPOINT = 'https://api.openai.com/v1/responses';
    app.config.AI_DEFAULT_MODEL = 'gpt-5.4';
    app.config.AI_REQUEST_TIMEOUT_MS = 10000;
    app.config.AI_ASK_TIMEOUT_MS = 10000;
    app.config.AI_MAX_SELECTION_CHARS = 1500;
    app.config.AI_MAX_QUESTION_CHARS = 350;
    app.config.CLICK_MAX_DURATION_MS = 260;
    app.config.CLICK_MAX_MOVE_PX = 8;

    app.config.WIDGET_Z_INDEX_BASE = 2147483646;
    app.config.WIDGET_MAX_TIMERS = 6;
    app.config.WIDGET_MAX_NOTES = 5;
    app.config.WIDGET_TIMER_DEFAULT_SECONDS = 300;
    app.config.WIDGET_TIMER_MAX_SECONDS = 24 * 60 * 60;
    app.config.WIDGET_NOTE_MAX_CHARS = 240;
    app.config.WIDGET_ZAP_DURATION_MS = 260;
    app.config.WIDGET_MAX_ZAPS = 8;
    app.config.NOTE_DRAG_CLICK_TOLERANCE_PX = 4;
})();
