// --- INLINE SVG CHARACTER ASSETS ---
const encodeSVG = (svgString) => `data:image/svg+xml,${encodeURIComponent(svgString)}`;

const stickFigureAssets = {
    idle: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="12" r="6"/><path d="M25,18 v14 M25,22 l-8,6 M25,22 l8,6 M25,32 l-8,14 M25,32 l8,14"/></svg>`),
    run1: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="27" cy="11" r="6"/><path d="M25,17 v14 M25,21 l8,2 M25,21 l-8,8 M25,31 l8,10 M25,31 l-10,0"/></svg>`),
    run2: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="27" cy="12" r="6"/><path d="M25,18 v14 M25,22 l-8,2 M25,22 l8,8 M25,32 l-8,10 M25,32 l10,0"/></svg>`),
    jump: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="10" r="6"/><path d="M25,16 v14 M25,20 l-10,-6 M25,20 l10,-6 M25,30 l-8,-4 M25,30 l8,-4"/></svg>`),
    fall: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="15" r="6"/><path d="M25,21 v14 M25,25 l-10,-10 M25,25 l10,-10 M25,35 l-6,12 M25,35 l6,12"/></svg>`),
    sit: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="20" cy="20" r="6"/><path d="M20,26 v12 M20,38 l14,0 M20,38 l8,-6 l6,6 M20,30 l-6,8 M20,30 l8,8"/></svg>`),
    wallSlide: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="20" cy="15" r="6"/><path d="M20,21 v12 M20,24 l20,-10 M20,24 l20,6 M20,33 l20,0 M20,33 l20,10"/></svg>`),
    eat: encodeSVG(`<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"><circle cx="25" cy="18" r="14" fill="white"/><ellipse cx="25" cy="22" rx="6" ry="8" fill="black"/><path d="M25,32 v8 M25,34 l-12,-12 M25,34 l12,-12 M25,40 l-8,10 M25,40 l8,10"/></svg>`)
};

// 1. Inject the character into the page
const ball = document.createElement('div');
ball.id = 'screen-pet-ball';
ball.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
ball.style.position = 'fixed';
ball.style.width = '80px';
ball.style.height = '80px';
ball.style.borderRadius = '10px'; 
ball.style.zIndex = '2147483647';
ball.style.cursor = 'grab';
ball.style.userSelect = 'none';

// Image styling properties
ball.style.backgroundImage = `url("${stickFigureAssets.idle}")`;
ball.style.backgroundSize = 'contain';
ball.style.backgroundRepeat = 'no-repeat';
ball.style.backgroundPosition = 'center';

document.body.appendChild(ball);

// --- SPEECH BUBBLE ---
const speechBubble = document.createElement('div');
speechBubble.id = 'screen-pet-speech';
speechBubble.style.position = 'fixed';
speechBubble.style.backgroundColor = 'white';
speechBubble.style.color = 'black';
speechBubble.style.border = '2px solid black';
speechBubble.style.borderRadius = '15px';
speechBubble.style.padding = '8px 12px';
speechBubble.style.fontWeight = 'bold';
speechBubble.style.fontFamily = 'Comic Sans MS, sans-serif'; // Comic style
speechBubble.style.fontSize = '14px';
speechBubble.style.zIndex = '2147483648'; // Above character
speechBubble.style.pointerEvents = 'none';
speechBubble.style.display = 'none';
speechBubble.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
document.body.appendChild(speechBubble);

let speechTimerId = null;
function stickman_talk(text, duration = 2500) {
    speechBubble.innerText = text;
    speechBubble.style.display = 'block';
    
    if (speechTimerId) clearTimeout(speechTimerId);
    
    speechTimerId = setTimeout(() => {
        speechBubble.style.display = 'none';
    }, duration);
}

