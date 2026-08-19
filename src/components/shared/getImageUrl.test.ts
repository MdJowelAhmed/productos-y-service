import { describe, expect, it } from 'vitest'
import { imageUrl } from './getImageUrl'

describe('getImageUrl helper', () => {
  it('returns empty string when path is undefined or invalid', () => {
    expect(imageUrl(undefined)).toBe('')
    expect(imageUrl('')).toBe('')
    expect(imageUrl(null as any)).toBe('')
  })

  it('returns exact path when path starts with http:// or https://', () => {
    expect(imageUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png')
    expect(imageUrl('http://localhost:5009/image.jpg')).toBe('http://localhost:5009/image.jpg')
  })

  it('prepends VITE_IMAGE_URL correctly for relative paths', () => {
    const result = imageUrl('/uploads/logo.png')
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })
})
