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

    setTimeout(() => {
        attemptAutoMelody().then(success => {
            if (!success) {
                attachMelodyUnlockHandlers();
            }
        });
    }, 600);

    attachMelodyUnlockHandlers();
});

function initSmoothScroll() {
    qsa('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-scroll');
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initCountdown() {
    const dayEl = qs('[data-days]');
    const hourEl = qs('[data-hours]');
    const minuteEl = qs('[data-minutes]');
    const secondEl = qs('[data-seconds]');

    const updateCountdown = () => {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            dayEl.textContent = '0';
            hourEl.textContent = '0';
            minuteEl.textContent = '0';
            secondEl.textContent = '0';
            if (!hasCelebrated) {
                launchBirthdayMoment();
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        dayEl.textContent = days;
        hourEl.textContent = hours.toString().padStart(2, '0');
        minuteEl.textContent = minutes.toString().padStart(2, '0');
        secondEl.textContent = seconds.toString().padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function initTimeline() {
    qsa('[data-moment]').forEach(card => {
        const toggleDetail = () => {
            card.classList.toggle('is-open');
        };
        card.addEventListener('click', toggleDetail);
        card.addEventListener('keypress', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDetail();
            }
        });
    });
}

function initCarousel() {
    const carousel = qs('[data-carousel]');
    if (!carousel) return;

    const track = qs('.carousel__track', carousel);
    const items = qsa('.carousel__item', track);
    const prevBtn = qs('[data-direction="prev"]', carousel);
    const nextBtn = qs('[data-direction="next"]', carousel);
    let index = 0;

    const updateCarousel = () => {
        const itemWidth = items[0].getBoundingClientRect().width;
        track.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => {
        index = index <= 0 ? items.length - 1 : index - 1;
        updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
        index = index >= items.length - 1 ? 0 : index + 1;
        updateCarousel();
    });

    let startX = 0;
    track.addEventListener('pointerdown', event => {
        startX = event.clientX;
        track.setPointerCapture(event.pointerId);
    });

    track.addEventListener('pointerup', event => {
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 40) {
            if (delta < 0) {
                nextBtn.click();
            } else {
                prevBtn.click();
            }
        }
        track.releasePointerCapture(event.pointerId);
    });

    window.addEventListener('resize', updateCarousel);
}

function initWishForm() {
    const form = qs('[data-wish-form]');
    const jar = qs('[data-wish-jar]');
    const template = qs('#wish-template');
    const emptyMessage = qs('[data-empty-message]', jar);

    if (!form || !jar || !template) return;

    const renderWish = entry => {
        const clone = template.content.cloneNode(true);
        qs('[data-field="wish"]', clone).textContent = entry.wish;
        qs('[data-field="plan"]', clone).textContent = `Kita lakukan: ${entry.plan || '-'}`;
        qs('[data-field="song"]', clone).textContent = entry.song ? `Lagu favoritmu: ${entry.song}` : 'Belum ada lagu, tinggal pilih ya <3';
        qs('[data-field="sweetness"]', clone).textContent = `Skala kemanisan hari ini: ${entry.sweetness}/5`;
        qs('[data-field="time"]', clone).textContent = `Ditulis pada ${entry.timestamp}`;
        jar.appendChild(clone);
    };

    const loadWishes = () => {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return;
        const entries = JSON.parse(stored);
        if (entries.length) {
            emptyMessage?.remove();
            entries.forEach(renderWish);
        }
    };

    const saveWish = entry => {
        const stored = localStorage.getItem(storageKey);
        const entries = stored ? JSON.parse(stored) : [];
        entries.unshift(entry);
        localStorage.setItem(storageKey, JSON.stringify(entries));
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const wish = String(data.get('wish') || '').trim();
        const plan = String(data.get('plan') || '').trim();
        const song = String(data.get('song') || '').trim();
        const sweetness = data.get('sweetness');

        if (!wish || !plan) return;

        if (emptyMessage && jar.contains(emptyMessage)) {
            emptyMessage.remove();
        }

        const entry = {
            wish,
            plan,
            song,
            sweetness,
            timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
        };

        saveWish(entry);
        renderWish(entry);
        form.reset();
        qs('input[name="sweetness"]', form).value = sweetness;
        celebrate();
    });

    loadWishes();
}

