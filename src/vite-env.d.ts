interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_PORT: string
  readonly DEV: boolean
}

/** The local server build embeds the matching browser bundle. */
declare module 'virtual:loom-local-app' {
  const html: string
  export default html
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** A file's text, inlined by Vite (`src/mcp/worker-prompt.ts`). */
declare module '*?raw' {
  const text: string
  export default text
}
