import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiProviderSettingsCard, {
  PROVIDER_STORAGE_KEY,
  API_KEYS_STORAGE_PREFIX,
} from './AiProviderSettingsCard';

describe('AiProviderSettingsCard', () => {
  let mockOnSettingsSaved;
  const initialApiKeys = {
    openai: '',
    gemini: '',
    claude: '',
  };

  beforeEach(() => {
    window.localStorage.clear();
    mockOnSettingsSaved = vi.fn();
  });

  it('renders correctly with default values (Ollama)', () => {
    render(
      <AiProviderSettingsCard
        provider="ollama"
        apiKeys={initialApiKeys}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    // Verify select is visible and defaults to Ollama
    const select = screen.getByLabelText(/select provider/i);
    expect(select.value).toBe('ollama');

    // Key field should not be visible for Ollama
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();

    // Save button should be enabled by default for Ollama
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('shows API key input and validation error when switching to external provider without key', async () => {
    render(
      <AiProviderSettingsCard
        provider="ollama"
        apiKeys={initialApiKeys}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    const select = screen.getByLabelText(/select provider/i);
    fireEvent.change(select, { target: { value: 'openai' } });

    // Key input should be displayed now
    const keyInput = screen.getByLabelText(/api key/i);
    expect(keyInput).toBeInTheDocument();
    expect(keyInput.value).toBe('');

    // Error message "API key required" should be shown
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent(/api key required/i);
    expect(keyInput).toHaveAttribute('aria-describedby', 'api-key-error');

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /save settings/i });
    expect(saveButton).toBeDisabled();
  });

  it('displays "Invalid key format" if a key with invalid format is typed for external providers', async () => {
    render(
      <AiProviderSettingsCard
        provider="openai"
        apiKeys={initialApiKeys}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    const keyInput = screen.getByLabelText(/api key/i);
    const saveButton = screen.getByRole('button', { name: /save settings/i });

    // OpenAI validation check (must start with sk-)
    await userEvent.type(keyInput, 'bad-key');
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid key format/i);
    expect(saveButton).toBeDisabled();

    // Switch to Gemini
    const select = screen.getByLabelText(/select provider/i);
    fireEvent.change(select, { target: { value: 'gemini' } });

    // Gemini key input should show format check error for 'bad-key' if typed,
    // but switching provider triggers reload of Gemini key (which is empty initially).
    // Let's type 'bad-key' for Gemini.
    const keyInputGemini = screen.getByLabelText(/api key/i);
    await userEvent.type(keyInputGemini, 'bad-key');
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid key format/i);
    expect(saveButton).toBeDisabled();

    // Switch to Claude and type bad key
    fireEvent.change(select, { target: { value: 'claude' } });
    const keyInputClaude = screen.getByLabelText(/api key/i);
    await userEvent.type(keyInputClaude, 'bad-key');
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid key format/i);
    expect(saveButton).toBeDisabled();
  });

  it('allows saving and persists to localStorage if a valid key is provided', async () => {
    render(
      <AiProviderSettingsCard
        provider="openai"
        apiKeys={initialApiKeys}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    const keyInput = screen.getByLabelText(/api key/i);
    const saveButton = screen.getByRole('button', { name: /save settings/i });

    // Type valid OpenAI key
    await userEvent.type(keyInput, 'sk-validopenaiapikey');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    // Click Save
    await userEvent.click(saveButton);

    // Verify localStorage has been updated
    expect(window.localStorage.getItem(PROVIDER_STORAGE_KEY)).toBe('openai');
    expect(window.localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}openai`)).toBe('sk-validopenaiapikey');

    // Success status should be visible and announced
    const successMsg = screen.getByRole('status');
    expect(successMsg).toHaveTextContent(/settings saved successfully/i);

    // Parent callback should have been triggered
    expect(mockOnSettingsSaved).toHaveBeenCalledWith('openai', {
      openai: 'sk-validopenaiapikey',
      gemini: '',
      claude: '',
    });
  });

  it('correctly saves Ollama without a key', async () => {
    render(
      <AiProviderSettingsCard
        provider="openai"
        apiKeys={{ ...initialApiKeys, openai: 'sk-existing' }}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    const select = screen.getByLabelText(/select provider/i);
    fireEvent.change(select, { target: { value: 'ollama' } });

    // Key input should be hidden
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /save settings/i });
    await userEvent.click(saveButton);

    // Verify persistence
    expect(window.localStorage.getItem(PROVIDER_STORAGE_KEY)).toBe('ollama');

    // Callback called with ollama and unchanged openai key
    expect(mockOnSettingsSaved).toHaveBeenCalledWith('ollama', {
      openai: 'sk-existing',
      gemini: '',
      claude: '',
    });
  });

  it('allows removing an existing key using the Remove button', async () => {
    const apiKeysWithOpenAi = {
      ...initialApiKeys,
      openai: 'sk-somekey',
    };

    render(
      <AiProviderSettingsCard
        provider="openai"
        apiKeys={apiKeysWithOpenAi}
        onSettingsSaved={mockOnSettingsSaved}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove key/i });
    await userEvent.click(removeButton);

    // Local storage key should be deleted
    expect(window.localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}openai`)).toBeNull();

    // Key input should be empty
    const keyInput = screen.getByLabelText(/api key/i);
    expect(keyInput.value).toBe('');

    // Parent callback called with empty key
    expect(mockOnSettingsSaved).toHaveBeenCalledWith('openai', {
      openai: '',
      gemini: '',
      claude: '',
    });
  });
});