function initMoodSwitch() {
    const buttons = qsa('[data-mood]');
    if (!buttons.length) return;

    const setMood = mood => {
        document.body.setAttribute('data-mood', mood);
        buttons.forEach(btn => btn.classList.toggle('is-active', btn.getAttribute('data-mood') === mood));
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.getAttribute('data-mood');
            setMood(mood);
        });
    });

    setMood('default');
}

function initCelebrationPreview() {
    const previewButton = qs('[data-preview-celebration]');
    const closeButton = qs('[data-close-celebration]');
    const container = qs('[data-celebration]');

    previewButton?.addEventListener('click', () => {
        launchBirthdayMoment({ preview: true });
    });

    closeButton?.addEventListener('click', hideCelebration);

    fireworkTriggerButton?.addEventListener('click', () => {
        triggerFireworks();
        celebrate(26, '52%');
    });

    container?.addEventListener('click', event => {
        if (event.target === container) {
            hideCelebration();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideCelebration();
        }
    });
}

function launchBirthdayMoment({ preview = false } = {}) {
    const container = qs('[data-celebration]');
    if (!container) return;
    if (hasCelebrated && !preview) return;

    updateCelebrationCopy(preview);

    container.setAttribute('aria-hidden', 'false');
    container.removeAttribute('hidden');

    requestAnimationFrame(() => {
        container.classList.add('is-visible');
        if (fireworkTriggerButton) {
            try {
                fireworkTriggerButton.focus({ preventScroll: true });
            } catch (error) {
                fireworkTriggerButton.focus();
            }
        }
    });

    const confettiAmount = preview ? 18 : 60;
    const startY = preview ? '60%' : '72%';
    celebrate(confettiAmount, startY);

    if (!preview) {
        triggerFireworks({ rounds: 4, burstSize: 24 });
        hasCelebrated = true;
    }
}

function hideCelebration() {
    const container = qs('[data-celebration]');
    if (!container || container.hasAttribute('hidden')) return;

    container.classList.remove('is-visible');
    container.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
        if (container.getAttribute('aria-hidden') === 'true') {
            container.setAttribute('hidden', '');
        }
    }, 260);
}

function updateCelebrationCopy(preview) {
    const title = qs('[data-celebration-title]');
    const message = qs('[data-celebration-message]');
    const note = qs('[data-celebration-note]');

    if (!title || !message || !note) return;

    if (preview) {
        title.textContent = 'Sneak peek rasa 00:00';
        message.textContent = 'Ini contoh kecil dari kejutan tengah malam yang sedang kupersiapkan untukmu.';
        note.textContent = 'Nanti di hari H aku bakal tambahin kata-kata yang lebih manis lagi.';
    } else {
        title.textContent = 'Selamat ulang tahun, manisku';
        message.textContent = 'Jam menunjukkan 00:00 dan hari ini hanya tentang kamu. Terima kasih sudah hadir di hidupku.';
        note.textContent = 'Aku akan ada di sampingmu untuk mewujudkan semua harapanmu.';
    }
}

function initSakuraToggle() {
    const toggleButton = qs('[data-toggle-sakura]');
    const layer = qs('[data-sakura-layer]');
    if (!toggleButton || !layer) return;

    const updateState = () => {
        toggleButton.classList.toggle('is-active', isSakuraActive);
        toggleButton.textContent = isSakuraActive ? 'Hentikan Sakura Manis' : 'Taburkan Sakura';
    };

    toggleButton.addEventListener('click', () => {
        isSakuraActive = !isSakuraActive;
        if (isSakuraActive) {
            startSakura(layer);
        } else {
            stopSakura(layer);
        }
        updateState();
    });

    updateState();
    if (isSakuraActive) {
        startSakura(layer);
    }
}

