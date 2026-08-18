import { extractCleanJapaneseText } from './japaneseText.js';

export function speakJapanese(text) {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return false;
  }

  window.speechSynthesis.cancel();

  const cleanText = extractCleanJapaneseText(text);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';

  const storedRate = parseFloat(window.localStorage?.getItem?.('kaiwa.speech.rate') || '1.0');
  utterance.rate = isNaN(storedRate) ? 1.0 : storedRate;

  window.speechSynthesis.speak(utterance);

  return true;
}

