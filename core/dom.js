(() => {
    const app = window.StickmanExt;

    app.dom.getAllTextElements = () => document.querySelectorAll(app.config.TEXT_ELEMENTS_SELECTOR);
    app.dom.getEligibleTextElements = () => document.querySelectorAll(app.config.ELIGIBLE_TEXT_ELEMENTS_SELECTOR);

    app.dom.highlightNormalTarget = (el) => {
        if (!el) return;
        el.style.outline = '3px solid lime';
        el.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    };

    app.dom.restorePhysicsHighlight = (el) => {
        if (!el) return;
        const pType = el.dataset.physicsType;
        if (pType === 'tilt') {
            el.style.outline = '2px solid rgba(255, 0, 0, 0.5)';
            el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        } else {
            el.style.outline = '2px solid rgba(0, 0, 255, 0.5)';
            el.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        }
    };

    app.dom.resetStudyTransforms = () => {
        const textElements = app.dom.getAllTextElements();
        textElements.forEach(el => {
            if (el.dataset.physicsType === 'tilt') el.style.transform = 'rotate(0deg)';
            else if (el.dataset.physicsType === 'dip') el.querySelectorAll('span').forEach(s => s.style.transform = 'translateY(0px)');
        });
        app.state.currentTiltAngle = 0;
    };

    app.dom.assignPhysicsTypes = () => {
        const textElements = app.dom.getAllTextElements();
        textElements.forEach(el => {
            if (Math.random() > 0.5) {
                el.dataset.physicsType = 'tilt';
                el.style.outline = '2px solid rgba(255, 0, 0, 0.5)';
                el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                el.style.transition = 'transform 0.1s ease-out';
                el.style.transformOrigin = 'top center';
            } else {
                el.dataset.physicsType = 'dip';
                el.style.outline = '2px solid rgba(0, 0, 255, 0.5)';
                el.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';

                const text = el.innerText;
                el.innerHTML = '';
                for (let char of text) {
                    const span = document.createElement('span');
                    span.innerText = char === ' ' ? '\u00A0' : char;
                    span.style.display = 'inline-block';
                    span.style.transition = 'transform 0.05s linear';
                    el.appendChild(span);
                }
            }
        });
    };

    app.dom.classifyPageType = () => {
        const host = (window.location.hostname || '').toLowerCase();
        const path = (window.location.pathname || '').toLowerCase();

        if (host.includes('docs.google.com') && path.includes('/document/')) return 'google_doc';
        if (host.includes('wikipedia.org')) return 'encyclopedia';
        if (document.querySelector('article')) return 'article';
        if (document.querySelector('form input, form textarea')) return 'form_heavy';
        if (document.querySelector('table')) return 'data_table';
        if (document.querySelector('pre, code')) return 'code_docs';
        return 'general';
    };

    app.dom.extractPageTextByType = (pageType) => {
        const normalizeText = (raw) => (raw || '').replace(/\s+/g, ' ').trim();
        const collectText = (nodes, maxChars = 6000) => {
            let combined = '';
            for (const node of nodes) {
                const text = normalizeText(node && node.innerText ? node.innerText : '');
                if (!text) continue;
                combined += `${text} `;
                if (combined.length >= maxChars) break;
            }
            return combined.slice(0, maxChars).trim();
        };

        const title = normalizeText(document.title);

        if (pageType === 'google_doc') {
            const docTitleNode = document.querySelector('.docs-title-input-label-inner, #docs-title-input-label-inner');
            const docCanvasLines = document.querySelectorAll('.kix-page .kix-lineview');
            const editorRoot = document.querySelector('.kix-appview-editor, .docs-texteventtarget-iframe');

            const docTitle = normalizeText(docTitleNode && docTitleNode.textContent ? docTitleNode.textContent : title);
            const lineText = collectText(docCanvasLines, 7000);
            const editorText = normalizeText(editorRoot && editorRoot.innerText ? editorRoot.innerText : '');
            const bestText = lineText || editorText;

            if (!bestText) {
                return {
                    text: docTitle,
                    blocked: true,
                    blockedReason: 'google-doc-content-unavailable'
                };
            }

            return {
                text: `${docTitle} ${bestText}`.trim(),
                blocked: false,
                blockedReason: ''
            };
        }

        if (pageType === 'article' || pageType === 'encyclopedia') {
            const articleNodes = document.querySelectorAll('h1, h2, h3, article p, main p, p');
            const articleText = collectText(articleNodes, 7000);
            return {
                text: `${title} ${articleText}`.trim(),
                blocked: !articleText,
                blockedReason: articleText ? '' : 'article-content-empty'
            };
        }

        if (pageType === 'form_heavy') {
            const labels = document.querySelectorAll('label, legend, h1, h2, p');
            const formText = collectText(labels, 5000);
            return {
                text: `${title} ${formText}`.trim(),
                blocked: !formText,
                blockedReason: formText ? '' : 'form-context-empty'
            };
        }

        if (pageType === 'data_table') {
            const tableNodes = document.querySelectorAll('h1, h2, th, caption, td');
            const tableText = collectText(tableNodes, 5000);
            return {
                text: `${title} ${tableText}`.trim(),
                blocked: !tableText,
                blockedReason: tableText ? '' : 'table-context-empty'
            };
        }

        if (pageType === 'code_docs') {
            const codeNodes = document.querySelectorAll('h1, h2, h3, p, pre, code');
            const codeText = collectText(codeNodes, 6500);
            return {
                text: `${title} ${codeText}`.trim(),
                blocked: !codeText,
                blockedReason: codeText ? '' : 'code-context-empty'
            };
        }

        const generalNodes = document.querySelectorAll('h1, h2, h3, p, li');
        const generalText = collectText(generalNodes, 6000);
        return {
            text: `${title} ${generalText}`.trim(),
            blocked: !generalText,
            blockedReason: generalText ? '' : 'general-context-empty'
        };
    };

    app.dom.summarizeAndKeywordize = (text) => {
        const cleanText = (text || '').replace(/\s+/g, ' ').trim();
        const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(Boolean);
        const summary = sentences.slice(0, 2).join(' ').slice(0, 320) || cleanText.slice(0, 320);

        const stopWords = {
            the: true, and: true, for: true, are: true, with: true, this: true, that: true, from: true,
            your: true, you: true, has: true, have: true, was: true, were: true, but: true, not: true,
            can: true, all: true, one: true, two: true, use: true, using: true, into: true, about: true,
            intoo: true, when: true, then: true, than: true, what: true, where: true, how: true, why: true,
            is: true, it: true, in: true, on: true, of: true, to: true, a: true, an: true, or: true, at: true,
            by: true, be: true, as: true, if: true
        };

        const counts = {};
        const words = cleanText.toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) || [];
        words.forEach(word => {
            if (stopWords[word]) return;
            counts[word] = (counts[word] || 0) + 1;
        });

        const keywords = Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 8)
            .map(([word]) => word);

        return {
            summary,
            keywords,
            sentenceCount: sentences.length,
            wordCount: words.length
        };
    };

    app.dom.buildQuestionQueue = (pageContext) => {
        if (!pageContext) return [];

        const topKeywords = (pageContext.keywords || []).slice(0, 3);
        const keywordText = topKeywords.length > 0 ? topKeywords.join(', ') : 'the main topic';

        if (pageContext.scrapeStatus === 'blocked' || pageContext.scrapeStatus === 'error') {
            return [
                'I cannot read this page well yet. Could you summarize it for me?',
                'Want me to keep exploring with what little context I can see?',
                'Can you point me to a section with visible text?'
            ];
        }

        if (pageContext.pageType === 'google_doc') {
            return [
                `This doc seems focused on ${keywordText}. Is this a draft or final version?`,
                'Which section should we tighten first?',
                'Do you want a quick checklist for editing this document?'
            ];
        }

        if (pageContext.pageType === 'encyclopedia' || pageContext.pageType === 'article') {
            return [
                `I spotted themes like ${keywordText}. Want a quick recap?`,
                'Should I quiz you with a question about this page?',
                'Do you want to compare this source with another one?'
            ];
        }

        if (pageContext.pageType === 'code_docs') {
            return [
                `Looks technical: ${keywordText}. Are you implementing or debugging?`,
                'Want me to help break this API into simple steps?',
                'Should I suggest a tiny test plan for what you are reading?'
            ];
        }

        if (pageContext.pageType === 'data_table') {
            return [
                `I am seeing table-heavy content around ${keywordText}. What metric matters most?`,
                'Want me to help spot a trend from the visible labels?',
                'Should we define one decision this data should answer?'
            ];
        }

        if (pageContext.pageType === 'form_heavy') {
            return [
                `This page looks form-heavy with terms like ${keywordText}. Is this setup or submission time?`,
                'Do you want a quick pass for required fields and constraints?',
                'Should I remind you before leaving this page in case unsaved input exists?'
            ];
        }

        return [
            `I noticed recurring terms: ${keywordText}. What are you trying to accomplish here?`,
            'Want me to keep asking short context questions while you work?',
            'Should I switch to a quieter mode and only ask when context changes?'
        ];
    };

    app.dom.refreshPageContextIfDue = () => {
        const state = app.state;
        const now = Date.now();

        if (state.pageScrapeInProgress) return state.pageContext;

        const lastScrapeMs = state.pageInsightModeState && state.pageInsightModeState.lastScrapeMs ? state.pageInsightModeState.lastScrapeMs : 0;
        if (lastScrapeMs > 0 && (now - lastScrapeMs) < state.pageScrapeIntervalMs) {
            state.pageInsightModeState.status = 'throttled';
            return state.pageContext;
        }

        state.pageScrapeInProgress = true;
        state.pageInsightModeState.status = 'scraping';
        state.pageInsightModeState.lastError = '';

        try {
            const previousType = state.pageLastType || 'unknown';
            const pageType = app.dom.classifyPageType();
            const extraction = app.dom.extractPageTextByType(pageType);
            const summaryData = app.dom.summarizeAndKeywordize(extraction.text);

            const scrapeStatus = extraction.blocked ? 'blocked' : 'ready';
            const pageContext = {
                pageType,
                title: document.title || '',
                url: window.location.href,
                summary: summaryData.summary,
                keywords: summaryData.keywords,
                sentenceCount: summaryData.sentenceCount,
                wordCount: summaryData.wordCount,
                scrapeStatus,
                blockedReason: extraction.blockedReason || '',
                capturedAtMs: now
            };

            state.pageContext = pageContext;
            state.pageLastType = pageType;
            state.pageInsightModeState.lastScrapeMs = now;
            state.pageInsightModeState.status = scrapeStatus;
            state.pageInsightModeState.lastError = extraction.blocked ? (extraction.blockedReason || 'scrape-blocked') : '';

            if (state.pageQuestionQueue.length === 0 || previousType !== pageType || scrapeStatus !== 'ready') {
                state.pageQuestionQueue = app.dom.buildQuestionQueue(pageContext);
            }

            return pageContext;
        } catch (err) {
            state.pageInsightModeState.lastScrapeMs = now;
            state.pageInsightModeState.status = 'error';
            state.pageInsightModeState.lastError = err && err.message ? err.message : 'unknown-error';

            const fallbackContext = {
                pageType: state.pageLastType || 'unknown',
                title: document.title || '',
                url: window.location.href,
                summary: 'Could not safely read this page context.',
                keywords: [],
                sentenceCount: 0,
                wordCount: 0,
                scrapeStatus: 'error',
                blockedReason: state.pageInsightModeState.lastError,
                capturedAtMs: now
            };
            state.pageContext = fallbackContext;

            if (state.pageQuestionQueue.length === 0) {
                state.pageQuestionQueue = app.dom.buildQuestionQueue(fallbackContext);
            }

            return fallbackContext;
        } finally {
            state.pageScrapeInProgress = false;
        }
    };

    const nextWidgetId = (prefix) => {
        app.state.widgetIdCounter++;
        return `${prefix}-${app.state.widgetIdCounter}`;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const formatDuration = (totalSeconds) => {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const seconds = safeSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    app.dom.ensureZapLayer = () => {
        if (app.refs.zapLayer && document.body.contains(app.refs.zapLayer)) return app.refs.zapLayer;

        const layer = document.createElement('div');
        layer.id = 'screen-pet-zap-layer';
        layer.className = 'screen-pet-zap-layer';
        layer.style.zIndex = String(app.config.WIDGET_Z_INDEX_BASE + 2);
        layer.style.display = 'none';
        document.body.appendChild(layer);
        app.refs.zapLayer = layer;
        return layer;
    };

    app.dom.emitZapToElement = (targetEl) => {
        if (!targetEl || !app.refs.ball) return;

        const ballRect = app.refs.ball.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const effect = {
            id: nextWidgetId('zap'),
            startX: ballRect.left + (ballRect.width / 2),
            startY: ballRect.top + (ballRect.height / 2),
            endX: targetRect.left + (targetRect.width / 2),
            endY: targetRect.top + (targetRect.height / 2),
            createdAtMs: Date.now(),
            durationMs: app.config.WIDGET_ZAP_DURATION_MS
        };

        app.state.zapEffectsQueue.push(effect);
        if (app.state.zapEffectsQueue.length > app.config.WIDGET_MAX_ZAPS) {
            app.state.zapEffectsQueue.shift();
        }

        app.dom.ensureZapLayer();
    };

    app.dom.ensureTimerPanel = () => {
        if (app.refs.timerPanel && document.body.contains(app.refs.timerPanel)) {
            app.state.timerPanelVisible = true;
            app.refs.timerPanel.style.display = 'block';
            return app.refs.timerPanel;
        }

        const panel = document.createElement('div');
        panel.id = 'screen-pet-timer-panel';
        panel.className = 'screen-pet-timer-panel';
        panel.style.zIndex = String(app.config.WIDGET_Z_INDEX_BASE + 1);

        const title = document.createElement('div');
        title.className = 'screen-pet-timer-title';
        title.textContent = 'Timers';

        const list = document.createElement('div');
        list.className = 'screen-pet-timer-list';

        panel.appendChild(title);
        panel.appendChild(list);
        document.body.appendChild(panel);

        app.refs.timerPanel = panel;
        app.refs.timerList = list;
        app.state.timerPanelVisible = true;
        return panel;
    };

    app.dom.updateTimerRow = (timer) => {
        if (!timer || !timer.timeEl) return;
        const secondsRemaining = Math.max(0, Math.ceil((timer.endAtMs - Date.now()) / 1000));
        timer.timeEl.textContent = formatDuration(secondsRemaining);
    };

    app.dom.removeTimerWidget = (timerId) => {
        const state = app.state;
        const index = state.widgetTimers.findIndex((timer) => timer.id === timerId);
        if (index === -1) return;

        const timer = state.widgetTimers[index];
        if (timer.rowEl && timer.rowEl.parentNode) {
            timer.rowEl.parentNode.removeChild(timer.rowEl);
        }

        state.widgetTimers.splice(index, 1);

        if (state.widgetTimers.length === 0 && app.refs.timerPanel) {
            app.refs.timerPanel.style.display = 'none';
            state.timerPanelVisible = false;
        }
    };

    app.dom.processTimerTick = () => {
        const state = app.state;
        if (!Array.isArray(state.widgetTimers) || state.widgetTimers.length === 0) return;

        for (let i = state.widgetTimers.length - 1; i >= 0; i--) {
            const timer = state.widgetTimers[i];
            app.dom.updateTimerRow(timer);

            if (Date.now() >= timer.endAtMs) {
                const doneLabel = timer.label || 'Timer';
                app.dom.removeTimerWidget(timer.id);
                app.ui.talk(`${doneLabel} finished.`, 2600);
            }
        }
    };

    app.dom.createTimerWidget = (command) => {
        const state = app.state;
        const panel = app.dom.ensureTimerPanel();
        const list = app.refs.timerList;

        if (!panel || !list) return null;

        if (state.widgetTimers.length >= app.config.WIDGET_MAX_TIMERS) {
            app.dom.removeTimerWidget(state.widgetTimers[0].id);
        }

        const timerId = nextWidgetId('timer');
        const durationSeconds = Math.max(1, Math.min(command.durationSeconds || app.config.WIDGET_TIMER_DEFAULT_SECONDS, app.config.WIDGET_TIMER_MAX_SECONDS));
        const label = (command.label || 'Timer').slice(0, 80);
        const now = Date.now();

        const row = document.createElement('div');
        row.className = 'screen-pet-timer-item';
        row.dataset.widgetId = timerId;

        const textWrap = document.createElement('div');
        textWrap.className = 'screen-pet-timer-item-text';

        const labelEl = document.createElement('div');
        labelEl.className = 'screen-pet-timer-item-label';
        labelEl.textContent = label;

        const timeEl = document.createElement('div');
        timeEl.className = 'screen-pet-timer-item-time';
        timeEl.textContent = formatDuration(durationSeconds);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'screen-pet-timer-remove';
        removeBtn.type = 'button';
        removeBtn.textContent = 'x';
        removeBtn.onclick = () => app.dom.removeTimerWidget(timerId);

        textWrap.appendChild(labelEl);
        textWrap.appendChild(timeEl);
        row.appendChild(textWrap);
        row.appendChild(removeBtn);
        list.appendChild(row);

        const timer = {
            id: timerId,
            label,
            durationSeconds,
            endAtMs: now + (durationSeconds * 1000),
            rowEl: row,
            timeEl
        };

        state.widgetTimers.push(timer);
        state.timerPanelVisible = true;
        panel.style.display = 'block';

        if (!state.widgetTimerTickIntervalId) {
            state.widgetTimerTickIntervalId = setInterval(() => {
                app.dom.processTimerTick();
            }, 1000);
        }

        return row;
    };

    app.dom.clearNoteDragState = () => {
        app.state.noteDragState.activeNoteId = null;
        app.state.noteDragState.offsetX = 0;
        app.state.noteDragState.offsetY = 0;
    };

    const bindNoteDragIfNeeded = () => {
        if (app.state.__noteDragHandlersBound) return;
        app.state.__noteDragHandlersBound = true;

        document.addEventListener('mousemove', (event) => {
            const dragState = app.state.noteDragState;
            if (!dragState.activeNoteId) return;

            const note = app.state.widgetNotes.find((entry) => entry.id === dragState.activeNoteId);
            if (!note || !note.el) {
                app.dom.clearNoteDragState();
                return;
            }

            const width = note.el.offsetWidth || 260;
            const height = note.el.offsetHeight || 140;
            const nextLeft = clamp(event.clientX - dragState.offsetX, 8, Math.max(8, window.innerWidth - width - 8));
            const nextTop = clamp(event.clientY - dragState.offsetY, 8, Math.max(8, window.innerHeight - height - 8));

            note.x = nextLeft;
            note.y = nextTop;
            note.el.style.left = `${nextLeft}px`;
            note.el.style.top = `${nextTop}px`;
        });

        document.addEventListener('mouseup', () => {
            app.dom.clearNoteDragState();
        });
    };

    app.dom.createNoteWidget = (command) => {
        const state = app.state;
        bindNoteDragIfNeeded();

        if (state.widgetNotes.length >= app.config.WIDGET_MAX_NOTES) {
            const oldest = state.widgetNotes.shift();
            if (oldest && oldest.el && oldest.el.parentNode) {
                oldest.el.parentNode.removeChild(oldest.el);
            }
        }

        const noteId = nextWidgetId('note');
        const text = (command.text || 'New note').slice(0, app.config.WIDGET_NOTE_MAX_CHARS);

        const card = document.createElement('div');
        card.className = 'screen-pet-note-card';
        card.dataset.widgetId = noteId;
        card.style.zIndex = String(app.config.WIDGET_Z_INDEX_BASE + 1);

        const header = document.createElement('div');
        header.className = 'screen-pet-note-header';

        const title = document.createElement('span');
        title.className = 'screen-pet-note-title';
        title.textContent = 'Note';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'screen-pet-note-close';
        closeBtn.type = 'button';
        closeBtn.textContent = 'x';

        const body = document.createElement('div');
        body.className = 'screen-pet-note-body';
        body.textContent = text;

        header.appendChild(title);
        header.appendChild(closeBtn);
        card.appendChild(header);
        card.appendChild(body);
        document.body.appendChild(card);

        const stackOffset = state.widgetNotes.length;
        const initialLeft = clamp(window.innerWidth - 290 - (stackOffset % 2) * 22, 8, Math.max(8, window.innerWidth - 290));
        const initialTop = clamp(155 + (stackOffset * 24), 8, Math.max(8, window.innerHeight - 160));
        card.style.left = `${initialLeft}px`;
        card.style.top = `${initialTop}px`;

        const noteEntry = {
            id: noteId,
            text,
            x: initialLeft,
            y: initialTop,
            el: card
        };
        state.widgetNotes.push(noteEntry);

        closeBtn.onclick = () => {
            const idx = state.widgetNotes.findIndex((note) => note.id === noteId);
            if (idx !== -1) state.widgetNotes.splice(idx, 1);
            if (card.parentNode) card.parentNode.removeChild(card);
            if (state.noteDragState.activeNoteId === noteId) app.dom.clearNoteDragState();
        };

        header.onmousedown = (event) => {
            if (event.button !== 0) return;

            const cardRect = card.getBoundingClientRect();
            state.noteDragState.activeNoteId = noteId;
            state.noteDragState.offsetX = event.clientX - cardRect.left;
            state.noteDragState.offsetY = event.clientY - cardRect.top;
        };

        return card;
    };
})();
