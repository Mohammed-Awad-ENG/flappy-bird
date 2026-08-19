const images = {
    bird: new Image(),
    background: new Image(),
    highBird: new Image(),
    highBackground: new Image()
};
images.bird.src = 'assets/bird.png';
images.background.src = 'assets/background.png';
images.highBird.src = 'assets/ultra_bird.png';
images.highBackground.src = 'assets/ultra_background.png';

function removeWhiteBackground(image) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(image, 0, 0);
    
    if (image.width === 0 || image.height === 0) return image;

    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        if (r > 150 && g > 150 && b > 150) {
            data[i+3] = 0;
        }
    }
    tempCtx.putImageData(imgData, 0, 0);
    return tempCanvas;
}

let assetsLoaded = 0;
const totalAssets = Object.keys(images).length;
for (let key in images) {
    images[key].onload = () => {
        if (key === 'bird' || key === 'highBird') {
            images[key] = removeWhiteBackground(images[key]);
        }
        assetsLoaded++;
    };
}

class SoundFX {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playFlap() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playScore() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1108.73, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.02);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playHit() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

const sfx = new SoundFX();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const startBestScoreDisplay = document.getElementById('start-best-score');
const startAttemptsDisplay = document.getElementById('start-attempts');
const gameOverBestScoreDisplay = document.getElementById('game-over-best-score');
const gameOverAttemptsDisplay = document.getElementById('game-over-attempts');

const diffEasyBtn = document.getElementById('diff-easy');
const diffMediumBtn = document.getElementById('diff-medium');
const diffHardBtn = document.getElementById('diff-hard');

const goDiffEasyBtn = document.getElementById('go-diff-easy');
const goDiffMediumBtn = document.getElementById('go-diff-medium');
const goDiffHardBtn = document.getElementById('go-diff-hard');

const gfxLowBtn = document.getElementById('gfx-low');
const gfxMediumBtn = document.getElementById('gfx-medium');
const gfxHighBtn = document.getElementById('gfx-high');

const goGfxLowBtn = document.getElementById('go-gfx-low');
const goGfxMediumBtn = document.getElementById('go-gfx-medium');
const goGfxHighBtn = document.getElementById('go-gfx-high');

const difficulties = {
    easy: { gap: 280, dx: 1.2, gravity: 0.12, jump: -4.0 },
    medium: { gap: 220, dx: 1.5, gravity: 0.15, jump: -4.5 },
    hard: { gap: 160, dx: 2.2, gravity: 0.2, jump: -5.5 }
};
let currentDifficulty = 'medium';
let currentGraphics = 'medium';
let bestScore = 0;
let attempts = parseInt(localStorage.getItem('flappyBirdAttempts')) || 0;

function updateBestScoreDisplay() {
    bestScore = parseInt(localStorage.getItem(`flappyBirdBestScore_${currentDifficulty}`)) || 0;
    if (currentDifficulty === 'medium' && !localStorage.getItem('flappyBirdBestScore_medium') && localStorage.getItem('flappyBirdBestScore')) {
        bestScore = parseInt(localStorage.getItem('flappyBirdBestScore'));
        localStorage.setItem('flappyBirdBestScore_medium', bestScore);
    }
    startBestScoreDisplay.innerText = bestScore;
}

function setDifficulty(diff) {
    currentDifficulty = diff;
    diffEasyBtn.classList.remove('active');
    diffMediumBtn.classList.remove('active');
    diffHardBtn.classList.remove('active');
    goDiffEasyBtn.classList.remove('active');
    goDiffMediumBtn.classList.remove('active');
    goDiffHardBtn.classList.remove('active');
    
    if (diff === 'easy') {
        diffEasyBtn.classList.add('active');
        goDiffEasyBtn.classList.add('active');
    }
    if (diff === 'medium') {
        diffMediumBtn.classList.add('active');
        goDiffMediumBtn.classList.add('active');
    }
    if (diff === 'hard') {
        diffHardBtn.classList.add('active');
        goDiffHardBtn.classList.add('active');
    }
    
    updateBestScoreDisplay();
}

function setGraphics(gfx) {
    currentGraphics = gfx;
    gfxLowBtn.classList.remove('active');
    gfxMediumBtn.classList.remove('active');
    gfxHighBtn.classList.remove('active');
    goGfxLowBtn.classList.remove('active');
    goGfxMediumBtn.classList.remove('active');
    goGfxHighBtn.classList.remove('active');
    
    if (gfx === 'low') {
        gfxLowBtn.classList.add('active');
        goGfxLowBtn.classList.add('active');
    }
    if (gfx === 'medium') {
        gfxMediumBtn.classList.add('active');
        goGfxMediumBtn.classList.add('active');
    }
    if (gfx === 'high') {
        gfxHighBtn.classList.add('active');
        goGfxHighBtn.classList.add('active');
    }
}