// --- MULTIPLE PERSONALITIES UI ---
const modeButton = document.createElement('button');
modeButton.style.position = 'fixed';
modeButton.style.top = '10px';
modeButton.style.left = '10px';
modeButton.style.padding = '10px 15px';
modeButton.style.color = 'white';
modeButton.style.border = 'none';
modeButton.style.borderRadius = '5px';
modeButton.style.fontWeight = 'bold';
modeButton.style.cursor = 'pointer';
modeButton.style.zIndex = '2147483647';
document.body.appendChild(modeButton);

// Personality State Variables
const availableModes = ['manual', 'normal', 'chaos', 'mouse_chase', 'study'];
let currentMode = 'manual';
let autoDirection = 1; 
let globalTargetElement = null;
let reachedTarget = false;
let normalTargetAction = 'eat'; // Options: 'sit', 'throw', or 'eat'

function updateModeUI() {
    let displayText = currentMode.replace('_', ' ').toUpperCase();
    modeButton.innerText = `Mode: ${displayText}`;
    
    if (currentMode === 'manual') modeButton.style.backgroundColor = '#f44336'; 
    else if (currentMode === 'normal') modeButton.style.backgroundColor = '#4CAF50'; 
    else if (currentMode === 'chaos') modeButton.style.backgroundColor = '#9C27B0'; 
    else if (currentMode === 'mouse_chase') modeButton.style.backgroundColor = '#FF9800'; 
    else if (currentMode === 'study') modeButton.style.backgroundColor = '#2196F3'; // Blue
}

updateModeUI();

modeButton.onclick = () => {
    let nextIndex = (availableModes.indexOf(currentMode) + 1) % availableModes.length;
    currentMode = availableModes[nextIndex];
    updateModeUI();

    isLeftPressed = false;
    isRightPressed = false;

    // Drop mouse chase if toggled away while forcing a grab
    if (isForcedDragging) {
        isForcedDragging = false;
        isDragging = false;
        ball.style.cursor = 'grab';
        catchCooldown = 60;
    }

    // Reset physics elements if entering study mode to clear any active tilting
    if (currentMode === 'study') {
        const textElements = document.querySelectorAll('p, h1, h2, h3');
        textElements.forEach(el => {
            if (el.dataset.physicsType === 'tilt') el.style.transform = 'rotate(0deg)';
            else if (el.dataset.physicsType === 'dip') el.querySelectorAll('span').forEach(s => s.style.transform = 'translateY(0px)');
        });
        currentTiltAngle = 0;
    }

    if (globalTargetElement) {
        const pType = globalTargetElement.dataset.physicsType;
        if (pType === 'tilt') {
            globalTargetElement.style.outline = '2px solid rgba(255, 0, 0, 0.5)';
            globalTargetElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        } else {
            globalTargetElement.style.outline = '2px solid rgba(0, 0, 255, 0.5)';
            globalTargetElement.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        }
        globalTargetElement = null;
    }

    if (currentMode === 'normal') {
        const textElements = document.querySelectorAll('p:not([data-thrown="true"]), h1:not([data-thrown="true"]), h2:not([data-thrown="true"]), h3:not([data-thrown="true"])');
        if (textElements.length > 0) {
            const randomIndex = Math.floor(Math.random() * textElements.length);
            globalTargetElement = textElements[randomIndex];
            globalTargetElement.style.outline = '3px solid lime';
            globalTargetElement.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
        }
        reachedTarget = false;
    }
};

// --- TELEMETRY DEBUG OVERLAY ---
const debugOverlay = document.createElement('div');
debugOverlay.id = 'screen-pet-debug';
debugOverlay.style.position = 'fixed';
debugOverlay.style.top = '10px';
debugOverlay.style.right = '10px';
debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
debugOverlay.style.color = '#00ff00';
debugOverlay.style.padding = '10px';
debugOverlay.style.fontFamily = 'monospace';
debugOverlay.style.fontSize = '14px';
debugOverlay.style.zIndex = '2147483647';
debugOverlay.style.pointerEvents = 'none'; 
document.body.appendChild(debugOverlay);

