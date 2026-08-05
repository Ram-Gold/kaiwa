export async function translateJapaneseToEnglish(text) {
  if (!text || !text.trim()) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map((item) => item[0]).join('');
    }
    return 'Unable to translate text.';
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation service unavailable.';
  }
}
