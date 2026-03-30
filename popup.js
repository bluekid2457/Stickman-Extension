(() => {
    const AI_STORAGE_KEY = 'explainApiKey';
    const AI_ENDPOINT_STORAGE_KEY = 'explainEndpoint';
    const AI_DEFAULT_ENDPOINT = 'https://api.openai.com/v1/responses';

    const apiKeyInput = document.getElementById('apiKeyInput');
    const endpointInput = document.getElementById('endpointInput');
    const saveButton = document.getElementById('saveButton');
    const statusText = document.getElementById('statusText');
    const maskedKeyPreview = document.getElementById('maskedKeyPreview');

    let storedApiKey = '';

    const maskKey = (key) => {
        const trimmed = (key || '').trim();
        if (!trimmed) return 'none';
        if (trimmed.length <= 8) return `${trimmed.slice(0, 1)}***${trimmed.slice(-1)}`;
        return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
    };

    const setStatus = (message, isError) => {
        statusText.textContent = message;
        statusText.classList.toggle('error', Boolean(isError));
    };

    const isLikelyUrl = (value) => {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (error) {
            return false;
        }
    };

    const loadSettings = () => {
        chrome.storage.local.get([AI_STORAGE_KEY, AI_ENDPOINT_STORAGE_KEY], (result) => {
            storedApiKey = (result[AI_STORAGE_KEY] || '').trim();
            const endpoint = (result[AI_ENDPOINT_STORAGE_KEY] || '').trim();

            endpointInput.value = endpoint;
            endpointInput.placeholder = AI_DEFAULT_ENDPOINT;
            apiKeyInput.value = '';
            maskedKeyPreview.textContent = `Saved key: ${maskKey(storedApiKey)}`;
            setStatus('', false);
        });
    };

    saveButton.addEventListener('click', () => {
        const enteredKey = (apiKeyInput.value || '').trim();
        const endpoint = (endpointInput.value || '').trim() || AI_DEFAULT_ENDPOINT;

        if (!endpoint) {
            setStatus('Endpoint is required.', true);
            return;
        }

        if (!isLikelyUrl(endpoint)) {
            setStatus('Endpoint must be a valid http/https URL.', true);
            return;
        }

        const nextApiKey = enteredKey || storedApiKey;

        chrome.storage.local.set({
            [AI_STORAGE_KEY]: nextApiKey,
            [AI_ENDPOINT_STORAGE_KEY]: endpoint
        }, () => {
            if (chrome.runtime.lastError) {
                setStatus(`Save failed: ${chrome.runtime.lastError.message}`, true);
                return;
            }

            storedApiKey = nextApiKey;
            apiKeyInput.value = '';
            maskedKeyPreview.textContent = `Saved key: ${maskKey(storedApiKey)}`;
            setStatus('Saved successfully.', false);
        });
    });

    loadSettings();
})();