// --- DEBUG BOUNDING BOXES & PHYSICS TYPES ---
const SHOW_BOUNDING_BOXES = true; 

if (SHOW_BOUNDING_BOXES) {
    const textElements = document.querySelectorAll('p, h1, h2, h3');
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
}

// 2. State variables
let isDragging = false;
let offsetX, offsetY;
let posX = 100;
let posY = 100;
let velocityX = 0; 
let velocityY = 0; 
const ballSize = 80;

// --- TOSS & MOUSE CHASE TRACKING ---
let lastPosX = 100;
let lastPosY = 100;
let dragVelocityX = 0;
let dragVelocityY = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let isForcedDragging = false;
let catchCooldown = 0;

// --- ANIMATION & MECHANIC TRACKING ---
let frameCount = 0;
let facingRight = true;
let jumpCount = 0;
const maxJumps = 2;
let isWallSliding = false;
let wallSlideSide = null;
let isEating = false;
let eatTimer = 0;

// Study Mode Trackers
let studyState = 'sitting'; // 'sitting' or 'wandering'
let studyTimer = 60;

// Tuned Physics constants
const gravity = 0.2; 
const friction = 0.92; 
const bounce = -0.4; 
const acceleration = 0.2; 
const maxSpeed = 3; 

let isLeftPressed = false;
let isRightPressed = false;

let currentActiveElement = null;
let currentTiltAngle = 0; 

// --- HELPER FUNCTION: Reset active elements ---
function resetActiveElement() {
    if (currentActiveElement) {
        if (currentMode !== 'study') {
            if (currentActiveElement.dataset.physicsType === 'tilt') {
                currentActiveElement.style.transform = 'translateY(0px) rotate(0deg)';
            } else {
                const spans = currentActiveElement.querySelectorAll('span');
                spans.forEach(s => s.style.transform = 'translateY(0px)');
            }
        }
        currentActiveElement = null;
        currentTiltAngle = 0;
    }
}

// --- MOVEMENT FUNCTIONS ---
function jump() {
    if (jumpCount < maxJumps) {
        velocityY = -10; 
        jumpCount++;
        resetActiveElement();
        
        if (isWallSliding) {
            if (wallSlideSide === 'left') velocityX = 6; 
            else if (wallSlideSide === 'right') velocityX = -6; 
            isWallSliding = false;
        }
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (e) => {
    if (currentMode !== 'manual') return;
    if (e.code === 'ArrowUp') { 
        e.preventDefault(); 
        jump();
    }
    if (e.code === 'ArrowLeft') isLeftPressed = true;
    if (e.code === 'ArrowRight') isRightPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (currentMode !== 'manual') return;
    if (e.code === 'ArrowLeft') isLeftPressed = false;
    if (e.code === 'ArrowRight') isRightPressed = false;
});

// Global mousedown catcher to drop forced grabs
document.addEventListener('mousedown', (e) => {
    if (isForcedDragging && e.target !== ball) {
        isForcedDragging = false;
        isDragging = false;
        ball.style.cursor = 'grab';
        velocityX = dragVelocityX;
        velocityY = dragVelocityY;
        catchCooldown = 60; // Wait 1 second before being able to catch the cursor again
    }
});

ball.addEventListener('mousedown', (e) => {
    // If it caught the mouse automatically, click to drop it!
    if (isForcedDragging) {
        isForcedDragging = false;
        isDragging = false;
        ball.style.cursor = 'grab';
        velocityX = dragVelocityX;
        velocityY = dragVelocityY;
        catchCooldown = 60; 
        return;
    }

    isDragging = true;
    ball.style.cursor = 'grabbing';
    offsetX = e.clientX - ball.getBoundingClientRect().left;
    offsetY = e.clientY - ball.getBoundingClientRect().top;
    velocityX = 0;
    velocityY = 0; 
    
    lastPosX = posX;
    lastPosY = posY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    jumpCount = 0; 
    
    resetActiveElement();
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!isDragging) return;
    
    // Calculate forced drag identically to standard drag since offsetX/Y center it on catch
    posX = mouseX - offsetX;
    posY = mouseY - offsetY;
    ball.style.left = `${posX}px`;
    ball.style.top = `${posY}px`;
});

