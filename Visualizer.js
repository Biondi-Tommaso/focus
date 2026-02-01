const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let particles = [];
let animationId;

// Ridimensiona canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particella
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        ctx.fillStyle = `rgba(56, 189, 248, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Crea particelle
function initParticles() {
    particles = [];
    const particleCount = Math.min(150, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

// Disegna linee tra particelle vicine
function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - distance / 120)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Onde di frequenza (simulazione)
let wavePhase = 0;
function drawFrequencyWaves() {
    const waveCount = 5;
    const waveHeight = 80;
    
    for (let i = 0; i < waveCount; i++) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 - i * 0.015})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 5) {
            const y = canvas.height / 2 + 
                      Math.sin((x * 0.01) + wavePhase + (i * 0.5)) * (waveHeight - i * 10) +
                      Math.sin((x * 0.005) + wavePhase * 0.5) * 30;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
    wavePhase += 0.02;
}

// Animazione principale
function animate() {
    // Sfondo con fade
    ctx.fillStyle = 'rgba(10, 14, 26, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegna onde
    drawFrequencyWaves();

    // Update e disegna particelle
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Connetti particelle
    connectParticles();

    animationId = requestAnimationFrame(animate);
}

// Inizializza
initParticles();
animate();

// Reinizializza particelle al resize
window.addEventListener('resize', () => {
    initParticles();
});