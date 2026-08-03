import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement HTMLMediaElement's play/pause/load. The audio
// controller degrades gracefully around missing implementations, but stubbing
// them keeps test output clean and prevents the "Not implemented" console
// messages from drowning out real failures.
if (typeof window !== 'undefined' && typeof HTMLMediaElement !== 'undefined') {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  })
}

afterEach(() => {
  cleanup()
})