document.addEventListener('mouseup', () => {
    // Standard drags are dropped on mouseup
    if (isDragging && !isForcedDragging) {
        isDragging = false;
        ball.style.cursor = 'grab';
        velocityX = dragVelocityX;
        velocityY = dragVelocityY;
    }
});

// --- THROW MECHANIC ---
function throwElement(el) {
    if (!el) return;
    el.dataset.thrown = 'true'; // Mark as thrown so AI and physics ignore it
    
    const rect = el.getBoundingClientRect();
    
    // Move to body to escape any parent CSS transforms that break position:fixed
    document.body.appendChild(el);
    
    // Detach from document flow and clear existing transitions so it doesn't glide into place
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.position = 'fixed';
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.margin = '0';
    el.style.zIndex = '2147483646'; // Just under the stick figure
    
    // Force CSS reflow so the fixed position registers before the animation starts
    void el.offsetWidth;
    
    // Throw off the right side of the screen with a spin
    el.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
    el.style.left = (window.innerWidth + 200) + 'px';
    el.style.top = (rect.top - 200) + 'px';
    el.style.transform = 'rotate(720deg)';
    
    // Remove from the page entirely when animation finishes
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
}

// --- EAT MECHANIC ---
function eatElement(el) {
    if (!el) return;
    el.dataset.thrown = 'true'; // Mark as thrown so AI and physics ignore it
    
    const rect = el.getBoundingClientRect();
    
    // Move to body to escape any parent CSS transforms that break position:fixed
    document.body.appendChild(el);
    
    // Detach from document flow and clear existing transitions
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.position = 'fixed';
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.margin = '0';
    el.style.zIndex = '2147483646'; 
    
    // Force CSS reflow
    void el.offsetWidth;
    
    // Toss vertically and shrink rapidly into the mouth
    el.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    el.style.top = (rect.top - 150) + 'px';
    el.style.transform = 'scale(0.1) rotate(360deg)';
    el.style.opacity = '0';
    
    // Remove from the page entirely when animation finishes
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 600);
}

