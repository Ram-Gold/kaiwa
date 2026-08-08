export async function fetchJlptWordDefinition(term) {
  if (!term || typeof term !== 'string' || term.trim() === '') {
    return null;
  }

  const normalizedTerm = term.trim();

  try {
    const response = await fetch(`https://jlpt-vocab-api.vercel.app/api/words?word=${encodeURIComponent(normalizedTerm)}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.words || data.words.length === 0) {
      return null;
    }

    const wordData = data.words[0];
    const meanings = wordData.meaning ? wordData.meaning.split(';').map(m => m.trim()) : [];

    return {
      term: wordData.word,
      reading: wordData.furigana,
      romaji: wordData.romaji,
      jlpt: wordData.level ? `N${wordData.level}` : null,
      meanings: meanings,
      meaning: wordData.meaning,
    };
  } catch (error) {
    console.error('Error fetching JLPT definition:', error);
    return null;
  }
}
