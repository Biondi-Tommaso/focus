let audioCtx;
let isPlaying = false;

// Nodi Audio
let masterGain, bassOsc, bassLfo, bassGain, melodyOsc, melodyGain, melodyFilter, ambientNoise, ambientFilter, ambientGain;
let melodicBassOsc, melodicBassGain, melodicBassFilter;
let melodyInterval, melodicBassInterval, baseFreqModInterval;

// Configurazione Note Pentatoniche (Fa# Minore)
const scale = [54, 57, 59, 61, 64, 66]; 

// Note per bassi melodici (due ottave sotto per suono più profondo)
const bassScale = [30, 33, 35, 37, 40, 42]; // Due ottave sotto

// Sequenze melodiche per bassi tech
const bassSequences = {
    techno: [0, 2, 0, 4, 0, 2, 0, 3],
    progressive: [0, 0, 2, 2, 4, 4, 2, 0],
    minimal: [0, 4, 0, 4, 2, 4, 2, 0],
    hypnotic: [0, 2, 4, 2, 0, 2, 4, 5]
};

let currentBassStep = 0;
let baseFreqModState = {
    currentVolume: 0.5,
    currentFreq: 60,
    originalFreq: 60
};

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
    updateAmbientType();

    // --- BASSI MODULATI (ORIGINALE) ---
    bassOsc = audioCtx.createOscillator();
    bassOsc.frequency.value = 60;
    baseFreqModState.originalFreq = 60;
    baseFreqModState.currentFreq = 60;
    bassGain = audioCtx.createGain();
    baseFreqModState.currentVolume = 0.5;
    bassGain.gain.value = baseFreqModState.currentVolume;
    
    bassLfo = audioCtx.createOscillator();
    bassLfo.frequency.value = document.getElementById('bassModFreq').value;
    let lfoDepth = audioCtx.createGain();
    lfoDepth.gain.value = 0.5;

    bassLfo.connect(lfoDepth);
    lfoDepth.connect(bassGain.gain);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    // --- BASSI MELODICI TECH ---
    melodicBassOsc = audioCtx.createOscillator();
    melodicBassOsc.type = 'sawtooth'; // Suono più aggressivo per tech
    
    melodicBassFilter = audioCtx.createBiquadFilter();
    melodicBassFilter.type = 'lowpass';
    melodicBassFilter.frequency.value = 300; // cutoff più basso per bassi più profondi
    melodicBassFilter.Q.value = 0.8; // meno risonanza, suono più secco
    
    melodicBassGain = audioCtx.createGain();
    melodicBassGain.gain.value = 0;

    melodicBassOsc.connect(melodicBassFilter);
    melodicBassFilter.connect(melodicBassGain);
    melodicBassGain.connect(masterGain);

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
    melodicBassOsc.start();
    melodyOsc.start();
    startSequencer();
    startMelodicBass();
    startBaseFreqModulation();
}

function startMelodicBass() {
    if (melodicBassInterval) clearInterval(melodicBassInterval);
    
    const enabled = document.getElementById('melodicBassEnabled').checked;
    if (!enabled) {
        melodicBassGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
    }
    
    const bpm = document.getElementById('melodicBassBPM').value;
    const ms = (60 / bpm) * 1000;
    const sequence = bassSequences[document.getElementById('melodicBassSeq').value];
    
    melodicBassInterval = setInterval(() => {
        const now = audioCtx.currentTime;
        const noteIndex = sequence[currentBassStep % sequence.length];
        const midiNote = bassScale[noteIndex];
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
        const volume = parseFloat(document.getElementById('melodicBassVol').value);
        
        melodicBassOsc.frequency.setTargetAtTime(freq, now, 0.01);
        
        melodicBassGain.gain.cancelScheduledValues(now);
        melodicBassGain.gain.setValueAtTime(0, now);
        melodicBassGain.gain.linearRampToValueAtTime(volume, now + 0.01); // attack molto rapido
        melodicBassGain.gain.exponentialRampToValueAtTime(0.001, now + (ms/1000) * 0.25); // decay più secco
        
        // Modulazione filtro per effetto dinamico
        melodicBassFilter.frequency.setTargetAtTime(400 + Math.random() * 400, now, 0.05);
        
        currentBassStep++;
    }, ms);
}

