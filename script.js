const targetDate = new Date('2025-10-01T00:00:00+07:00');
const storageKey = 'sweet-wishes';
let hasCelebrated = false;
let backsoundElement = null;
let backsoundStarted = false;
let backsoundUnlockHandlerAttached = false;
let backsoundUnlockHandler = null;
let celebrationSparkleTimer = null;
let bookOverlayElement = null;
let bookDialogElement = null;
let bookPagesElement = null;
let bookCounterElement = null;
let bookStageElement = null;
let bookPointerStartX = null;
let bookPointerActiveId = null;
let bookCurrentIndex = 0;
let bookIsAnimating = false;
const memoryImages = Array.from({ length: 7 }, (_, index) => `kenangan${index + 1}.jpg`);
const celebrationPageTexts = [
    {
        title: 'Lembar Pertama',
        lines: [
            'Di halaman awal ini ada tawa pertamamu yang membuatku jatuh hati seketika.',
            'Foto ini selalu mengingatkanku bahwa takdir bisa sesederhana mata yang saling mencari.'
        ]
    },
    {
        title: 'Lembar Kedua',
        lines: [
            'Kita belajar jadi tim favorit, bahkan ketika dunia serasa terlalu cepat.',
            'Aku suka caramu percaya bahwa apa pun bisa ringan selama kita satu arah.'
        ]
    },
    {
        title: 'Lembar Ketiga',
        lines: [
            'Ada hari-hari sunyi, tapi kamu yang membuatnya tetap hangat.',
            'Aku janji untuk selalu jadi tempat pulang ternyamanmu.'
        ]
    },
    {
        title: 'Lembar Keempat',
        lines: [
            'Di sini kamu sedang mengejar mimpi, dan aku di sampingmu sambil tepuk tangan paling keras.',
            'Ambisimu membuat aku ingin tumbuh bersama, seumur hidup.'
        ]
    },
    {
        title: 'Lembar Kelima',
        lines: [
            'Kita pernah tersesat, tapi genggamanmu mengarahkan jalan pulang.',
            'Selama ada kamu, aku percaya kita selalu bisa memulai lagi.'
        ]
    },
    {
        title: 'Lembar Keenam',
        lines: [
            'Tiap perjalanan kecil, dari kopi pagi sampai pesan larut malam, semuanya jadi bab favoritku.',
            'Semoga energi lembutmu selalu kubalas dengan kasih yang utuh.'
        ]
    },
    {
        title: 'Lembar Ketujuh',
        lines: [
            'Halaman ini sengaja kutulis kosong, supaya kamu bisa menambahkan mimpi-mimpimu.',
            'Aku akan menjaga dan mewujudkannya satu per satu, mulai malam ini.'
        ]
    }
];

const celebrationPages = memoryImages.map((src, index) => {
    const text = celebrationPageTexts[index] || celebrationPageTexts[celebrationPageTexts.length - 1];
    return {
        image: src,
        title: text.title,
        lines: text.lines,
        alt: `Kenangan manis kita ke-${index + 1}`
    };
});
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

document.addEventListener('DOMContentLoaded', () => {
    backsoundElement = qs('[data-backsound]');
    bookOverlayElement = qs('[data-celebration]');
    bookDialogElement = qs('[data-book-dialog]');
    bookPagesElement = qs('[data-book-pages]');
    bookCounterElement = qs('[data-book-counter]');
    bookStageElement = qs('[data-book-stage]');

    initSmoothScroll();
    initCountdown();
    initTimeline();
    initCarousel();
    initWishForm();
    initMoodSwitch();
    buildCelebrationBook();
    initCelebrationControls();
    initBacksound();
    
    initSparkles();
    scheduleAutoCelebration();
});