// --- THE BRAINS REGISTRY ---
const Brains = {
    manual: () => {},
    
    normal: () => {
        // Find a new target if we don't have one (e.g., after throwing the last one)
        if (!globalTargetElement) {
            const textElements = document.querySelectorAll('p:not([data-thrown="true"]), h1:not([data-thrown="true"]), h2:not([data-thrown="true"]), h3:not([data-thrown="true"])');
            if (textElements.length > 0) {
                const randomIndex = Math.floor(Math.random() * textElements.length);
                globalTargetElement = textElements[randomIndex];
                globalTargetElement.style.outline = '3px solid lime';
                globalTargetElement.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
                reachedTarget = false;
            }
        }

        if (globalTargetElement && !reachedTarget) {
            if (currentActiveElement === globalTargetElement) {
                // We arrived at the target block! Trigger chosen action.
                if (normalTargetAction === 'sit') {
                    reachedTarget = true;
                    isLeftPressed = false;
                    isRightPressed = false;
                } else if (normalTargetAction === 'throw') {
                    throwElement(globalTargetElement);
                    globalTargetElement = null; // Clear target so AI finds a new one next frame
                    resetActiveElement(); // Force stick figure to fall since platform is gone
                    jump(); // Do a celebratory hop
                } else if (normalTargetAction === 'eat') {
                    eatElement(globalTargetElement);
                    globalTargetElement = null; 
                    resetActiveElement(); 
                    isEating = true;
                    eatTimer = 45; // 45 frames of eating animation
                    velocityX = 0; // stop to eat
                }
            } else {
                const targetRect = globalTargetElement.getBoundingClientRect();
                const targetCenterX = targetRect.left + (targetRect.width / 2);
                const myCenterX = posX + (ballSize / 2);
                const myBottomY = posY + ballSize;

                isLeftPressed = false;
                isRightPressed = false;

                const isUnderTarget = (targetRect.top < posY) && Math.abs(myCenterX - targetCenterX) < (targetRect.width / 2 + 20);
                const distanceY = posY - targetRect.bottom;

                if (targetRect.top > myBottomY && currentActiveElement && currentActiveElement !== globalTargetElement) {
                    const currentRect = currentActiveElement.getBoundingClientRect();
                    const distToLeftEdge = myCenterX - currentRect.left;
                    const distToRightEdge = currentRect.right - myCenterX;
                    
                    if (distToLeftEdge < distToRightEdge) isLeftPressed = true;
                    else isRightPressed = true;
                } else if (isUnderTarget && distanceY > 120) {
                     if (myCenterX < window.innerWidth / 2) isLeftPressed = true;
                     else isRightPressed = true;
                     
                     if (isWallSliding) jump(); 
                } else {
                    if (myCenterX < targetCenterX - 30) isRightPressed = true;
                    else if (myCenterX > targetCenterX + 30) isLeftPressed = true;

                    const isStuck = Math.abs(velocityX) < 0.5 && (isLeftPressed || isRightPressed);

                    if (Math.abs(velocityY) < 1.5 || currentActiveElement || isWallSliding) {
                        if (isStuck || (isUnderTarget && Math.random() < 0.1) || (targetRect.top < posY && Math.random() < 0.02) || isWallSliding) {
                            jump();
                        }
                    }
                }
            }
        }
    },
    
    chaos: () => {
        isLeftPressed = false;
        isRightPressed = false;

        if (frameCount % 60 === 0 && Math.random() > 0.5) {
            autoDirection *= -1; 
        }

        if (autoDirection === 1) isRightPressed = true;
        else if (autoDirection === -1) isLeftPressed = true;

        if (Math.abs(velocityY) < 1.5 || currentActiveElement || isWallSliding) {
            if (Math.random() < 0.03 || isWallSliding) jump();
        }
    },

    mouse_chase: () => {
        isLeftPressed = false;
        isRightPressed = false;

        const myCenterX = posX + (ballSize / 2);
        const myCenterY = posY + (ballSize / 2);
        const myBottomY = posY + ballSize;
        
        // Did we catch the mouse?!
        const dist = Math.hypot(mouseX - myCenterX, mouseY - myCenterY);
        if (dist < (ballSize / 2) + 15 && !isDragging && catchCooldown <= 0) {
            isDragging = true;
            isForcedDragging = true;
            
            // Re-center perfectly on the mouse coordinates
            offsetX = ballSize / 2;
            offsetY = ballSize / 2;
            posX = mouseX - offsetX;
            posY = mouseY - offsetY;
            
            velocityX = 0;
            velocityY = 0;
            jumpCount = 0;
            resetActiveElement();
            ball.style.cursor = 'grabbing';
            return;
        }

        // Random dialogue trigger
        if (Math.random() < 0.005) { // Roughly once every few seconds
            stickman_talk("im gonna catch ya!", 1500);
        }

        const distanceY = posY - mouseY; // Positive if mouse is above character
        const isMouseBelow = mouseY > myBottomY + 20;
        const isMouseAbove = mouseY < posY;

        // 1. Determine Horizontal Movement
        if (isMouseBelow && currentActiveElement) {
            // Mouse is below us, walk off the closest edge to drop down!
            const currentRect = currentActiveElement.getBoundingClientRect();
            const distToLeftEdge = myCenterX - currentRect.left;
            const distToRightEdge = currentRect.right - myCenterX;
            
            if (distToLeftEdge < distToRightEdge) isLeftPressed = true;
            else isRightPressed = true;
        } else if (isMouseAbove && distanceY > 470) {
            // Mouse is way above us, seek the nearest wall to climb up
            if (myCenterX < window.innerWidth / 2) isLeftPressed = true;
            else isRightPressed = true;
        } else {
            // Navigate towards the mouse horizontally (widened deadzone to 20px)
            if (myCenterX < mouseX - 20) isRightPressed = true;
            else if (myCenterX > mouseX + 20) isLeftPressed = true;
        }

        // 2. Determine Jumping Logic
        const isStuck = Math.abs(velocityX) < 0.5 && (isLeftPressed || isRightPressed);
        const isCharacterUnderMouse = isMouseAbove && Math.abs(myCenterX - mouseX) < 100;

        if (Math.abs(velocityY) < 1.5 || currentActiveElement || isWallSliding) {
            // Climbing the wall if the mouse is far above
            if (isMouseAbove && distanceY > 470 && isWallSliding) {
                jump();
            } 
            // Normal behavior (prevent jumping if mouse is below us)
            else if (!isMouseBelow) {
                if (isStuck || (isCharacterUnderMouse && Math.random() < 0.1) || (isMouseAbove && Math.random() < 0.02) || isWallSliding) {
                    jump();
                }
            } 
            // If mouse is below us but we are stuck on something, give a tiny chance to jump and free ourselves
            else if (isStuck) {
                if (Math.random() < 0.05) jump();
            }
        }
    },

    study: () => {
        isLeftPressed = false;
        isRightPressed = false;

        if (studyTimer > 0) studyTimer--;

        if (studyTimer <= 0) {
            // Switch state
            if (studyState === 'sitting') {
                studyState = 'wandering';
                studyTimer = 60 + Math.random() * 120; // Wander for 1-3 seconds
                autoDirection = Math.random() > 0.5 ? 1 : -1;
            } else {
                studyState = 'sitting';
                studyTimer = 180 + Math.random() * 300; // Sit for 3-8 seconds
            }
        }

        if (studyState === 'wandering') {
            if (autoDirection === 1) isRightPressed = true;
            else isLeftPressed = true;

            // Jump rarely or if stuck against a wall/element
            const isStuck = Math.abs(velocityX) < 0.2 && (isLeftPressed || isRightPressed);
            if (Math.abs(velocityY) < 1.5 || currentActiveElement) {
                if (isStuck && Math.random() < 0.1) jump();
            }
        } else {
            // If sitting, rapidly decelerate
            velocityX *= 0.5;
        }
    }
};

