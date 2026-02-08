import { describe, expect, it } from 'vitest'
import { applyRedaction, detectSensitive } from './redaction'
import type { RedactionConfig } from '../../types'

function createConfig(overrides: Partial<RedactionConfig> = {}): RedactionConfig {
  const base: RedactionConfig = {
    quickRules: {
      email: true,
      phone: true,
      ip: true,
      token: true,
    },
    advanced: {
      jsonKeys: [],
      customRegexRules: [],
      maskStyle: 'REDACTED',
    },
    includeAdvanced: false,
  }

  return {
    ...base,
    ...overrides,
    advanced: {
      ...base.advanced,
      ...overrides.advanced,
    },
  }
}

describe('detectSensitive', () => {
  it('counts quick rule matches and records samples', () => {
    const config = createConfig()
    const text =
      'Email a@test.com, phone 415-555-1212, ip 192.168.1.10, token ghp_ABCDEFGHIJKLMNOPQRST'
    const result = detectSensitive(text, config)

    expect(result.summary).toEqual({
      emails: 1,
      phones: 1,
      ips: 1,
      tokens: 1,
      customs: 0,
    })
    expect(result.sample).toHaveLength(4)
  })

  it('adds custom regex and JSON-key matches in advanced mode', () => {
    const config = createConfig({
      includeAdvanced: true,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [{ name: 'acct', pattern: 'ACC-\\d{4}', flags: 'igx' }],
        maskStyle: 'REDACTED',
      },
    })
    const text = '{"password":"secret","note":"ACC-1234 and acc-5678"}'
    const result = detectSensitive(text, config)

    expect(result.summary.customs).toBe(3)
  })

  it('caps sample at 10 while keeping full counts', () => {
    const config = createConfig()
    const emails = Array.from({ length: 12 }, (_, index) => `u${index}@test.com`).join(' ')
    const result = detectSensitive(emails, config)

    expect(result.summary.emails).toBe(12)
    expect(result.sample).toHaveLength(10)
  })

  it('ignores advanced custom rules and json keys when includeAdvanced is false', () => {
    const config = createConfig({
      includeAdvanced: false,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [{ name: 'acct', pattern: 'ACC-\\d{4}', flags: 'g' }],
        maskStyle: 'REDACTED',
      },
    })
    const text = '{"password":"secret","note":"ACC-1234"}'
    const result = detectSensitive(text, config)

    expect(result.summary.customs).toBe(0)
  })

  it('does not count json key matches on non-json input', () => {
    const config = createConfig({
      includeAdvanced: true,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [],
        maskStyle: 'REDACTED',
      },
    })
    const result = detectSensitive('password=secret', config)

    expect(result.summary.customs).toBe(0)
  })

  it('throws when custom regex pattern is invalid', () => {
    const config = createConfig({
      includeAdvanced: true,
      advanced: {
        jsonKeys: [],
        customRegexRules: [{ name: 'bad', pattern: '(', flags: 'g' }],
        maskStyle: 'REDACTED',
      },
    })

    expect(() => detectSensitive('text', config)).toThrow()
  })
})

describe('applyRedaction', () => {
  it('replaces matches with asterisks style', () => {
    const config = createConfig({
      advanced: { jsonKeys: [], customRegexRules: [], maskStyle: 'ASTERISKS' },
    })
    const output = applyRedaction('Contact me at a@test.com', config)

    expect(output).toBe('Contact me at ***')
  })

  it('hash style returns stable 8-char hex hash', () => {
    const config = createConfig({
      advanced: { jsonKeys: [], customRegexRules: [], maskStyle: 'HASH' },
    })
    const output = applyRedaction('a@test.com', config)

    expect(output).toMatch(/^#[a-f0-9]{8}$/)
  })

  it('hash style is stable for same input and differs for different inputs', () => {
    const config = createConfig({
      advanced: { jsonKeys: [], customRegexRules: [], maskStyle: 'HASH' },
    })

    const first = applyRedaction('a@test.com', config)
    const second = applyRedaction('a@test.com', config)
    const third = applyRedaction('b@test.com', config)

    expect(first).toBe(second)
    expect(first).not.toBe(third)
  })

  it('auto-enables global flag and ignores invalid custom flags', () => {
    const config = createConfig({
      quickRules: { email: false, phone: false, ip: false, token: false },
      includeAdvanced: true,
      advanced: {
        jsonKeys: [],
        customRegexRules: [{ name: 'word', pattern: 'foo', flags: 'iz' }],
        maskStyle: 'REDACTED',
      },
    })
    const output = applyRedaction('foo FOO', config)

    expect(output).toBe('[REDACTED] [REDACTED]')
  })

  it('redacts JSON values by configured keys', () => {
    const config = createConfig({
      quickRules: { email: false, phone: false, ip: false, token: false },
      includeAdvanced: true,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [],
        maskStyle: 'REDACTED',
      },
    })
    const output = applyRedaction('{"password":"secret","nested":{"password":"n2"}}', config)

    expect(output).toBe('{\n  "password": "[REDACTED]",\n  "nested": {\n    "password": "[REDACTED]"\n  }\n}')
  })

  it('redacts json keys case-insensitively and trims configured key names', () => {
    const config = createConfig({
      quickRules: { email: false, phone: false, ip: false, token: false },
      includeAdvanced: true,
      advanced: {
        jsonKeys: [' Password '],
        customRegexRules: [],
        maskStyle: 'REDACTED',
      },
    })
    const output = applyRedaction('{"PASSWORD":"s1","nested":{"password":"s2"}}', config)

    expect(output).toBe('{\n  "PASSWORD": "[REDACTED]",\n  "nested": {\n    "password": "[REDACTED]"\n  }\n}')
  })

  it('keeps non-json text unchanged for json-key redaction', () => {
    const config = createConfig({
      quickRules: { email: false, phone: false, ip: false, token: false },
      includeAdvanced: true,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [],
        maskStyle: 'REDACTED',
      },
    })
    const output = applyRedaction('password=secret', config)

    expect(output).toBe('password=secret')
  })

  it('ignores advanced rules when includeAdvanced is false', () => {
    const config = createConfig({
      quickRules: { email: false, phone: false, ip: false, token: false },
      includeAdvanced: false,
      advanced: {
        jsonKeys: ['password'],
        customRegexRules: [{ name: 'acct', pattern: 'ACC-\\d{4}', flags: 'g' }],
        maskStyle: 'REDACTED',
      },
    })
    const output = applyRedaction('{"password":"secret","note":"ACC-1234"}', config)

    expect(output).toBe('{"password":"secret","note":"ACC-1234"}')
  })

  it('throws on invalid custom regex pattern during apply', () => {
    const config = createConfig({
      includeAdvanced: true,
      advanced: {
        jsonKeys: [],
        customRegexRules: [{ name: 'bad', pattern: '(', flags: 'g' }],
        maskStyle: 'REDACTED',
      },
    })

    expect(() => applyRedaction('text', config)).toThrow()
  })
})
