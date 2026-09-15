let ctx: AudioContext | null = null;

function ac() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.08) {
  const c = ac();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

export function chime() {
  try {
    tone(880, 0, 0.28);
    tone(1318.5, 0.16, 0.36);
  } catch {
    /* audio blocked */
  }
}

export function blip() {
  try {
    tone(660, 0, 0.12, 0.05);
  } catch {
    /* noop */
  }
}

/**
 * Format table code into clear spoken English:
 * e.g. "T01" -> "Table 1", "T02" -> "Table 2", "1" -> "Table 1"
 */
export function formatTableSpeech(rawCode?: string): string {
  if (!rawCode) return 'Table 1';
  const clean = String(rawCode).trim();
  if (!clean) return 'Table 1';

  // Table followed by digits e.g. "Table 01", "Table 1"
  const tableWithNum = clean.match(/^table[\s-_]*0*(\d+)/i);
  if (tableWithNum) {
    return `Table ${parseInt(tableWithNum[1], 10)}`;
  }

  // T prefix with digits e.g. "T01", "T-01", "T1"
  const tWithNum = clean.match(/^t[\s-_]*0*(\d+)$/i);
  if (tWithNum) {
    return `Table ${parseInt(tWithNum[1], 10)}`;
  }

  // Pure digits e.g. "01", "1", "12"
  const pureNum = clean.match(/^0*(\d+)$/);
  if (pureNum) {
    return `Table ${parseInt(pureNum[1], 10)}`;
  }

  if (/^table/i.test(clean)) {
    return clean;
  }

  return `Table ${clean}`;
}

/**
 * Synthesizes an authentic phone ring tone and hotel/cafe bell chime.
 * Uses Web Audio API dual-tone frequencies (440Hz + 480Hz with 22Hz tremolo)
 * followed by bright cafe service bell tones (C6 + E6).
 */
export function playPhoneRing() {
  try {
    const c = ac();
    if (c.state === 'suspended') {
      void c.resume();
    }
    const now = c.currentTime;

    const playRingBurst = (startOffset: number, duration: number) => {
      const freqs = [440, 480];
      freqs.forEach((freq) => {
        const osc = c.createOscillator();
        const gain = c.createGain();

        // 22Hz tremolo modulation for authentic telephone ring vibration
        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        lfo.frequency.value = 22;
        lfoGain.gain.value = 0.08;
        lfo.connect(gain.gain);
        lfo.start(now + startOffset);
        lfo.stop(now + startOffset + duration);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + startOffset + 0.02);
        gain.gain.setValueAtTime(0.18, now + startOffset + duration - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

        osc.connect(gain).connect(c.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.05);
      });
    };

    // Burst 1 (0.00s - 0.35s)
    playRingBurst(0.0, 0.35);
    // Burst 2 (0.45s - 0.80s)
    playRingBurst(0.45, 0.35);

    // Followed by bright cafe alert bell chime (High C6 and E6)
    const playChimeTone = (freq: number, start: number, dur: number, gainLevel = 0.16) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };

    playChimeTone(1046.5, 0.95, 0.35, 0.18); // C6
    playChimeTone(1318.5, 1.10, 0.48, 0.20); // E6
  } catch (err) {
    console.warn('Ring tone audio error:', err);
  }
}

/**
 * Speaks "Table X, call staff" using the browser's Web Speech API
 */
export function speakStaffCall(tableCode: string = '1') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    const formattedTable = formatTableSpeech(tableCode);
    const textToSpeak = `${formattedTable}, call staff`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const bestVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }

    // Delay slightly so the ring tone melody plays first, followed smoothly by the voice announcement
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
      }
    }, 1250);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Main trigger: Plays ring tone and announces "Table X, call staff"
 */
export function playStaffCallAlert(tableCode: string = '1') {
  try {
    ac();
  } catch {
    /* ignore */
  }
  playPhoneRing();
  speakStaffCall(tableCode);
}