function initSmoothScroll() {
    qsa('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-scroll');
            const target = document.getElementById(targetId);
            if (btn.hasAttribute('data-play-backsound')) {
                playBacksound();
            }
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
            if (!hasCelebrated && isBirthdayWindow()) {
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
    if (!track) return;

    const prevBtn = qs('[data-direction="prev"]', carousel);
    const nextBtn = qs('[data-direction="next"]', carousel);
    const singleMedia = window.matchMedia('(max-width: 680px)');
    let singleMode = singleMedia.matches;
    let items = qsa('.carousel__item', track);
    if (!items.length) return;

    let index = 0;
    let startPointer = 0;

    const refreshItems = () => {
        items = qsa('.carousel__item', track);
    };

    const updateSingleHeight = () => {
        if (!singleMode) return;
        const active = items[index];
        if (!active) return;
        const { height } = active.getBoundingClientRect();
        if (height > 0) {
            track.style.height = `${height}px`;
        }
    };

    const applySingleState = () => {
        if (!singleMode) return;
        refreshItems();
        items.forEach((card, idx) => {
            const isActive = idx === index;
            card.classList.toggle('is-active', isActive);
            card.style.position = 'absolute';
            card.style.inset = '0';
            card.style.pointerEvents = isActive ? 'auto' : 'none';
            card.tabIndex = isActive ? 0 : -1;
            if (isActive) {
                card.removeAttribute('aria-hidden');
            } else {
                card.setAttribute('aria-hidden', 'true');
            }
        });
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(updateSingleHeight);
        } else {
            setTimeout(updateSingleHeight, 16);
        }
    };

    const updateCarousel = () => {
        refreshItems();
        if (!items.length) return;

        if (singleMode) {
            applySingleState();
            return;
        }

        const itemWidth = items[0].getBoundingClientRect().width;
        track.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
    };

    const goTo = newIndex => {
        if (!items.length) return;
        index = (newIndex + items.length) % items.length;
        if (singleMode) {
            applySingleState();
        } else {
            updateCarousel();
        }
    };

    const handleLayoutChange = () => {
        const shouldSingle = singleMedia.matches;
        const hasClass = carousel.classList.contains('love-notes__carousel--single');
        if (shouldSingle === singleMode && hasClass === shouldSingle) {
            updateCarousel();
            return;
        }

        singleMode = shouldSingle;
        if (singleMode) {
            carousel.classList.add('love-notes__carousel--single');
            index = 0;
            track.scrollLeft = 0;
            applySingleState();
        } else {
            carousel.classList.remove('love-notes__carousel--single');
            track.style.height = '';
            items.forEach(card => {
                card.classList.remove('is-active');
                card.style.position = '';
                card.style.inset = '';
                card.style.pointerEvents = '';
                card.removeAttribute('aria-hidden');
                card.removeAttribute('tabindex');
            });
            updateCarousel();
        }
    };

    handleLayoutChange();

    const mediaListener = () => handleLayoutChange();
    if (typeof singleMedia.addEventListener === 'function') {
        singleMedia.addEventListener('change', mediaListener);
    } else {
        singleMedia.addListener(mediaListener);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => goTo(index - 1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => goTo(index + 1));
    }

    track.addEventListener('click', event => {
        if (!singleMode) return;
        const card = event.target.closest('.carousel__item');
        if (!card || !card.classList.contains('is-active')) return;
        goTo(index + 1);
    });

    track.addEventListener('pointerdown', event => {
        if (singleMode) return;
        startPointer = event.clientX;
        if (typeof track.setPointerCapture === 'function') {
            try {
                track.setPointerCapture(event.pointerId);
            } catch (error) {
                /* ignore capture issues */
            }
        }
    });

    track.addEventListener('pointerup', event => {
        if (singleMode) return;
        const deltaX = event.clientX - startPointer;
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                goTo(index + 1);
            } else {
                goTo(index - 1);
            }
        }
        if (typeof track.releasePointerCapture === 'function') {
            try {
                track.releasePointerCapture(event.pointerId);
            } catch (error) {
                /* ignore release issues */
            }
        }
    });

    track.addEventListener('pointercancel', event => {
        if (singleMode) return;
        if (typeof track.releasePointerCapture === 'function') {
            try {
                track.releasePointerCapture(event.pointerId);
            } catch (error) {
                /* ignore release issues */
            }
        }
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

function initCelebrationControls() {
    const closeButtons = qsa('[data-close-celebration]');
    closeButtons.forEach(button => button.addEventListener('click', hideCelebration));

    if (bookOverlayElement) {
        bookOverlayElement.addEventListener('click', event => {
            if (event.target === bookOverlayElement || event.target.classList.contains('birthday-book__backdrop')) {
                hideCelebration();
            }
        });
    }

    const previewButton = qs('[data-preview-celebration]');
    if (previewButton) {
        previewButton.addEventListener('click', () => {
            launchBirthdayMoment({ preview: true, markCelebrated: false });
            previewButton.classList.add('is-active');
            setTimeout(() => previewButton.classList.remove('is-active'), 1200);
        });
    }

        if (bookPagesElement) {
        bookPagesElement.addEventListener('pointerdown', handleBookPointerDown);
        bookPagesElement.addEventListener('pointerup', handleBookPointerUp);
        bookPagesElement.addEventListener('pointercancel', resetBookPointer);
        bookPagesElement.addEventListener('pointerleave', resetBookPointer);
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideCelebration();
            return;
        }
        if (!bookOverlayElement?.classList.contains('is-visible')) return;
        if (event.key === 'ArrowRight') {
            turnBookPage(1);
        } else if (event.key === 'ArrowLeft') {
            turnBookPage(-1);
        }
    });
}