diffEasyBtn.addEventListener('click', () => setDifficulty('easy'));
diffMediumBtn.addEventListener('click', () => setDifficulty('medium'));
diffHardBtn.addEventListener('click', () => setDifficulty('hard'));
goDiffEasyBtn.addEventListener('click', () => setDifficulty('easy'));
goDiffMediumBtn.addEventListener('click', () => setDifficulty('medium'));
goDiffHardBtn.addEventListener('click', () => setDifficulty('hard'));

gfxLowBtn.addEventListener('click', () => setGraphics('low'));
gfxMediumBtn.addEventListener('click', () => setGraphics('medium'));
gfxHighBtn.addEventListener('click', () => setGraphics('high'));

goGfxLowBtn.addEventListener('click', () => setGraphics('low'));
goGfxMediumBtn.addEventListener('click', () => setGraphics('medium'));
goGfxHighBtn.addEventListener('click', () => setGraphics('high'));

updateBestScoreDisplay();
startAttemptsDisplay.innerText = attempts;

let gameState = 'START';
let frames = 0;
let score = 0;
let bgX = 0;

const bird = {
    x: canvas.width * 0.2,
    y: 150,
    w: 64,
    h: 64, 
    velocity: 0,
    gravity: 0.15,
    jump: -4.5,
    rotation: 0,

    draw() {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        ctx.rotate(this.rotation);
        if (assetsLoaded === totalAssets) {
            if (currentGraphics === 'low') {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            } else if (currentGraphics === 'high') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(images.highBird, -this.w / 2, -this.h / 2, this.w, this.h);
                ctx.restore();
            } else {
                ctx.drawImage(images.bird, -this.w / 2, -this.h / 2, this.w, this.h);
            }
        } else {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }
        ctx.restore();
    },

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.h >= canvas.height) {
            this.y = canvas.height - this.h;
            gameOver();
        }
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0;
        }
    },

    flap() {
        this.velocity = this.jump;
        sfx.playFlap();
    },
    
    reset() {
        this.x = canvas.width * 0.2;
        this.y = 150;
        this.velocity = 0;
        this.rotation = 0;
    }
};

const pipes = {
    items: [],
    w: 100,
    gap: 220,
    dx: 1.5,

    drawPipe(x, y, isTop) {
        const capHeight = 35;
        const bodyWidth = this.w - 12;
        const bodyX = x + 6;
        
        ctx.save();
        if (currentGraphics === 'low') {
            ctx.fillStyle = '#38b71d';
            if (isTop) {
                ctx.fillRect(bodyX, 0, bodyWidth, y - capHeight);
                ctx.fillRect(x, y - capHeight, this.w, capHeight);
            } else {
                ctx.fillRect(x, y, this.w, capHeight);
                ctx.fillRect(bodyX, y + capHeight, bodyWidth, canvas.height - y - capHeight);
            }
        } else if (currentGraphics === 'high') {
            const metalGrad = ctx.createLinearGradient(x, 0, x + this.w, 0);
            metalGrad.addColorStop(0, '#0f172a');
            metalGrad.addColorStop(0.15, '#334155');
            metalGrad.addColorStop(0.3, '#94a3b8');
            metalGrad.addColorStop(0.6, '#1e293b');
            metalGrad.addColorStop(1, '#020617');

            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;

            if (isTop) {
                // Body
                ctx.fillStyle = metalGrad;
                ctx.strokeStyle = '#020617';
                ctx.fillRect(bodyX, 0, bodyWidth, y - capHeight);
                ctx.strokeRect(bodyX, 0, bodyWidth, y - capHeight);

                // Cap
                ctx.fillRect(x, y - capHeight, this.w, capHeight);
                ctx.strokeRect(x, y - capHeight, this.w, capHeight);

                // Neon Ring
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fillRect(x - 2, y - 10, this.w + 4, 5);
                ctx.shadowBlur = 0;
            } else {
                // Cap
                ctx.fillStyle = metalGrad;
                ctx.strokeStyle = '#020617';
                ctx.fillRect(x, y, this.w, capHeight);
                ctx.strokeRect(x, y, this.w, capHeight);

                // Neon Ring
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fillRect(x - 2, y + 5, this.w + 4, 5);
                ctx.shadowBlur = 0;

                // Body
                ctx.fillStyle = metalGrad;
                ctx.strokeStyle = '#020617';
                ctx.fillRect(bodyX, y + capHeight, bodyWidth, canvas.height - y - capHeight);
                ctx.strokeRect(bodyX, y + capHeight, bodyWidth, canvas.height - y - capHeight);
            }
        } else {
            const gradient = ctx.createLinearGradient(x, 0, x + this.w, 0);
            gradient.addColorStop(0, '#115a11');
            gradient.addColorStop(0.15, '#75e63b');
            gradient.addColorStop(0.4, '#38b71d');
            gradient.addColorStop(1, '#0e4a0e');

            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#052905';
            ctx.lineWidth = 4;

            if (isTop) {
                ctx.fillRect(bodyX, 0, bodyWidth, y - capHeight);
                ctx.strokeRect(bodyX, 0, bodyWidth, y - capHeight);
                
                ctx.fillRect(x, y - capHeight, this.w, capHeight);
                ctx.strokeRect(x, y - capHeight, this.w, capHeight);
            } else {
                ctx.fillRect(x, y, this.w, capHeight);
                ctx.strokeRect(x, y, this.w, capHeight);
                
                ctx.fillRect(bodyX, y + capHeight, bodyWidth, canvas.height - y - capHeight);
                ctx.strokeRect(bodyX, y + capHeight, bodyWidth, canvas.height - y - capHeight);
            }
        }
        ctx.restore();
    },

    draw() {
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;

            this.drawPipe(p.x, topY, true);
            this.drawPipe(p.x, bottomY, false);
        }
    },

    update() {
        if (this.items.length === 0 || (canvas.width - this.items[this.items.length - 1].x) >= 350) {
            this.items.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - this.gap - 200) + 100,
                passed: false
            });
        }

        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= this.dx;

            let birdLeft = bird.x + 8;
            let birdRight = bird.x + bird.w - 8;
            let birdTop = bird.y + 8;
            let birdBottom = bird.y + bird.h - 8;

            if (birdRight > p.x && birdLeft < p.x + this.w &&
                (birdTop < p.y || birdBottom > p.y + this.gap)) {
                gameOver();
            }

            if (p.x + this.w < bird.x && !p.passed) {
                score++;
                scoreDisplay.innerText = score;
                p.passed = true;
                sfx.playScore();
            }

            if (p.x + this.w < 0) {
                this.items.shift();
                i--;
            }
        }
    },
    
    reset() {
        this.items = [];
    }
};