function startSakura(layer) {
    if (sakuraTimer) return;
    for (let i = 0; i < 16; i += 1) {
        createPetal(layer, true);
    }
    sakuraTimer = setInterval(() => {
        createPetal(layer);
    }, 420);
}

function stopSakura(layer) {
    clearInterval(sakuraTimer);
    sakuraTimer = null;
    layer.querySelectorAll('.sakura-petal').forEach(petal => {
        petal.style.transition = 'opacity 0.6s ease';
        petal.style.opacity = '0';
        setTimeout(() => petal.remove(), 600);
    });
}

function createPetal(layer, initial = false) {
    const petal = document.createElement('span');
    petal.className = 'sakura-petal';
    const startX = (Math.random() * 120 - 10).toFixed(2);
    const endX = (Number(startX) + (Math.random() * 20 - 10)).toFixed(2);
    const scale = (0.6 + Math.random() * 0.8).toFixed(2);
    const duration = 9 + Math.random() * 6;
    const spinDuration = 3 + Math.random() * 2;

    petal.style.setProperty('--start-x', `${startX}vw`);
    petal.style.setProperty('--end-x', `${endX}vw`);
    petal.style.setProperty('--scale', scale);
    petal.style.animationDuration = `${duration}s, ${spinDuration}s`;
    if (initial) {
        const delay = Math.random() * duration;
        petal.style.animationDelay = `-${delay}s, -${Math.random() * spinDuration}s`;
    }

    petal.addEventListener('animationend', () => {
        petal.remove();
    });

    layer.appendChild(petal);
}

function initMelodyButton() {
    if (!melodyButton) return;
    updateMelodyButtonState('default');

    melodyButton.addEventListener('click', () => {
        if (melodyPlaying) return;
        attemptAutoMelody({ forced: true }).then(success => {
            if (!success) {
                updateMelodyButtonState('enable');
            }
        });
    });
}

function updateMelodyButtonState(mode = 'default') {
    if (!melodyButton) return;
    melodyButton.classList.toggle('is-active', mode === 'playing');
    melodyButton.disabled = mode === 'playing';

    let label = MELODY_LABEL_DEFAULT;
    if (mode === 'playing') {
        label = MELODY_LABEL_PLAYING;
    } else if (mode === 'replay') {
        label = MELODY_LABEL_REPLAY;
    } else if (mode === 'enable') {
        label = MELODY_LABEL_ENABLE;
    }

    melodyButton.textContent = label;
}

function ensureAudioContext() {
    if (audioContext) return audioContext;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
    return audioContext;
}

function triggerMelodyPlayback() {
    const context = ensureAudioContext();
    if (!context) {
        return Promise.reject(new Error('Audio context unavailable'));
    }

    return context.resume().then(() => {
        playMelody();
        onMelodyStart();
    });
}

function attemptAutoMelody({ forced = false } = {}) {
    if (melodyPlaying) return Promise.resolve(true);
    if (!forced && autoMelodyAttempted) return Promise.resolve(false);
    autoMelodyAttempted = true;

    return triggerMelodyPlayback()
        .then(() => true)
        .catch(() => {
            if (!forced) {
                updateMelodyButtonState('enable');
            }
            return false;
        });
}

function attachMelodyUnlockHandlers() {
    if (melodyPlaying || melodyUnlockHandlerAttached) return;

    let handler;
    const cleanup = () => {
        document.removeEventListener('pointerdown', handler);
        document.removeEventListener('keydown', handler);
        melodyUnlockHandlerAttached = false;
    };

    handler = () => {
        attemptAutoMelody({ forced: true }).then(success => {
            if (success) {
                cleanup();
            }
        });
    };

    document.addEventListener('pointerdown', handler);
    document.addEventListener('keydown', handler);
    melodyUnlockHandlerAttached = true;
}

function onMelodyStart() {
    melodyPlaying = true;
    updateMelodyButtonState('playing');
    clearTimeout(melodyResetTimer);
    melodyResetTimer = setTimeout(() => {
        melodyPlaying = false;
        updateMelodyButtonState('replay');
    }, 9000);
}

