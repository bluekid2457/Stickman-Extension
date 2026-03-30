(() => {
    const app = window.StickmanExt;

    let explainApiKey = '';

    const hashSelection = (text) => {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        return `${text.length}:${Math.abs(hash)}`;
    };

    const buildResponsesInput = (text) => ([
        {
            role: 'user',
            content: [
                {
                    type: 'input_text',
                    text
                }
            ]
        }
    ]);

    const shortenForBubble = (text, maxChars = 280) => {
        const cleaned = (text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return '';
        if (cleaned.length <= maxChars) return cleaned;
        return `${cleaned.slice(0, Math.max(1, maxChars - 3))}...`;
    };

    const normalizeWhitespace = (text) => (text || '').replace(/\s+/g, ' ').trim();

    const parseDurationSeconds = (text) => {
        if (!text) return 0;

        const unitRegex = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/gi;
        let totalSeconds = 0;
        let match = unitRegex.exec(text);

        while (match) {
            const amount = Number(match[1]);
            const unit = (match[2] || '').toLowerCase();

            if (Number.isFinite(amount) && amount > 0) {
                if (unit.startsWith('h')) totalSeconds += Math.round(amount * 3600);
                else if (unit.startsWith('m')) totalSeconds += Math.round(amount * 60);
                else totalSeconds += Math.round(amount);
            }

            match = unitRegex.exec(text);
        }

        if (totalSeconds > 0) return totalSeconds;

        const fallbackMatch = text.match(/\b(?:in|for|after)\s+(\d{1,5})\b/i);
        if (fallbackMatch) {
            const fallbackSeconds = Number(fallbackMatch[1]);
            return Number.isFinite(fallbackSeconds) && fallbackSeconds > 0 ? fallbackSeconds : 0;
        }

        return 0;
    };

    const buildTimerLabel = (text, isReminder) => {
        let label = normalizeWhitespace(text);
        label = label.replace(/\bset\s+(a\s+)?(timer|reminder)\b/gi, ' ');
        label = label.replace(/\bstart\s+(a\s+)?(timer|countdown)\b/gi, ' ');
        label = label.replace(/\bcreate\s+(a\s+)?(timer|reminder)\b/gi, ' ');
        label = label.replace(/\bremind(?:er)?(?:\s+me)?(?:\s+to)?\b/gi, ' ');
        label = label.replace(/\bcountdown\b/gi, ' ');
        label = label.replace(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/gi, ' ');
        label = label.replace(/\b(in|for|after|about|please|me|to)\b/gi, ' ');
        label = normalizeWhitespace(label).replace(/^[:\-\s]+|[:\-\s]+$/g, '');

        if (!label) return isReminder ? 'Reminder' : 'Timer';
        if (label.length > 80) return `${label.slice(0, 77)}...`;
        return label;
    };

    const parseTimerCommand = (text) => {
        const normalized = normalizeWhitespace(text);
        if (!normalized) return null;

        const hasReminderKeyword = /\b(remind|reminder)\b/i.test(normalized);
        const hasTimerKeyword = /\b(timer|countdown)\b/i.test(normalized);
        if (!hasReminderKeyword && !hasTimerKeyword) return null;

        const durationSecondsRaw = parseDurationSeconds(normalized);
        const durationSeconds = Math.max(
            1,
            Math.min(
                durationSecondsRaw || app.config.WIDGET_TIMER_DEFAULT_SECONDS,
                app.config.WIDGET_TIMER_MAX_SECONDS
            )
        );

        return {
            kind: 'timer',
            subtype: hasReminderKeyword ? 'reminder' : 'timer',
            durationSeconds,
            label: buildTimerLabel(normalized, hasReminderKeyword),
            rawText: normalized
        };
    };

    const parseNoteCommand = (text) => {
        const normalized = normalizeWhitespace(text);
        if (!normalized) return null;

        const notePatterns = [
            /^note\s*:\s*(.+)$/i,
            /^(?:create|add|make|new)\s+(?:a\s+)?note\b\s*[:\-]?\s*(.*)$/i,
            /^note\b\s+(.+)$/i,
            /^(?:take|save)\s+(?:a\s+)?note\b\s*[:\-]?\s*(.*)$/i
        ];

        for (let i = 0; i < notePatterns.length; i++) {
            const match = normalized.match(notePatterns[i]);
            if (!match) continue;

            const noteText = normalizeWhitespace(match[1] || '') || 'New note';
            const clampedText = noteText.slice(0, app.config.WIDGET_NOTE_MAX_CHARS);

            return {
                kind: 'note',
                text: clampedText,
                rawText: normalized
            };
        }

        if (/\b(note|notes)\b/i.test(normalized) && /\b(create|add|make|new)\b/i.test(normalized)) {
            return {
                kind: 'note',
                text: 'New note',
                rawText: normalized
            };
        }

        return null;
    };

    const readOutputArrayText = (output) => {
        if (!Array.isArray(output)) return '';

        for (let i = 0; i < output.length; i++) {
            const item = output[i] || {};

            if (typeof item.text === 'string' && item.text.trim()) {
                return item.text.trim();
            }

            if (Array.isArray(item.content)) {
                for (let j = 0; j < item.content.length; j++) {
                    const part = item.content[j] || {};
                    if (typeof part.text === 'string' && part.text.trim()) {
                        return part.text.trim();
                    }
                    if (typeof part.output_text === 'string' && part.output_text.trim()) {
                        return part.output_text.trim();
                    }
                }
            }
        }

        return '';
    };

    const readExplanationText = (payload) => {
        if (!payload) return '';
        if (typeof payload === 'string') return payload.trim();

        const directCandidates = [
            payload.explanation,
            payload.explain,
            payload.summary,
            payload.result,
            payload.output,
            payload.output_text,
            payload.response && payload.response.output_text,
            payload.message,
            payload.answer,
            payload.text
        ];

        for (let i = 0; i < directCandidates.length; i++) {
            if (typeof directCandidates[i] === 'string' && directCandidates[i].trim()) {
                return directCandidates[i].trim();
            }
        }

        if (Array.isArray(payload.choices) && payload.choices.length > 0) {
            const choice = payload.choices[0] || {};
            if (typeof choice.text === 'string' && choice.text.trim()) return choice.text.trim();
            if (choice.message && typeof choice.message.content === 'string' && choice.message.content.trim()) {
                return choice.message.content.trim();
            }
        }

        const outputArrayText = readOutputArrayText(payload.output);
        if (outputArrayText) return outputArrayText;

        if (payload.error && typeof payload.error.message === 'string' && payload.error.message.trim()) {
            return payload.error.message.trim();
        }

        if (payload.data) {
            const nested = readExplanationText(payload.data);
            if (nested) return nested;
        }

        return '';
    };

    app.ai.getApiKey = () => explainApiKey;

    app.ai.parseLocalCommand = (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed) return null;

        const noteMatch = trimmed.match(/^note:\s*\{(.+)\}$/i);
        if (noteMatch) {
            const noteText = (noteMatch[1] || '').trim();
            if (!noteText) return null;

            return {
                type: 'note',
                kind: 'note',
                text: noteText.slice(0, app.config.WIDGET_NOTE_MAX_CHARS)
            };
        }

        const timerMatch = trimmed.match(/^timer:\s*(\d+)$/i);
        if (timerMatch) {
            const parsedSeconds = Number.parseInt(timerMatch[1], 10);
            if (!Number.isFinite(parsedSeconds) || parsedSeconds < 1) return null;

            const durationSeconds = Math.min(parsedSeconds, app.config.WIDGET_TIMER_MAX_SECONDS);

            return {
                type: 'timer',
                kind: 'timer',
                durationSeconds,
                label: `Timer ${durationSeconds}s`
            };
        }

        return null;
    };

    app.ai.setCredentials = (apiKey, endpoint) => {
        explainApiKey = (apiKey || '').trim();
        app.state.hasExplainApiKey = explainApiKey.length > 0;
        app.state.explainEndpoint = (endpoint || '').trim() || app.config.AI_DEFAULT_ENDPOINT;
    };

    app.ai.getSelectedText = () => {
        const rawText = window.getSelection ? window.getSelection().toString() : '';
        return (rawText || '').replace(/\s+/g, ' ').trim();
    };

    app.ai.explainSelection = async () => {
        const state = app.state;

        if (!state.hasExplainApiKey) {
            state.lastExplainError = 'Missing API key. Open the extension popup to add one.';
            throw new Error(state.lastExplainError);
        }

        if (state.explainInFlight) {
            state.lastExplainError = 'Please wait for the current explanation to finish.';
            throw new Error(state.lastExplainError);
        }

        const selectedText = app.ai.getSelectedText();
        if (!selectedText) {
            state.lastExplainError = 'No highlighted text found.';
            throw new Error(state.lastExplainError);
        }

        const truncatedText = selectedText.length > app.config.AI_MAX_SELECTION_CHARS
            ? selectedText.slice(0, app.config.AI_MAX_SELECTION_CHARS)
            : selectedText;

        state.lastExplainSelectionHash = hashSelection(truncatedText);
        state.explainInFlight = true;
        state.lastExplainError = '';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), app.config.AI_REQUEST_TIMEOUT_MS);
        const isResponsesEndpoint = state.explainEndpoint.indexOf('/v1/responses') !== -1;

        try {
            const response = await fetch(state.explainEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${explainApiKey}`
                },
                body: JSON.stringify(isResponsesEndpoint
                    ? {
                        model: app.config.AI_DEFAULT_MODEL,
                        input: buildResponsesInput(`Explain this selection clearly in 2-4 short sentences:\n\n${truncatedText}`)
                    }
                    : {
                        text: truncatedText,
                        mode: 'explain-selection'
                    }),
                signal: controller.signal
            });

            const contentType = (response.headers.get('content-type') || '').toLowerCase();

            if (!response.ok) {
                let details = '';
                try {
                    if (contentType.includes('application/json')) {
                        const payload = await response.json();
                        details = readExplanationText(payload) || JSON.stringify(payload);
                    } else {
                        details = await response.text();
                    }
                } catch (error) {
                    details = '';
                }

                state.lastExplainError = `Explain API request failed (${response.status}). ${details}`.trim();
                throw new Error(state.lastExplainError);
            }

            let explanation = '';
            if (contentType.includes('application/json')) {
                const payload = await response.json();
                explanation = readExplanationText(payload);
            } else {
                explanation = (await response.text()).trim();
            }

            if (!explanation) {
                state.lastExplainError = 'The API response did not include an explanation.';
                throw new Error(state.lastExplainError);
            }

            explanation = shortenForBubble(explanation, 280);

            state.lastExplainError = '';
            return explanation;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                state.lastExplainError = 'Explain request timed out. Try again.';
                throw new Error(state.lastExplainError);
            }

            if (!state.lastExplainError) {
                state.lastExplainError = (error && error.message) ? error.message : 'Explain request failed.';
            }
            throw new Error(state.lastExplainError);
        } finally {
            clearTimeout(timeoutId);
            state.explainInFlight = false;
        }
    };

    app.ai.askQuestion = async (question, source = 'typed') => {
        const state = app.state;

        if (!state.hasExplainApiKey) {
            state.lastAskError = 'Missing API key. Open the extension popup to add one.';
            throw new Error(state.lastAskError);
        }

        if (state.aiAskInFlight) {
            state.lastAskError = 'Please wait for the current question to finish.';
            throw new Error(state.lastAskError);
        }

        const normalizedQuestion = (question || '').replace(/\s+/g, ' ').trim();
        if (!normalizedQuestion) {
            state.lastAskError = 'Please enter a question first.';
            throw new Error(state.lastAskError);
        }

        const clampedQuestion = normalizedQuestion.length > app.config.AI_MAX_QUESTION_CHARS
            ? normalizedQuestion.slice(0, app.config.AI_MAX_QUESTION_CHARS)
            : normalizedQuestion;

        state.aiAskInFlight = true;
        state.lastAskError = '';

        const controller = new AbortController();
        const timeoutMs = app.config.AI_ASK_TIMEOUT_MS || app.config.AI_REQUEST_TIMEOUT_MS;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(state.explainEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${explainApiKey}`
                },
                body: JSON.stringify({
                    model: app.config.AI_DEFAULT_MODEL,
                    input: buildResponsesInput(clampedQuestion),
                    metadata: {
                        source: source || 'typed'
                    }
                }),
                signal: controller.signal
            });

            const contentType = (response.headers.get('content-type') || '').toLowerCase();

            if (!response.ok) {
                let details = '';
                try {
                    if (contentType.includes('application/json')) {
                        const payload = await response.json();
                        details = readExplanationText(payload) || JSON.stringify(payload);
                    } else {
                        details = await response.text();
                    }
                } catch (error) {
                    details = '';
                }

                state.lastAskError = `Ask request failed (${response.status}). ${details}`.trim();
                throw new Error(state.lastAskError);
            }

            let answer = '';
            if (contentType.includes('application/json')) {
                const payload = await response.json();
                answer = readExplanationText(payload);
            } else {
                answer = (await response.text()).trim();
            }

            answer = shortenForBubble(answer, 280);
            if (!answer) {
                state.lastAskError = 'The API response did not include an answer.';
                throw new Error(state.lastAskError);
            }

            state.lastAskError = '';
            return answer;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                state.lastAskError = 'Question timed out. Try again.';
                throw new Error(state.lastAskError);
            }

            if (!state.lastAskError) {
                state.lastAskError = (error && error.message) ? error.message : 'Question request failed.';
            }
            throw new Error(state.lastAskError);
        } finally {
            clearTimeout(timeoutId);
            state.aiAskInFlight = false;
        }
    };
})();