function drawBackground() {
    if (currentGraphics === 'low') {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    if (assetsLoaded === totalAssets) {
        let bgImg = currentGraphics === 'high' ? images.highBackground : images.background;
        const bgRatio = bgImg.width / bgImg.height;
        const drawWidth = Math.ceil(canvas.height * bgRatio);
        
        const numImages = Math.ceil(canvas.width / drawWidth) + 1;
        
        for (let i = 0; i < numImages; i++) {
            ctx.drawImage(bgImg, bgX + (i * drawWidth), 0, drawWidth, canvas.height);
        }
        
        if (gameState === 'PLAYING') {
            bgX -= 1;
            if (bgX <= -drawWidth) {
                bgX += drawWidth;
            }
        }
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function update() {
    if (gameState === 'PLAYING') {
        bird.update();
        pipes.update();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    pipes.draw();
    bird.draw();
}

function loop() {
    update();
    draw();
    if (gameState === 'PLAYING') frames++;
    requestAnimationFrame(loop);
}

function startGame() {
    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    scoreDisplay.innerText = '0';
    
    bird.gravity = difficulties[currentDifficulty].gravity;
    bird.jump = difficulties[currentDifficulty].jump;
    pipes.gap = difficulties[currentDifficulty].gap;
    pipes.dx = difficulties[currentDifficulty].dx;
    
    bird.reset();
    pipes.reset();
    score = 0;
    frames = 0;
    
    attempts++;
    localStorage.setItem('flappyBirdAttempts', attempts);
    
    if (sfx.ctx.state === 'suspended') {
        sfx.ctx.resume();
    }
    bird.flap();
}

function gameOver() {
    if (gameState === 'GAME_OVER') return;
    gameState = 'GAME_OVER';
    sfx.playHit();
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem(`flappyBirdBestScore_${currentDifficulty}`, bestScore);
    }
    
    gameOverBestScoreDisplay.innerText = bestScore;
    gameOverAttemptsDisplay.innerText = attempts;
    
    gameOverScreen.classList.remove('hidden');
    scoreDisplay.classList.add('hidden');
    finalScoreDisplay.innerText = score;
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === 'PLAYING') {
            bird.flap();
        } else if (gameState === 'START' || gameState === 'GAME_OVER') {
            startGame();
        }
    }
});

canvas.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') {
        bird.flap();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        bird.flap();
    }
}, {passive: false});

draw();
loop();
