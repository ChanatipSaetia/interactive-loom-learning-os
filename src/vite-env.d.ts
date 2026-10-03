interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_PORT: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