function playMelody() {
    if (!audioContext) return;
    const now = audioContext.currentTime + 0.05;
    const notes = [
        { offset: 0, freq: 523.25, length: 0.8 },
        { offset: 0.8, freq: 587.33, length: 0.7 },
        { offset: 1.5, freq: 659.25, length: 0.7 },
        { offset: 2.2, freq: 587.33, length: 0.8 },
        { offset: 3.1, freq: 698.46, length: 0.9 },
        { offset: 4.1, freq: 783.99, length: 0.9 },
        { offset: 5.2, freq: 659.25, length: 0.8 },
        { offset: 6.0, freq: 587.33, length: 0.8 },
        { offset: 6.8, freq: 523.25, length: 1.1 }
    ];

    notes.forEach(note => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.offset);
        gain.gain.setValueAtTime(0, now + note.offset);
        gain.gain.linearRampToValueAtTime(0.24, now + note.offset + 0.05);
        gain.gain.linearRampToValueAtTime(0.18, now + note.offset + note.length - 0.08);
        gain.gain.linearRampToValueAtTime(0, now + note.offset + note.length);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(now + note.offset);
        osc.stop(now + note.offset + note.length + 0.02);
    });

    const ambient = audioContext.createOscillator();
    const ambientGain = audioContext.createGain();
    ambient.type = 'sine';
    ambient.frequency.setValueAtTime(392, now);
    ambientGain.gain.setValueAtTime(0, now);
    ambientGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
    ambientGain.gain.linearRampToValueAtTime(0.04, now + 6.5);
    ambientGain.gain.linearRampToValueAtTime(0, now + 8);
    ambient.connect(ambientGain).connect(audioContext.destination);
    ambient.start(now);
    ambient.stop(now + 8.2);
}

function initSparkles() {
    const button = qs('[data-sparkles]');
    if (!button) return;

    button.addEventListener('click', () => {
        const rect = button.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + window.scrollY + rect.height / 2;
        createSparkleBurst(originX, originY);
        button.classList.add('is-active');
        setTimeout(() => button.classList.remove('is-active'), 600);
    });
}

function createSparkleBurst(x, y) {
    const total = 18;
    for (let i = 0; i < total; i += 1) {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        const angle = (Math.PI * 2 * i) / total;
        const distance = 24 + Math.random() * 56;
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        sparkle.style.left = `${x + offsetX}px`;
        sparkle.style.top = `${y + offsetY}px`;
        sparkle.style.animationDelay = `${Math.random() * 0.2}s`;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1400);
    }
}

function celebrate(amount = 12, startY = 'calc(50% + 40px)') {
    for (let i = 0; i < amount; i += 1) {
        const confetti = document.createElement('span');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = startY;
        confetti.style.background = randomSweetColor();
        confetti.style.animationDelay = `${Math.random() * 0.3}s`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1500);
    }
}

function triggerFireworks({ rounds = 3, burstSize = 18 } = {}) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    for (let round = 0; round < rounds; round += 1) {
        setTimeout(() => {
            const originX = viewportWidth * (0.15 + Math.random() * 0.7);
            const originY = viewportHeight * (0.2 + Math.random() * 0.4);
            createFirework(originX, originY, burstSize);
        }, round * 320);
    }
}

function createFirework(x, y, burstSize) {
    const container = document.createElement('span');
    container.className = 'firework';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;

    const particleCount = burstSize;
    const angleStep = 360 / particleCount;

    for (let i = 0; i < particleCount; i += 1) {
        const particle = document.createElement('span');
        particle.className = 'firework__particle';
        particle.style.setProperty('--angle', `${angleStep * i}deg`);
        particle.style.background = randomSweetColor();
        container.appendChild(particle);
    }

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 1400);
}

function randomSweetColor() {
    const palette = ['#ff9fc5', '#ff6fa8', '#ffd8e5', '#e5d7ff', '#ffc2dd'];
    return palette[Math.floor(Math.random() * palette.length)];
}