function launchBirthdayMoment({ preview = false, markCelebrated = !preview } = {}) {
    if (!bookOverlayElement) return;
    if (hasCelebrated && markCelebrated && !preview) return;

    updateCelebrationCopy(preview);

    document.body.classList.add('is-book-open');
    bookOverlayElement.setAttribute('aria-hidden', 'false');
    bookOverlayElement.removeAttribute('hidden');

    setBookPage(0, { instant: true });
    adjustBookStageHeight(qs('[data-book-page].is-active', bookPagesElement));
    updateBookCounter();

    requestAnimationFrame(() => {
        bookOverlayElement.classList.add('is-visible');
        const focusTarget = bookDialogElement?.querySelector('button:not([disabled])');
        try {
            focusTarget?.focus({ preventScroll: true });
        } catch (error) {
            focusTarget?.focus();
        }
    });

    const confettiAmount = preview ? 16 : 48;
    const startY = preview ? '64%' : '74%';
    celebrate(confettiAmount, startY);
    startCelebrationAura(preview);
    playBacksound(); // ensure backsound aktif saat buku dibuka
    if (!preview) {
        showCelebrationBanner();
    }
    setTimeout(() => launchPageFireworks(), 260);
    if (!preview) {
        triggerFireworks({ rounds: 4, burstSize: 28 });
    }

    if (markCelebrated && !preview) {
        hasCelebrated = true;
    }
}

function hideCelebration() {
    if (!bookOverlayElement || bookOverlayElement.hasAttribute('hidden')) return;

    bookOverlayElement.classList.remove('is-visible');
    bookOverlayElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-book-open');
    bookStageElement?.style.removeProperty('height');
    stopCelebrationAura();
    resetBookPointer();

    setTimeout(() => {
        if (bookOverlayElement?.getAttribute('aria-hidden') === 'true') {
            bookOverlayElement.setAttribute('hidden', '');
        }
    }, 280);
}

function updateCelebrationCopy(preview) {
    const eyebrow = qs('[data-book-eyebrow]');
    const title = qs('[data-book-title]');
    const subtitle = qs('[data-book-subtitle]');

    if (!eyebrow || !title || !subtitle) return;

    if (preview) {
        eyebrow.textContent = 'Preview rahasia untukmu';
        title.textContent = 'Sneak peek buku tengah malam';
        subtitle.textContent = 'Ini latihan kecil biar kamu bisa nyobain membalik halaman sebelum jam 00:00 nanti.';
    } else {
        eyebrow.textContent = 'Malam yang kita tunggu';
        title.textContent = 'Selamat ulang tahun, manisku';
        subtitle.textContent = 'Jam menunjukkan 00:00 dan buku kecil ini kubuka khusus untuk semua kenangan dan doa kita.';
    }
}

function buildCelebrationBook() {
    if (!bookPagesElement) return;

    bookPagesElement.innerHTML = '';
    const fragment = document.createDocumentFragment();

    celebrationPages.forEach((page, index) => {
        const article = document.createElement('article');
        article.className = 'birthday-book__page';
        article.dataset.bookPage = String(index);
        article.setAttribute('aria-hidden', 'true');

        const photo = document.createElement('div');
        photo.className = 'birthday-book__photo';
        const img = document.createElement('img');
        img.src = page.image;
        img.alt = page.alt;
        photo.appendChild(img);

        const textWrapper = document.createElement('div');
        textWrapper.className = 'birthday-book__text';
        const heading = document.createElement('h3');
        heading.textContent = page.title;
        textWrapper.appendChild(heading);
        page.lines.forEach(line => {
            const paragraph = document.createElement('p');
            paragraph.textContent = line;
            textWrapper.appendChild(paragraph);
        });

        article.appendChild(photo);
        article.appendChild(textWrapper);
        fragment.appendChild(article);
    });

    bookPagesElement.appendChild(fragment);
    bookCurrentIndex = 0;
    bookIsAnimating = false;
    setBookPage(0, { instant: true });
    adjustBookStageHeight(qs('[data-book-page].is-active', bookPagesElement));
    updateBookCounter();
}

