# Audio‑Concentration Project

Experimental software for generating acoustic signals aimed at optimizing cognitive functions and deep‑concentration states. The project draws on recent neuroscientific evidence about brain‑state dynamics and the impact of auditory stimuli on neural rhythms. Currently the software is built largely with LLMs, because the primary goal is to create a template for testing the effectiveness of the techniques described in the paper linked below. If the project proves promising, a hand‑crafted, optimized version will be developed.

## Scientific Background  

The software implements sound‑synthesis algorithms based on the principles analyzed in the study  
[Nature Communications Biology (2024)](https://www.nature.com/articles/s42003-024-07026-3).  
That research shows how specific sound patterns can influence heart‑rate variability (HRV) and electroencephalographic (EEG) activity, promoting a transition toward a cognitive “flow” state.

### How It Works  

- **Colored‑Noise Synthesis** – Generation of pink noise (`𝟙/f`) and brown noise (`𝟙/f²`) to mask environmental disturbances and stabilize neural activity.  
- **Coherence Modulation** – Algorithms that maintain a steady stimulation level, preventing rapid sensory adaptation.  
- **Spectral‑Response Optimization** – Balancing frequencies to minimize auditory fatigue during prolonged work sessions.

## Software Features  

1. **Real‑Time Synthesis Engine** – Procedural audio generation without pre‑recorded samples, avoiding repetitive patterns.  
2. **Customizable Concentration Profiles** – Fine‑tuned spectral slope adjustments to match each user’s auditory sensitivity.  
3. **Minimalist Interface** – Designed to reduce visual distractions while in use.

## Technical Requirements  

- Python 3.8+  
- Digital Signal Processing (DSP) libraries  
- Low‑latency audio driver  

## Usage  

### Local execution  

```bash
git clone https://github.com/Biondi-Tommaso/focus.git
```

### Online access (latest version)
Visit the live site: https://biondi-tommaso.github.io/focus/

