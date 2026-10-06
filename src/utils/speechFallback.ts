/**
 * Browser Speech Synthesis Fallback Utility
 * Provides seamless, zero-quota voice synthesis when Gemini TTS quota (429) is exhausted.
 */

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const stopSpeechSynthesis = () => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error cancelling speech synthesis:', e);
    }
  }
};

export const playBrowserSpeechFallback = (
  text: string,
  voiceName: string = 'Kore',
  onEnded?: () => void,
  onError?: () => void
): boolean => {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError();
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.includes('ID')
    );

    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
      utterance.lang = indonesianVoice.lang;
    } else {
      // Find suitable voice by gender or name
      const femaleVoices = voices.filter(
        (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')
      );
      const maleVoices = voices.filter(
        (v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george')
      );

      if (['Kore', 'Zephyr'].includes(voiceName) && femaleVoices.length > 0) {
        utterance.voice = femaleVoices[0];
      } else if (['Charon', 'Fenrir', 'Puck'].includes(voiceName) && maleVoices.length > 0) {
        utterance.voice = maleVoices[0];
      }
    }

    // Customize pitch & rate to match dramatic personas
    switch (voiceName) {
      case 'Charon':
        utterance.pitch = 0.75; // Heavy baritone
        utterance.rate = 0.92;
        break;
      case 'Fenrir':
        utterance.pitch = 0.62; // Deep bass
        utterance.rate = 0.88;
        break;
      case 'Puck':
        utterance.pitch = 1.15; // Energetic tenor
        utterance.rate = 1.05;
        break;
      case 'Zephyr':
        utterance.pitch = 1.25; // Soft emotional
        utterance.rate = 0.92;
        break;
      case 'Kore':
      default:
        utterance.pitch = 1.0; // Crisp elegant alto
        utterance.rate = 0.95;
        break;
    }

    utterance.volume = 1.0;

    utterance.onend = () => {
      if (onEnded) onEnded();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (onEnded) onEnded(); // Continue drama flow even if interrupted
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis failure:', err);
    if (onError) onError();
    return false;
  }
};