function updateBookCounter() {
    if (!bookCounterElement) return;
    const total = celebrationPages.length;
    if (!total) return;
    bookCounterElement.textContent = `${bookCurrentIndex + 1} / ${total}`;
}

function adjustBookStageHeight(page) {
    if (!bookStageElement || !page) return;
    const measured = page.offsetHeight;
    if (measured) {
        bookStageElement.style.height = `${Math.round(measured + 16)}px`;
    }
}

function setBookPage(targetIndex, { instant = false, direction = 'forward' } = {}) {
    if (!bookPagesElement) return;
    const pages = qsa('[data-book-page]', bookPagesElement);
    if (!pages.length) return;

    const normalizedIndex = ((targetIndex % pages.length) + pages.length) % pages.length;
    const currentPage = pages[bookCurrentIndex];
    const nextPage = pages[normalizedIndex];
    if (!nextPage) return;

    const animationClasses = [
        'is-turning-forward-out',
        'is-turning-forward-in',
        'is-turning-backward-out',
        'is-turning-backward-in'
    ];

    if (instant || currentPage === nextPage) {
        pages.forEach((page, idx) => {
            animationClasses.forEach(cls => page.classList.remove(cls));
            const isActive = idx === normalizedIndex;
            page.classList.toggle('is-active', isActive);
            page.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        bookCurrentIndex = normalizedIndex;
        bookIsAnimating = false;
        updateBookCounter();
        adjustBookStageHeight(nextPage);
        return;
    }

    if (bookIsAnimating) return;
    bookIsAnimating = true;

    animationClasses.forEach(cls => {
        currentPage?.classList.remove(cls);
        nextPage.classList.remove(cls);
    });

    nextPage.classList.add('is-active');
    nextPage.setAttribute('aria-hidden', 'false');

    const outClass = direction === 'forward' ? 'is-turning-forward-out' : 'is-turning-backward-out';
    const inClass = direction === 'forward' ? 'is-turning-forward-in' : 'is-turning-backward-in';

    let finished = 0;
    const handleEnd = event => {
        if (event.target !== currentPage && event.target !== nextPage) return;
        event.target.classList.remove(outClass, inClass);
        event.target.removeEventListener('animationend', handleEnd);
        finished += 1;
        if (finished >= 2) {
            currentPage?.classList.remove('is-active');
            currentPage?.setAttribute('aria-hidden', 'true');
            bookCurrentIndex = normalizedIndex;
            updateBookCounter();
            bookIsAnimating = false;
            adjustBookStageHeight(nextPage);
            launchPageFireworks();
        }
    };

    currentPage?.addEventListener('animationend', handleEnd);
    nextPage.addEventListener('animationend', handleEnd);

    currentPage?.classList.add(outClass);
    nextPage.classList.add(inClass);
}

function turnBookPage(step) {
    if (!step) return;
    const pages = qsa('[data-book-page]', bookPagesElement);
    if (!pages.length) return;
    const direction = step > 0 ? 'forward' : 'backward';
    const targetIndex = bookCurrentIndex + (step > 0 ? 1 : -1);
    setBookPage(targetIndex, { direction });
}

function handleBookPointerDown(event) {
    if (!bookOverlayElement?.classList.contains('is-visible')) return;
    bookPointerStartX = event.clientX;
    bookPointerActiveId = event.pointerId;
    try {
        bookPagesElement?.setPointerCapture(event.pointerId);
    } catch (error) {
        /* ignore capture issues */
    }
}

function handleBookPointerUp(event) {
    if (bookPointerActiveId !== event.pointerId) {
        resetBookPointer();
        return;
    }

    const deltaX = event.clientX - (bookPointerStartX ?? event.clientX);
    resetBookPointer();

    if (Math.abs(deltaX) > 45) {
        turnBookPage(deltaX < 0 ? 1 : -1);
    }
}

function resetBookPointer() {
    if (bookPointerActiveId !== null && typeof bookPagesElement?.releasePointerCapture === 'function') {
        try {
            bookPagesElement.releasePointerCapture(bookPointerActiveId);
        } catch (error) {
            /* ignore release issues */
        }
    }
    bookPointerActiveId = null;
    bookPointerStartX = null;
}

function launchPageFireworks() {
    const viewportWidth = window.innerWidth;
    const originX = viewportWidth * (0.25 + Math.random() * 0.5);
    const startY = window.innerHeight * 0.92;
    const rise = window.innerHeight * (0.28 + Math.random() * 0.2);

    const rocket = document.createElement('span');
    rocket.className = 'firework firework--rocket';
    rocket.style.left = `${originX}px`;
    rocket.style.top = `${startY}px`;
    rocket.style.setProperty('--rise-distance', `${rise}px`);
    rocket.addEventListener('animationend', () => {
        createFirework(originX, startY - rise, 26);
        rocket.remove();
    });
    document.body.appendChild(rocket);
}

function initBacksound() {
    if (!backsoundElement) return;

    backsoundElement.setAttribute('playsinline', '');
    backsoundElement.loop = true;
    if (typeof backsoundElement.volume === 'number') {
        backsoundElement.volume = 0.55;
    }

    const triggers = qsa('[data-play-backsound]');
    if (triggers.length) {
        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                playBacksound();
            });
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && backsoundStarted) {
            backsoundElement.play().catch(() => {
                attachBacksoundUnlockHandlers();
            });
        }
    });
}

