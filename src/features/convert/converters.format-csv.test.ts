import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('yaml', async () => {
  const actual = await vi.importActual<typeof import('yaml')>('yaml')
  return {
    ...actual,
    parse: vi.fn(() => {
      throw new Error('mocked yaml parse failure')
    }),
  }
})

import { runTool } from './converters'

describe('runTool format fallback paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to CSV parse when JSON and YAML parsing fail', () => {
    const output = runTool('format', 'name,age\nAlice,20')

    expect(output).toBe('name,age\r\nAlice,20')
  })

  it('throws unsupported format error when CSV parsing also fails', () => {
    expect(() => runTool('format', 'name,age\n"Alice,20')).toThrow(
      'Unsupported format. Please provide valid JSON, CSV, or YAML.',
    )
  })
})
