/**
 * Copy text to the clipboard. Falls back to a hidden textarea where the
 * Clipboard API is missing or refused (older browsers, non-secure origins).
 * Call it from a user gesture: iOS only allows copying inside a tap.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand?.('copy') ?? false
    area.remove()
    return ok
  }
}
