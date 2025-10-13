import { useCallback } from 'react';

// Create a single AudioContext to be reused.
// This avoids creating multiple contexts which is inefficient and can be problematic.
let audioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
    // Ensure this runs only in the browser
    if (typeof window === 'undefined') return null;

    if (!audioCtx || audioCtx.state === 'closed') {
         try {
             // Standard way to create an AudioContext, with fallback for older browsers.
             audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }
    return audioCtx;
};


// A function to play a synthesized sound based on its type.
const playSynthSound = (type: 'start' | 'complete' | 'rest') => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // The AudioContext might be in a 'suspended' state and needs to be resumed.
    // This often happens if audio is played before any user interaction.
    if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("AudioContext resume failed", e));
    }
    
    // Each sound needs its own gain node to control its volume independently.
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    // Start silent and quickly ramp up volume to avoid clicks.
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01); // Set a pleasant volume

    if (type === 'complete') {
        // A pleasant major chord arpeggio (C-E-G) for a rewarding sound.
        const t = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc3.type = 'sine';

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc3.connect(gainNode);
        
        osc1.frequency.value = 523.25; // C5
        osc2.frequency.value = 659.25; // E5
        osc3.frequency.value = 783.99; // G5
        
        // Stagger the start times for an arpeggio effect.
        osc1.start(t);
        osc2.start(t + 0.1);
        osc3.start(t + 0.2);

        // Fade out the sound.
        gainNode.gain.exponentialRampToValueAtTime(0.00001, t + 0.5);
        
        // Stop the oscillators after they've played.
        osc1.stop(t + 0.5);
        osc2.stop(t + 0.5);
        osc3.stop(t + 0.5);
    } else {
        const oscillator = ctx.createOscillator();
        oscillator.connect(gainNode);
        let duration = 0.2;

        switch(type) {
            case 'start': // A short, rising tone to indicate start.
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
                duration = 0.2;
                break;
            case 'rest': // A short, low beep for rest periods.
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(300, ctx.currentTime);
                duration = 0.15;
                break;
        }
        // Fade out and stop the single oscillator.
        gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }
};

/**
 * A React hook to play audio cues.
 * This implementation generates sounds using the Web Audio API to avoid
 * dependency on external audio files, fixing "no supported sources" errors.
 * It maintains the original API but replaces the file-loading logic.
 * @param url - The URL of the audio file, used to determine which sound to play.
 * @returns A tuple with a single element: a function to play the sound.
 */
export const useAudio = (url: string): [() => void] => {
  // useCallback ensures the returned function is stable between re-renders.
  const play = useCallback(() => {
    let soundType: 'start' | 'complete' | 'rest' | null = null;
    
    // Determine the sound type from the provided URL string.
    if (url.includes('start.mp3')) {
      soundType = 'start';
    } else if (url.includes('complete.mp3')) {
      soundType = 'complete';
    } else if (url.includes('rest.mp3')) {
      soundType = 'rest';
    }
    
    if (soundType) {
        playSynthSound(soundType);
    }
  }, [url]);

  return [play];
};
