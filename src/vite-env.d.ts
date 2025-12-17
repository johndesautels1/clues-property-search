/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_GROK_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_PERPLEXITY_API_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_DATABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
