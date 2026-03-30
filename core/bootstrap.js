(() => {
    const app = window.StickmanExt;

    app.bootstrap.loadExplainSettings = (callback) => {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            if (typeof callback === 'function') callback();
            return;
        }

        const keys = [app.config.AI_STORAGE_KEY, app.config.AI_ENDPOINT_STORAGE_KEY];
        chrome.storage.local.get(keys, (result) => {
            const apiKey = (result[app.config.AI_STORAGE_KEY] || '').trim();
            const endpoint = (result[app.config.AI_ENDPOINT_STORAGE_KEY] || '').trim();

            app.ai.setCredentials(apiKey, endpoint || app.config.AI_DEFAULT_ENDPOINT);

            if (typeof callback === 'function') callback();
        });
    };

    app.bootstrap.bindExplainStorageSync = () => {
        if (app.state.__explainStorageBound) return;
        app.state.__explainStorageBound = true;

        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) return;

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'local') return;

            const keyChanged = Object.prototype.hasOwnProperty.call(changes, app.config.AI_STORAGE_KEY);
            const endpointChanged = Object.prototype.hasOwnProperty.call(changes, app.config.AI_ENDPOINT_STORAGE_KEY);
            if (!keyChanged && !endpointChanged) return;

            const nextApiKey = keyChanged
                ? (changes[app.config.AI_STORAGE_KEY].newValue || '').trim()
                : app.ai.getApiKey();

            const nextEndpoint = endpointChanged
                ? (changes[app.config.AI_ENDPOINT_STORAGE_KEY].newValue || '').trim()
                : app.state.explainEndpoint;

            app.ai.setCredentials(nextApiKey, nextEndpoint || app.config.AI_DEFAULT_ENDPOINT);
        });
    };

    app.bootstrap.init = () => {
        if (app.state.__started) return;
        app.state.__started = true;

        app.bootstrap.bindExplainStorageSync();
        app.bootstrap.loadExplainSettings();

        app.ui.updateModeUI();
        app.ui.bindModeButton();

        if (app.config.SHOW_BOUNDING_BOXES) {
            app.dom.assignPhysicsTypes();
        }

        app.input.bind();
        app.ui.talk('hello!', 3000);
        app.loop.animateBall();
    };
})();
