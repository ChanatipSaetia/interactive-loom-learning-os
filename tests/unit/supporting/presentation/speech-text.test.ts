import { describe, it, expect } from 'vitest'
import { speechText } from '../../../../src/core/supporting/presentation/speech-text'

describe('speechText', () => {
  it('reads built file names without their hash, spelling the extension', () => {
    expect(speechText('Serve /app.3f9a.js forever.')).toBe('Serve app dot j s forever.')
    expect(speechText('Edit index.html, then styles.css')).toBe('Edit index dot h t m l, then styles dot c s s')
  })

  it('reads paths and URLs in parts', () => {
    expect(speechText('See https://www.example.com/docs/cache.')).toBe('See example dot com slash docs slash cache.')
    expect(speechText('Open src/main.tsx')).toBe('Open src slash main dot t s x')
  })

  it('drops the equals sign of header values', () => {
    expect(speechText('Send max-age=31536000 with it')).toBe('Send max-age 31536000 with it')
  })

  it('turns symbols and abbreviations into words', () => {
    expect(speechText('Request → cache & origin, e.g. a CDN')).toBe('Request to cache and origin, for example a CDN')
    expect(speechText('Damage × 2 is ~30% more')).toBe('Damage times 2 is about 30% more')
  })

  it('leaves ordinary text, numbers and identifiers alone', () => {
    expect(speechText('It costs 3.5 seconds.')).toBe('It costs 3.5 seconds.')
    expect(speechText('Keep max_age and `no-cache` here')).toBe('Keep max_age and no-cache here')
    expect(speechText('ร้านเปิด 10 โมง')).toBe('ร้านเปิด 10 โมง')
  })
})
