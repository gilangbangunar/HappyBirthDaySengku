const targetDate = new Date('2025-10-01T00:00:00+07:00');
const storageKey = 'sweet-wishes';
let hasCelebrated = false;
let fireworkTriggerButton = null;
let isSakuraActive = true;
let sakuraTimer = null;
let audioContext = null;
let melodyPlaying = false;
let melodyResetTimer = null;
let melodyButton = null;
let autoMelodyAttempted = false;
let melodyUnlockHandlerAttached = false;

const MELODY_LABEL_DEFAULT = 'Putar Melodi Manis';
const MELODY_LABEL_PLAYING = 'Melodi Sedang Diputar...';
const MELODY_LABEL_REPLAY = 'Putar Lagi Melodinya';
const MELODY_LABEL_ENABLE = 'Klik untuk Putar Melodi';

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

document.addEventListener('DOMContentLoaded', () => {
    fireworkTriggerButton = qs('[data-firework-trigger]');
    melodyButton = qs('[data-play-melody]');

    initSmoothScroll();
    initCountdown();
    initTimeline();
    initCarousel();
    initWishForm();
    initMoodSwitch();
    initCelebrationPreview();
    initSakuraToggle();
    initMelodyButton();
    initSparkles();

    // Autoplay sakura and attempt to start the melody
    const layer = qs('[data-sakura-layer]');
    if (isSakuraActive && layer) {
        startSakura(layer);
    }

    setTimeout(() => {
        attemptAutoMelody().then(success => {
            if (!success) {
                attachMelodyUnlockHandlers();
            }
        });
    }, 600);

    // Fallback unlock handlers in case autoplay is blocked
    attachMelodyUnlockHandlers();
});

function initSmoothScroll() {
[... script continues ...]
