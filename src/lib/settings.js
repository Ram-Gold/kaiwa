export const SETTINGS_STORAGE_KEY = 'kaiwa.settings';
export const OLD_API_KEY_STORAGE_KEY = 'kaiwa.openrouter.apiKey';

export const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  openrouter: {
    apiKey: '',
    model: 'openrouter/auto',
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  },
};

export function loadSettings() {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Deep merge with defaults to handle schema changes gracefully
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        openrouter: { ...DEFAULT_SETTINGS.openrouter, ...parsed.openrouter },
        openai: { ...DEFAULT_SETTINGS.openai, ...parsed.openai },
        ollama: { ...DEFAULT_SETTINGS.ollama, ...parsed.ollama },
      };
    } catch (e) {
      console.error('Error parsing settings, resetting to default', e);
    }
  }

  // Check backward compatibility
  const oldKey = localStorage.getItem(OLD_API_KEY_STORAGE_KEY);
  if (oldKey) {
    const settings = {
      ...DEFAULT_SETTINGS,
      openrouter: {
        ...DEFAULT_SETTINGS.openrouter,
        apiKey: oldKey,
      },
    };
    saveSettings(settings);
    // Remove old key so we don't keep checking
    localStorage.removeItem(OLD_API_KEY_STORAGE_KEY);
    return settings;
  }

  return DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