function startBaseFreqModulation() {
    if (baseFreqModInterval) clearInterval(baseFreqModInterval);
    
    const enabled = document.getElementById('baseFreqModEnabled').checked;
    if (!enabled) return;
    
    const modType = document.getElementById('modType').value;
    const modMode = document.getElementById('modMode').value;
    const modInterval = parseInt(document.getElementById('modInterval').value);
    const modVolRange = parseFloat(document.getElementById('modVolRange').value);
    const modPitchRange = parseInt(document.getElementById('modPitchRange').value);
    
    const applyModulation = () => {
        const now = audioCtx.currentTime;
        let nextVolume = baseFreqModState.currentVolume;
        let nextFreq = baseFreqModState.currentFreq;
        
        // Calcola i range di volume (centro ± range)
        const volCenter = 0.55;
        const volMin = Math.max(0.1, volCenter - modVolRange * 0.5);
        const volMax = Math.min(1, volCenter + modVolRange * 0.5);
        
        if (modType === 'volume' || modType === 'both') {
            nextVolume = modMode === 'random' 
                ? Math.random() * (volMax - volMin) + volMin
                : (baseFreqModState.currentVolume === volMin ? volMax : volMin);
        }
        
        if (modType === 'pitch' || modType === 'both') {
            // Calcola variazioni relative usando semitoni moltiplicativi
            // Variazione di frequenza: freq_new = freq_original * 2^(semitoni/12)
            if (modMode === 'random') {
                const randomSemitones = (Math.random() * modPitchRange * 2) - modPitchRange;
                nextFreq = baseFreqModState.originalFreq * Math.pow(2, randomSemitones / 12);
            } else {
                // Alterna tra frequenza originale e frequenza modificata
                const pitchVariation = baseFreqModState.originalFreq * Math.pow(2, modPitchRange / 12);
                nextFreq = baseFreqModState.currentFreq === baseFreqModState.originalFreq 
                    ? pitchVariation
                    : baseFreqModState.originalFreq;
            }
        }
        
        baseFreqModState.currentVolume = nextVolume;
        baseFreqModState.currentFreq = nextFreq;
        
        // Applica le modulazioni con transizione molto smooth
        const transitionTime = (modInterval * 1000 - 500) / 1000; // Quasi tutto l'intervallo per transizione fluida
        
        if (modType === 'volume' || modType === 'both') {
            bassGain.gain.cancelScheduledValues(now);
            bassGain.gain.setValueAtTime(baseFreqModState.currentVolume, now);
            bassGain.gain.exponentialRampToValueAtTime(nextVolume, now + transitionTime);
        }
        
        if (modType === 'pitch' || modType === 'both') {
            bassOsc.frequency.cancelScheduledValues(now);
            bassOsc.frequency.setValueAtTime(baseFreqModState.currentFreq, now);
            bassOsc.frequency.exponentialRampToValueAtTime(nextFreq, now + transitionTime);
        }
    };
    
    baseFreqModInterval = setInterval(applyModulation, modInterval * 1000);
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
            ambientFilter.frequency.setTargetAtTime(150, now, 0.5);
            ambientGain.gain.setTargetAtTime(document.getElementById('ambientVolume').value * 1.5, now, 0.5);
            break;
        case 'storm':
            ambientFilter.type = 'lowpass';
            ambientFilter.frequency.setTargetAtTime(400, now, 0.5);
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
        // Se la melodia è disattivata, non schedulare note
        if (!document.getElementById('melodyEnabled') || !document.getElementById('melodyEnabled').checked) return;

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
        location.reload();
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

document.getElementById('melodicBassEnabled').addEventListener('change', () => {
    if(isPlaying) startMelodicBass();
});

document.getElementById('melodicBassSeq').addEventListener('change', () => {
    currentBassStep = 0;
    if(isPlaying) startMelodicBass();
});

document.getElementById('melodicBassBPM').addEventListener('input', (e) => {
    document.getElementById('melodicBassBPMVal').textContent = e.target.value;
    if(isPlaying) startMelodicBass();
});

document.getElementById('melodicBassVol').addEventListener('input', (e) => {
    document.getElementById('melodicBassVolVal').textContent = Math.round(e.target.value * 100) + "%";
});

document.getElementById('masterVolume').addEventListener('input', (e) => {
    document.getElementById('masterVolVal').textContent = Math.round(e.target.value * 100) + "%";
    if(masterGain) masterGain.gain.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
});

document.getElementById('melodyBPM').addEventListener('input', (e) => {
    document.getElementById('melodyBPMVal').textContent = e.target.value;
    if(isPlaying) startSequencer();
});

// Toggle per abilitare/disabilitare la melodia (mute)
document.getElementById('melodyEnabled').addEventListener('change', () => {
    if(!isPlaying || !melodyGain) return;
    const now = audioCtx.currentTime;
    if (document.getElementById('melodyEnabled').checked) {
        // lasciamo che il sequencer suoni la melodia al prossimo passo
    } else {
        // attenua subito la melodia
        melodyGain.gain.cancelScheduledValues(now);
        melodyGain.gain.setTargetAtTime(0, now, 0.01);
    }
});

// Event Listener per Modulazione Frequenza Base
document.getElementById('baseFreqModEnabled').addEventListener('change', () => {
    if (isPlaying) startBaseFreqModulation();
});

document.getElementById('modType').addEventListener('change', () => {
    if (isPlaying && document.getElementById('baseFreqModEnabled').checked) startBaseFreqModulation();
});

document.getElementById('modMode').addEventListener('change', () => {
    if (isPlaying && document.getElementById('baseFreqModEnabled').checked) startBaseFreqModulation();
});

document.getElementById('modInterval').addEventListener('input', (e) => {
    document.getElementById('modIntervalVal').textContent = e.target.value + ' sec';
    if (isPlaying && document.getElementById('baseFreqModEnabled').checked) startBaseFreqModulation();
});

document.getElementById('modVolRange').addEventListener('input', (e) => {
    const center = 0.55;
    const range = parseFloat(e.target.value);
    const min = Math.max(0.1, center - range * 0.5);
    const max = Math.min(1, center + range * 0.5);
    document.getElementById('modVolRangeVal').textContent = min.toFixed(1) + ' - ' + max.toFixed(1);
});

document.getElementById('modPitchRange').addEventListener('input', (e) => {
    document.getElementById('modPitchRangeVal').textContent = '±' + e.target.value;
});