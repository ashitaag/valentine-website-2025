// Initialize configuration
const config = window.VALENTINE_CONFIG;

// Validate configuration
function validateConfig() {
    const warnings = [];

    // Check required fields
    if (!config.valentineName) {
        warnings.push("Valentine's name is not set! Using default.");
        config.valentineName = "My Love";
    }

    // Validate colors
    const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    Object.entries(config.colors).forEach(([key, value]) => {
        if (!isValidHex(value)) {
            warnings.push(`Invalid color for ${key}! Using default.`);
            config.colors[key] = getDefaultColor(key);
        }
    });

    // Validate animation values
    if (parseFloat(config.animations.floatDuration) < 5) {
        warnings.push("Float duration too short! Setting to 5s minimum.");
        config.animations.floatDuration = "5s";
    }

    if (config.animations.heartExplosionSize < 1 || config.animations.heartExplosionSize > 3) {
        warnings.push("Heart explosion size should be between 1 and 3! Using default.");
        config.animations.heartExplosionSize = 1.5;
    }

    // Log warnings if any
    if (warnings.length > 0) {
        console.warn("⚠️ Configuration Warnings:");
        warnings.forEach(warning => console.warn("- " + warning));
    }
}

// Default color values
function getDefaultColor(key) {
    const defaults = {
        backgroundStart: "#ffafbd",
        backgroundEnd: "#ffc3a0",
        buttonBackground: "#ff6b6b",
        buttonHover: "#ff8787",
        textColor: "#ff4757"
    };
    return defaults[key];
}

// Set page title
document.title = config.pageTitle;

// Initialize the page content when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Validate configuration first
    validateConfig();

    // Set the main title (the single question)
    const titleEl = document.getElementById('valentineTitle');
    if (titleEl) titleEl.textContent = `${config.valentineName}, Will you be my Valentine..`;

    // Main question
    const q1Text = document.getElementById('question1Text');
    const yesBtn1 = document.getElementById('yesBtn1');
    const noBtn1 = document.getElementById('noBtn1');
    if (q1Text && config.questions && config.questions.first) {
        q1Text.textContent = config.questions.first.text;
    }
    if (yesBtn1) yesBtn1.textContent = (config.questions && config.questions.first && config.questions.first.yesBtn) || 'Yes!';
    if (noBtn1) noBtn1.textContent = (config.questions && config.questions.first && config.questions.first.noBtn) || 'No';

    // Create floating elements and music (keep these for polish)
    createFloatingElements();
    setupMusicPlayer();

    // Wire buttons: Yes -> celebrate, No -> evasive + confirm
    if (yesBtn1) yesBtn1.addEventListener('click', celebrate);
    if (noBtn1) makeNoEvasive(noBtn1);
});

// Create floating hearts and bears
function createFloatingElements() {
    const container = document.querySelector('.floating-elements');
    
    // Create hearts
    config.floatingEmojis.hearts.forEach(heart => {
        const div = document.createElement('div');
        div.className = 'heart';
        div.innerHTML = heart;
        setRandomPosition(div);
        container.appendChild(div);
    });

    // Create bears
    config.floatingEmojis.bears.forEach(bear => {
        const div = document.createElement('div');
        div.className = 'bear';
        div.innerHTML = bear;
        setRandomPosition(div);
        container.appendChild(div);
    });
}

// Set random position for floating elements
function setRandomPosition(element) {
    element.style.left = Math.random() * 100 + 'vw';
    element.style.animationDelay = Math.random() * 5 + 's';
    element.style.animationDuration = 10 + Math.random() * 20 + 's';
}

// (No multi-question flow anymore — single-question site)

// Function to move the "No" button when clicked
// Move a button to a random location within the viewport (keeps it visible)
function moveButtonRandom(button, extraMargin = 20) {
    const bw = button.offsetWidth;
    const bh = button.offsetHeight;
    const maxX = Math.max(window.innerWidth - bw - extraMargin, extraMargin);
    const maxY = Math.max(window.innerHeight - bh - extraMargin, extraMargin);
    const x = extraMargin + Math.random() * (maxX - extraMargin);
    const y = extraMargin + Math.random() * (maxY - extraMargin);
    button.style.position = 'fixed';
    button.style.left = x + 'px';
    button.style.top = y + 'px';
}

// Make a NO button evasive: moves on mouseenter and opens confirm dialog on click
function makeNoEvasive(button) {
    // Track how many times it's been forcibly confirmed
    button.dataset.noCount = button.dataset.noCount || 0;

    // On hover, jump away
    button.addEventListener('mouseenter', () => {
        // increase eagerness slightly each time
        const count = parseInt(button.dataset.noCount || '0', 10);
        const extra = Math.min(200 + count * 40, 500);
        moveButtonRandom(button, extra);
    });

    // On click, show a confirm modal
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirm('Are you sure?', () => {
            // If user confirms "Yes" to the question 'Are you sure you want to say No?', close
            hideConfirm();
        }, () => {
            // If user presses No in the confirm (meaning they confirm the "No" choice), show heartbreak
            // Increase evasiveness counter
            button.dataset.noCount = (parseInt(button.dataset.noCount || '0', 10) + 1).toString();
            showHeartbreak(() => hideConfirm());
        });
    });
}