// 4. Auto-movement, Gravity, & Collision Logic
function animateBall() {
    let currentSlantedYDisplay = "N/A"; 
    frameCount++;
    if (catchCooldown > 0) catchCooldown--;
    if (eatTimer > 0) {
        eatTimer--;
        if (eatTimer <= 0) isEating = false;
    }

    if (!isDragging) {
        
        if (Brains[currentMode]) {
            Brains[currentMode]();
        }
        
        // --- APPLY PLAYER ACCELERATION ---
        let currentMaxSpeed = maxSpeed;
        let currentAcceleration = acceleration;
        
        // Slow down movement for Study mode
        if (currentMode === 'study') {
            currentMaxSpeed = 1; 
            currentAcceleration = 0.05;
        }
        
        if (isLeftPressed) velocityX -= currentAcceleration;
        if (isRightPressed) velocityX += currentAcceleration;
        
        if (velocityX > currentMaxSpeed) velocityX = currentMaxSpeed;
        if (velocityX < -currentMaxSpeed) velocityX = -currentMaxSpeed;

        velocityY += gravity; 
        posX += velocityX;
        posY += velocityY;

        // --- WINDOW COLLISIONS & WALL SLIDING ---
        isWallSliding = false;
        wallSlideSide = null;

        if (posX <= 0) {
            posX = 0;
            if (velocityY > 0 && isLeftPressed) {
                isWallSliding = true;
                wallSlideSide = 'left';
                velocityX = 0;
            } else {
                if (currentMode !== 'manual') autoDirection = 1; 
                velocityX *= -0.8; 
            }
        } else if (posX + ballSize >= window.innerWidth) {
            posX = window.innerWidth - ballSize;
            if (velocityY > 0 && isRightPressed) {
                isWallSliding = true;
                wallSlideSide = 'right';
                velocityX = 0;
            } else {
                if (currentMode !== 'manual') autoDirection = -1; 
                velocityX *= -0.8; 
            }
        }

        if (isWallSliding) {
            if (velocityY > 2) velocityY = 2; 
            jumpCount = 0; 
        }
        
        if (posY + ballSize >= window.innerHeight) {
            posY = window.innerHeight - ballSize;
            velocityY *= bounce; 
            if (!isLeftPressed && !isRightPressed) velocityX *= friction; 
            if (Math.abs(velocityY) < 1) velocityY = 0;
            resetActiveElement();
            jumpCount = 0; 
        }

        // --- TEXT COLLISIONS ---
        const textElements = document.querySelectorAll('p:not([data-thrown="true"]), h1:not([data-thrown="true"]), h2:not([data-thrown="true"]), h3:not([data-thrown="true"])');
        let isTouchingAnyElement = false;
        const ballCenterX = posX + (ballSize / 2);
        
        for (let el of textElements) {
            const rect = el.getBoundingClientRect();
            const isCurrent = (el === currentActiveElement);
            const physicsType = el.dataset.physicsType;
            
            const elementCenterX = rect.left + (rect.width / 2);
            let elementTopY = rect.top;
            let slantedY;
            let angleRad = 0;

            // Study mode ignores visual/physics deformations and treats boxes as solid flat ground
            if (currentMode === 'study') {
                slantedY = elementTopY;
            } else if (physicsType === 'tilt') {
                const angleToUse = isCurrent ? currentTiltAngle : 0;
                angleRad = angleToUse * (Math.PI / 180);
                slantedY = elementTopY + Math.tan(angleRad) * (ballCenterX - elementCenterX) * 2;
            } else if (physicsType === 'dip') {
                const currentDip = isCurrent ? 15 : 0;
                slantedY = elementTopY + currentDip;
            }
            
            if (isCurrent) currentSlantedYDisplay = slantedY.toFixed(2);
            
            const lookUp = isCurrent ? 50 : 0;
            const lookDown = isCurrent ? 50 : 0;
            
            if (
                velocityY >= -2 && 
                posY + ballSize >= slantedY - lookUp && 
                posY + ballSize <= slantedY + 30 + lookDown && 
                posX + ballSize > rect.left && 
                posX < rect.right 
            ) {
                isTouchingAnyElement = true;
                currentActiveElement = el;
                currentSlantedYDisplay = slantedY.toFixed(2); 
                jumpCount = 0; 
                
                posY = slantedY - ballSize;
                
                if (!isCurrent) velocityY *= bounce; 
                else velocityY = 0; 
                
                if (!isLeftPressed && !isRightPressed) velocityX *= friction; 
                
                // Only apply visual deformations if not in study mode
                if (currentMode !== 'study') {
                    if (physicsType === 'tilt') {
                        const distanceOffCenter = ballCenterX - elementCenterX;
                        let newTiltAngle = distanceOffCenter / (rect.width / 15); 
                        newTiltAngle = Math.max(-15, Math.min(15, newTiltAngle)); 
                        currentTiltAngle = newTiltAngle;
                        el.style.transform = `rotate(${currentTiltAngle}deg)`;
                        velocityX += Math.sin(angleRad) * 1.5;
                    } else if (physicsType === 'dip') {
                        const spans = el.querySelectorAll('span');
                        spans.forEach(span => {
                            const spanRect = span.getBoundingClientRect();
                            const spanCenterX = spanRect.left + (spanRect.width / 2);
                            const dist = Math.abs(ballCenterX - spanCenterX);
                            
                            if (dist < 60) {
                                const currentDip = 15 * (1 - dist / 60);
                                span.style.transform = `translateY(${currentDip}px)`;
                            } else {
                                span.style.transform = `translateY(0px)`;
                            }
                        });
                    }
                }

                break; 
            }
        }
        
        // --- ANIMATION STATE MANAGER ---
        if (velocityX > 0.5) facingRight = true;
        if (velocityX < -0.5) facingRight = false;
        
        let currentSvg = stickFigureAssets.idle;
        
        if (isEating) {
            currentSvg = stickFigureAssets.eat;
        } else if (isWallSliding) {
            currentSvg = stickFigureAssets.wallSlide;
            facingRight = (wallSlideSide === 'right'); 
        } else if ((currentMode === 'normal' && reachedTarget && normalTargetAction === 'sit') || (currentMode === 'study' && studyState === 'sitting' && isTouchingAnyElement)) {
            currentSvg = stickFigureAssets.sit;
        } else if (!isTouchingAnyElement && velocityY < -1) {
            currentSvg = stickFigureAssets.jump;
        } else if (!isTouchingAnyElement && velocityY > 1) {
            currentSvg = stickFigureAssets.fall;
        } else if (Math.abs(velocityX) > 0.5) {
            // Slower running animation for study mode
            const animSpeed = currentMode === 'study' ? 24 : 16;
            currentSvg = (Math.floor(frameCount / animSpeed) % 2 === 0) ? stickFigureAssets.run1 : stickFigureAssets.run2;
        }
        
        ball.style.backgroundImage = `url("${currentSvg}")`;
        ball.style.transform = facingRight ? 'scaleX(1)' : 'scaleX(-1)';
        
        if (isTouchingAnyElement) {
            ball.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'; 
        } else {
            ball.style.backgroundColor = 'rgba(0, 0, 255, 0.2)'; 
            if (currentActiveElement && velocityY > 0) {
                resetActiveElement();
            }
        }

        ball.style.left = `${posX}px`;
        ball.style.top = `${posY}px`;
    } else {
        dragVelocityX = posX - lastPosX;
        dragVelocityY = posY - lastPosY;
        lastPosX = posX;
        lastPosY = posY;
        
        ball.style.backgroundImage = `url("${stickFigureAssets.fall}")`;
    }

    // --- UPDATE SPEECH BUBBLE POSITION ---
    if (speechBubble.style.display === 'block') {
        let bubbleX = posX + (ballSize / 2) - (speechBubble.offsetWidth / 2);
        // Keep bubble horizontally bounded within the window
        if (bubbleX < 5) bubbleX = 5;
        if (bubbleX + speechBubble.offsetWidth > window.innerWidth - 5) {
            bubbleX = window.innerWidth - speechBubble.offsetWidth - 5;
        }
        speechBubble.style.left = `${bubbleX}px`;
        speechBubble.style.top = `${posY - speechBubble.offsetHeight - 10}px`;
    }
    
    debugOverlay.innerHTML = `
        Char X: ${posX.toFixed(2)}<br>
        Char Y: ${posY.toFixed(2)}<br>
        Slanted Y: ${currentSlantedYDisplay}<br>
        Angle: ${currentTiltAngle.toFixed(2)}°<br>
        Mode: ${currentMode}<br>
        Jumps: ${jumpCount}/${maxJumps}<br>
        WallSlide: ${isWallSliding}
    `;
    
    requestAnimationFrame(animateBall);
}

// Initial Greeting!
stickman_talk("hello!", 3000);

animateBall();