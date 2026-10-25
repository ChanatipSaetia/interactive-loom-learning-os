/**
 * Links that open a topic in Loom Viewer (decisions 178–179 in
 * grill-log-adaptive-learning.md): `viewer.html#present` starts in Present,
 * and `#present&oui=<deflate + base64url>` carries the whole topic in the link.
 * The topic sits after `#`, so it never reaches the server. Links are built by
 * code (the MCP App, the Loom MCP server), never typed by a model.
 */

export interface TopicLink {
  /** Start in Present mode. */
  present: boolean
  /** The topic's .loom.oui text, when the link carries it. */
  oui?: string
}

/** Above this many characters in the hash, a link is too long to pass around reliably. */
export const MAX_LINK_HASH = 32_000

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(bytes).body!.pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

/** The hash (without `#`) for a topic link. */
export async function topicLinkHash(oui: string, present = true): Promise<string> {
  const packed = await pipe(new TextEncoder().encode(oui), new CompressionStream('deflate-raw'))
  return `${present ? 'present&' : ''}oui=${toBase64Url(packed)}`
}

/** A full Viewer URL for the topic, or null when the link would be too long. */
export async function topicLinkUrl(viewerUrl: string, oui: string, present = true): Promise<string | null> {
  const hash = await topicLinkHash(oui, present)
  return hash.length > MAX_LINK_HASH ? null : `${viewerUrl}#${hash}`
}

/** Read a Viewer hash (`#present&oui=…`). Throws when the topic in it cannot be unpacked. */
export async function readTopicLink(hash: string): Promise<TopicLink> {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const packed = params.get('oui')
  const present = params.has('present')
  if (!packed) return { present }
  const bytes = await pipe(fromBase64Url(packed), new DecompressionStream('deflate-raw'))
  return { present, oui: new TextDecoder().decode(bytes) }
}
