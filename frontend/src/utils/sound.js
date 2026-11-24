// Web Audio API pure tone synthesizer for salon chime (no external mp3 dependency)
export const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Elegant two-tone chime (F5 -> A5)
    playTone(698.46, 0.0, 0.4);
    playTone(880.00, 0.25, 0.6);
  } catch (e) {
    console.warn('Audio chime playback suppressed by browser policy:', e);
  }
};
