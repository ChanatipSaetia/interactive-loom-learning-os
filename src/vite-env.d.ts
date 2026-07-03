interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