// Show a simple heartbreak message in the confirm modal area
function showHeartbreak(onClose) {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');

    msg.textContent = "Ohh... you are breaking my heart 💔";
    yes.classList.add('hidden');
    no.textContent = 'Okay';
    // replace handlers so clicking Okay closes the modal
    const clear = () => {
        yes.classList.remove('hidden');
        no.textContent = 'No';
        if (onClose) onClose();
    };

    const onOk = () => {
        no.removeEventListener('click', onOk);
        clear();
    };

    no.addEventListener('click', onOk);
    modal.classList.remove('hidden');
}

// Show confirm modal with callbacks for Yes and No
function showConfirm(message, onYes, onNo) {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmMessage');
    const yes = document.getElementById('confirmYes');
    const no = document.getElementById('confirmNo');

    // Clean previous handlers
    yes.replaceWith(yes.cloneNode(true));
    no.replaceWith(no.cloneNode(true));

    const newYes = document.getElementById('confirmYes');
    const newNo = document.getElementById('confirmNo');

    msg.textContent = message;
    newYes.textContent = 'Yes';
    newNo.textContent = 'No';

    newYes.addEventListener('click', () => {
        if (onYes) onYes();
        hideConfirm();
    });

    newNo.addEventListener('click', () => {
        if (onNo) onNo();
    });

    modal.classList.remove('hidden');
}

function hideConfirm() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    modal.classList.add('hidden');
}

// Love meter functionality (guarded in case the element is not present)
const loveMeter = document.getElementById('loveMeter');
const loveValue = document.getElementById('loveValue');
const extraLove = document.getElementById('extraLove');

function setInitialPosition() {
    if (!loveMeter || !loveValue) return;
    loveMeter.value = 100;
    loveValue.textContent = 100;
    loveMeter.style.width = '100%';
}

if (loveMeter && loveValue && extraLove) {
    loveMeter.addEventListener('input', () => {
        const value = parseInt(loveMeter.value);
        loveValue.textContent = value;
        
        if (value > 100) {
            extraLove.classList.remove('hidden');
            const overflowPercentage = (value - 100) / 9900;
            const extraWidth = overflowPercentage * window.innerWidth * 0.8;
            loveMeter.style.width = `calc(100% + ${extraWidth}px)`;
            loveMeter.style.transition = 'width 0.3s';
            
            // Show different messages based on the value
            if (value >= 5000) {
                extraLove.classList.add('super-love');
                extraLove.textContent = config.loveMessages.extreme;
            } else if (value > 1000) {
                extraLove.classList.remove('super-love');
                extraLove.textContent = config.loveMessages.high;
            } else {
                extraLove.classList.remove('super-love');
                extraLove.textContent = config.loveMessages.normal;
            }
        } else {
            extraLove.classList.add('hidden');
            extraLove.classList.remove('super-love');
            loveMeter.style.width = '100%';
        }
    });

    // Initialize love meter
    window.addEventListener('DOMContentLoaded', setInitialPosition);
    window.addEventListener('load', setInitialPosition);
}

// Celebration function
function celebrate() {
    document.querySelectorAll('.question-section').forEach(q => q.classList.add('hidden'));
    const celebration = document.getElementById('celebration');
    celebration.classList.remove('hidden');
    
    // Set celebration messages
    document.getElementById('celebrationTitle').textContent = config.celebration.title;
    document.getElementById('celebrationMessage').textContent = config.celebration.message;
    document.getElementById('celebrationEmojis').textContent = config.celebration.emojis;
    
    // Create heart explosion effect
    createHeartExplosion();
}

// Create heart explosion animation
function createHeartExplosion() {
    for (let i = 0; i < 50; i++) {
        const heart = document.createElement('div');
        const randomHeart = config.floatingEmojis.hearts[Math.floor(Math.random() * config.floatingEmojis.hearts.length)];
        heart.innerHTML = randomHeart;
        heart.className = 'heart';
        document.querySelector('.floating-elements').appendChild(heart);
        setRandomPosition(heart);
    }
}

// Music Player Setup
function setupMusicPlayer() {
    const musicControls = document.getElementById('musicControls');
    const musicToggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('bgMusic');
    const musicSource = document.getElementById('musicSource');

    // Only show controls if music is enabled in config
    if (!config.music.enabled) {
        musicControls.style.display = 'none';
        return;
    }

    // Set music source and volume
    musicSource.src = config.music.musicUrl;
    bgMusic.volume = config.music.volume || 0.5;
    bgMusic.load();

    // Try autoplay if enabled
    if (config.music.autoplay) {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented by browser");
                musicToggle.textContent = config.music.startText;
            });
        }
    }

    // Toggle music on button click
    musicToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play();
            musicToggle.textContent = config.music.stopText;
        } else {
            bgMusic.pause();
            musicToggle.textContent = config.music.startText;
        }
    });
} 