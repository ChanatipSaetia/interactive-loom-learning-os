interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_PORT: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** A file's text, inlined by Vite (`src/mcp/worker-prompt.ts`). */
declare module '*?raw' {
  const text: string
  export default text
}