function playBacksound() {
    if (!backsoundElement) return;
    const playPromise = backsoundElement.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
            backsoundStarted = true;
            detachBacksoundUnlockHandlers();
        }).catch(() => {
            attachBacksoundUnlockHandlers();
        });
    } else {
        backsoundStarted = true;
    }
}

function attachBacksoundUnlockHandlers() {
    if (backsoundUnlockHandlerAttached) return;
    backsoundUnlockHandler = () => {
        detachBacksoundUnlockHandlers();
        playBacksound();
    };
    document.addEventListener('pointerdown', backsoundUnlockHandler);
    document.addEventListener('keydown', backsoundUnlockHandler);
    backsoundUnlockHandlerAttached = true;
}

function detachBacksoundUnlockHandlers() {
    if (!backsoundUnlockHandlerAttached || !backsoundUnlockHandler) return;
    document.removeEventListener('pointerdown', backsoundUnlockHandler);
    document.removeEventListener('keydown', backsoundUnlockHandler);
    backsoundUnlockHandlerAttached = false;
    backsoundUnlockHandler = null;
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
function startCelebrationAura(preview) {
    document.body.classList.add('is-celebrating');
    if (!preview) {
        startCelebrationSparkles();
    }
}

function stopCelebrationAura() {
    document.body.classList.remove('is-celebrating');
    stopCelebrationSparkles();
}

function startCelebrationSparkles() {
    if (celebrationSparkleTimer) return;
    const spawn = () => {
        const x = window.innerWidth * (0.2 + Math.random() * 0.6);
        const y = window.innerHeight * (0.2 + Math.random() * 0.35);
        const top = window.scrollY + y;
        createSparkleBurst(x, top);
    };
    spawn();
    celebrationSparkleTimer = setInterval(spawn, 3200);
}

function stopCelebrationSparkles() {
    if (!celebrationSparkleTimer) return;
    clearInterval(celebrationSparkleTimer);
    celebrationSparkleTimer = null;
}

function isBirthdayWindow() {
    const now = new Date();
    try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const [day, month, year] = formatter.format(now).split('/');
        return year === '2025' && month === '10' && day === '01';
    } catch (error) {
        return now.getFullYear() === 2025 && now.getMonth() === 9 && now.getDate() === 1;
    }
}

function scheduleAutoCelebration() {
    if (!isBirthdayWindow()) return;
    setTimeout(() => {
        launchBirthdayMoment({ preview: false, markCelebrated: false });
    }, 900);
}


function showCelebrationBanner() {
    const banner = qs('[data-celebration-banner]');
    if (!banner) return;
    banner.classList.add('is-visible');
    banner.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        banner.classList.remove('is-visible');
        banner.setAttribute('aria-hidden', 'true');
    }, 1600);
}
