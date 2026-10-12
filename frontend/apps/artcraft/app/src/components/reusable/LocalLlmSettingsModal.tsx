import { Modal } from "@storyteller/ui-modal";
import { invoke } from "@tauri-apps/api/core";
import { CheckIcon, RefreshCwIcon, SettingsIcon, XIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { useState, useEffect } from "react";
import { GenerationProvider } from "@storyteller/common";

interface LocalLlmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BackendType = "ollama" | "llama_cpp" | "lm_studio" | "custom";

interface LocalLlmConfig {
  backend: BackendType;
  base_url: string;
  model: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  timeout_seconds: number;
}

const DEFAULT_CONFIG: LocalLlmConfig = {
  backend: "ollama",
  base_url: "http://localhost:11434",
  model: "llama3.2",
  api_key: "",
  temperature: 0.7,
  max_tokens: 2048,
  system_prompt: "",
  timeout_seconds: 120,
};

const BACKEND_OPTIONS: { value: BackendType; label: string; defaultUrl: string }[] = [
  { value: "ollama", label: "Ollama", defaultUrl: "http://localhost:11434" },
  { value: "llama_cpp", label: "llama.cpp", defaultUrl: "http://localhost:8080" },
  { value: "lm_studio", label: "LM Studio", defaultUrl: "http://localhost:1234" },
  { value: "custom", label: "Custom", defaultUrl: "http://localhost:11434" },
];

export function LocalLlmSettingsModal({ isOpen, onClose }: LocalLlmSettingsModalProps) {
  const [config, setConfig] = useState<LocalLlmConfig>(DEFAULT_CONFIG);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedConfig = await invoke<LocalLlmConfig>("get_local_llm_config_command");
      setConfig(savedConfig);
    } catch (err) {
      console.error("Failed to load local LLM config:", err);
      setError("Failed to load configuration. Using defaults.");
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendChange = (backend: BackendType) => {
    const option = BACKEND_OPTIONS.find((o) => o.value === backend);
    setConfig((prev) => ({
      ...prev,
      backend,
      base_url: option?.defaultUrl ?? prev.base_url,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await invoke("save_local_llm_config_command", { config });
      onClose();
    } catch (err) {
      console.error("Failed to save local LLM config:", err);
      setError("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);
    try {
      // First save the config
      await invoke("save_local_llm_config_command", { config });
      // Then test the connection
      const availableModels = await invoke<string[]>("test_local_llm_connection_command");
      setModels(availableModels);
      setTestResult({
        success: true,
        message: `Connected successfully! Found ${availableModels.length} models.`,
      });
    } catch (err) {
      console.error("Failed to test local LLM connection:", err);
      setTestResult({
        success: false,
        message: `Connection failed: ${err}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const availableModels = await invoke<string[]>("test_local_llm_connection_command");
      setModels(availableModels);
    } catch (err) {
      console.error("Failed to refresh models:", err);
      setError("Failed to fetch models. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl p-6"
      showClose={true}
    >
      <div className="flex flex-col gap-6 text-base-fg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-medium">Local LLM Settings</h1>
          </div>
          <button
            onClick={onClose}
            className="text-base-fg/50 transition-colors hover:text-base-fg"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-base-fg/60">
          Configure your local LLM backend (Ollama, llama.cpp, LM Studio) to generate
          text completions without using credits.
        </p>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {testResult && (
          <div
            className={`rounded border p-3 text-sm ${
              testResult.success
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {testResult.message}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">Backend Type</label>
            <select
              value={config.backend}
              onChange={(e) => handleBackendChange(e.target.value as BackendType)}
              className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
            >
              {BACKEND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">Base URL</label>
            <input
              type="text"
              value={config.base_url}
              onChange={(e) => setConfig((prev) => ({ ...prev, base_url: e.target.value }))}
              placeholder="http://localhost:11434"
              className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">Model</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="llama3.2"
                className="flex-1 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
              />
              <Button
                onClick={handleRefreshModels}
                disabled={isLoading || isTesting}
                icon={RefreshCwIcon}
                className="h-10 px-3"
              >
                Refresh
              </Button>
            </div>
            {models.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {models.slice(0, 10).map((model) => (
                  <button
                    key={model}
                    onClick={() => setConfig((prev) => ({ ...prev, model }))}
                    className={`rounded px-2 py-1 text-xs ${
                      config.model === model
                        ? "bg-primary/20 text-primary"
                        : "bg-white/5 text-base-fg/60 hover:bg-white/10"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">
              Temperature: {config.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
              }
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">Max Tokens</label>
            <input
              type="number"
              value={config.max_tokens}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, max_tokens: parseInt(e.target.value) || 2048 }))
              }
              min="1"
              max="8192"
              className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">
              System Prompt (optional)
            </label>
            <textarea
              value={config.system_prompt}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, system_prompt: e.target.value }))
              }
              placeholder="You are a helpful assistant..."
              rows={3}
              className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-base-fg/80">
              API Key (optional)
            </label>
            <input
              type="password"
              value={config.api_key}
              onChange={(e) => setConfig((prev) => ({ ...prev, api_key: e.target.value }))}
              placeholder="Leave empty if not required"
              className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-base-fg"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="h-10 px-4"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isTesting}
            icon={CheckIcon}
            className="h-10 px-4"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default LocalLlmSettingsModal;
