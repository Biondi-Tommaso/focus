let audioCtx;
let isPlaying = false;

// Nodi Audio
let masterGain, bassOsc, bassLfo, bassGain, melodyOsc, melodyGain, melodyFilter, ambientNoise, ambientFilter, ambientGain;
let melodyInterval;

// Configurazione Note Pentatoniche (Fa# Minore)
const scale = [54, 57, 59, 61, 64, 66]; 

async function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master
    masterGain = audioCtx.createGain();
    masterGain.gain.value = document.getElementById('masterVolume').value;
    masterGain.connect(audioCtx.destination);

    // --- AMBIENTE (Procedural Noise) ---
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    ambientNoise = audioCtx.createBufferSource();
    ambientNoise.buffer = noiseBuffer;
    ambientNoise.loop = true;

    ambientFilter = audioCtx.createBiquadFilter();
    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = document.getElementById('ambientVolume').value;

    ambientNoise.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientGain.connect(masterGain);
    updateAmbientType(); // Imposta i filtri iniziali

    // --- BASSI MODULATI ---
    bassOsc = audioCtx.createOscillator();
    bassOsc.frequency.value = 60; 
    bassGain = audioCtx.createGain();
    
    bassLfo = audioCtx.createOscillator();
    bassLfo.frequency.value = document.getElementById('bassModFreq').value;
    let lfoDepth = audioCtx.createGain();
    lfoDepth.gain.value = 0.5;

    bassLfo.connect(lfoDepth);
    lfoDepth.connect(bassGain.gain);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    // --- MELODIA ---
    melodyOsc = audioCtx.createOscillator();
    melodyOsc.type = 'triangle';
    melodyFilter = audioCtx.createBiquadFilter();
    melodyFilter.frequency.value = 1200;
    melodyGain = audioCtx.createGain();
    melodyGain.gain.value = 0;

    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(masterGain);

    // Start
    ambientNoise.start();
    bassOsc.start();
    bassLfo.start();
    melodyOsc.start();
    startSequencer();
}

function updateAmbientType() {
    if (!ambientFilter) return;
    const type = document.getElementById('ambientType').value;
    const now = audioCtx.currentTime;

    switch(type) {
        case 'rain':
            ambientFilter.type = 'bandpass';
            ambientFilter.frequency.setTargetAtTime(1500, now, 0.5);
            ambientGain.gain.setTargetAtTime(document.getElementById('ambientVolume').value, now, 0.5);
            break;
        case 'car':
            ambientFilter.type = 'lowpass';
            ambientFilter.frequency.setTargetAtTime(150, now, 0.5); // Suono ovattato
            ambientGain.gain.setTargetAtTime(document.getElementById('ambientVolume').value * 1.5, now, 0.5);
            break;
        case 'storm':
            ambientFilter.type = 'lowpass';
            ambientFilter.frequency.setTargetAtTime(400, now, 0.5);
            // Simula tuoni casuali
            setInterval(() => {
                if(document.getElementById('ambientType').value === 'storm' && isPlaying) {
                    ambientGain.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 0.1);
                    ambientGain.gain.exponentialRampToValueAtTime(document.getElementById('ambientVolume').value, audioCtx.currentTime + 2);
                }
            }, 8000);
            break;
        default:
            ambientGain.gain.setTargetAtTime(0, now, 0.5);
    }
}

function startSequencer() {
    if (melodyInterval) clearInterval(melodyInterval);
    const bpm = document.getElementById('melodyBPM').value;
    const ms = (60 / bpm) * 1000;

    melodyInterval = setInterval(() => {
        if (Math.random() > 0.4) {
            const note = scale[Math.floor(Math.random() * scale.length)];
            const freq = 440 * Math.pow(2, (note - 69) / 12);
            const now = audioCtx.currentTime;
            
            melodyOsc.frequency.setTargetAtTime(freq, now, 0.05);
            melodyGain.gain.cancelScheduledValues(now);
            melodyGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            melodyGain.gain.exponentialRampToValueAtTime(0.001, now + (ms/1000) * 0.9);
        }
    }, ms);
}

// Event Listeners
document.getElementById('playBtn').addEventListener('click', function() {
    if (!isPlaying) {
        initAudio();
        this.textContent = "Ferma";
        this.classList.add('playing');
        isPlaying = true;
    } else {
        location.reload(); // Semplice reset
    }
});

document.getElementById('ambientType').addEventListener('change', updateAmbientType);
document.getElementById('ambientVolume').addEventListener('input', (e) => {
    document.getElementById('ambVolVal').textContent = Math.round(e.target.value * 100) + "%";
    if(ambientGain) ambientGain.gain.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
});
document.getElementById('bassModFreq').addEventListener('input', (e) => {
    document.getElementById('bassModFreqVal').textContent = e.target.value + " Hz";
    if(bassLfo) bassLfo.frequency.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
});
document.getElementById('masterVolume').addEventListener('input', (e) => {
    document.getElementById('masterVolVal').textContent = Math.round(e.target.value * 100) + "%";
    if(masterGain) masterGain.gain.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
});