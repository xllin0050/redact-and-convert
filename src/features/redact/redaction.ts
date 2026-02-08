import type {
  CustomRegexRule,
  MaskStyle,
  PreviewSample,
  PreviewSummary,
  RedactionConfig,
  RedactKind,
} from '../../types'

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE_REGEX = /\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b/g
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
const TOKEN_REGEX = /\b(?:[A-Za-z0-9_-]{24,}|ghp_[A-Za-z0-9]{20,}|sk_[A-Za-z0-9]{16,}|AIza[0-9A-Za-z-_]{20,})\b/g

interface Rule {
  kind: RedactKind
  regex: RegExp
}

interface DetectResult {
  summary: PreviewSummary
  sample: PreviewSample[]
}

const MAX_SAMPLE = 10

export function detectSensitive(text: string, config: RedactionConfig): DetectResult {
  const summary: PreviewSummary = {
    emails: 0,
    phones: 0,
    ips: 0,
    tokens: 0,
    customs: 0,
  }
  const sample: PreviewSample[] = []

  const rules = buildRules(config)

  for (const rule of rules) {
    for (const matched of text.matchAll(rule.regex)) {
      const value = matched[0]
      incrementSummary(summary, rule.kind)
      if (sample.length < MAX_SAMPLE) {
        sample.push({
          kind: rule.kind,
          before: value,
          after: maskValue(value, config.advanced.maskStyle),
        })
      }
    }
  }

  if (config.includeAdvanced && config.advanced.jsonKeys.length > 0) {
    const keyMatches = detectJsonKeyMatches(text, config.advanced.jsonKeys)
    summary.customs += keyMatches
  }

  return { summary, sample }
}

export function applyRedaction(text: string, config: RedactionConfig): string {
  let redacted = text

  const rules = buildRules(config)
  for (const rule of rules) {
    redacted = redacted.replace(rule.regex, (value) => maskValue(value, config.advanced.maskStyle))
  }

  if (config.includeAdvanced && config.advanced.jsonKeys.length > 0) {
    redacted = redactJsonKeys(redacted, config.advanced.jsonKeys, config.advanced.maskStyle)
  }

  return redacted
}

function buildRules(config: RedactionConfig): Rule[] {
  const rules: Rule[] = []

  if (config.quickRules.email) {
    rules.push({ kind: 'email', regex: cloneRegex(EMAIL_REGEX) })
  }
  if (config.quickRules.phone) {
    rules.push({ kind: 'phone', regex: cloneRegex(PHONE_REGEX) })
  }
  if (config.quickRules.ip) {
    rules.push({ kind: 'ip', regex: cloneRegex(IPV4_REGEX) })
  }
  if (config.quickRules.token) {
    rules.push({ kind: 'token', regex: cloneRegex(TOKEN_REGEX) })
  }

  if (config.includeAdvanced) {
    for (const rule of config.advanced.customRegexRules) {
      const regex = compileCustomRule(rule)
      rules.push({ kind: 'custom', regex })
    }
  }

  return rules
}

function compileCustomRule(rule: CustomRegexRule): RegExp {
  const flags = sanitizeFlags(rule.flags)
  const compiledFlags = flags.includes('g') ? flags : `${flags}g`
  return new RegExp(rule.pattern, compiledFlags)
}

function sanitizeFlags(flags?: string): string {
  if (!flags) {
    return ''
  }

  const unique = new Set(flags.split(''))
  const valid = ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']
  return [...unique].filter((flag) => valid.includes(flag)).join('')
}

function incrementSummary(summary: PreviewSummary, kind: RedactKind): void {
  if (kind === 'email') summary.emails += 1
  if (kind === 'phone') summary.phones += 1
  if (kind === 'ip') summary.ips += 1
  if (kind === 'token') summary.tokens += 1
  if (kind === 'custom') summary.customs += 1
}

function cloneRegex(regex: RegExp): RegExp {
  return new RegExp(regex.source, regex.flags)
}

function maskValue(value: string, style: MaskStyle): string {
  if (style === 'ASTERISKS') {
    return '***'
  }
  if (style === 'HASH') {
    return `#${simpleHash(value)}`
  }
  return '[REDACTED]'
}

function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function detectJsonKeyMatches(text: string, keys: string[]): number {
  const object = tryParseJson(text)
  if (object === null) {
    return 0
  }

  const keySet = new Set(keys.map((item) => item.trim()).filter(Boolean).map((item) => item.toLowerCase()))
  return countJsonKeyMatches(object, keySet)
}

function countJsonKeyMatches(value: unknown, keySet: Set<string>): number {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countJsonKeyMatches(item, keySet), 0)
  }

  if (value !== null && typeof value === 'object') {
    let total = 0
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (keySet.has(key.toLowerCase())) {
        total += 1
      }
      total += countJsonKeyMatches(item, keySet)
    }
    return total
  }

  return 0
}

function redactJsonKeys(text: string, keys: string[], style: MaskStyle): string {
  const object = tryParseJson(text)
  if (object === null) {
    return text
  }

  const keySet = new Set(keys.map((item) => item.trim()).filter(Boolean).map((item) => item.toLowerCase()))
  const redacted = redactByKeys(object, keySet, style)
  return JSON.stringify(redacted, null, 2)
}

function redactByKeys(value: unknown, keySet: Set<string>, style: MaskStyle): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactByKeys(item, keySet, style))
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) {
      if (keySet.has(key.toLowerCase())) {
        next[key] = maskValue(String(item), style)
      } else {
        next[key] = redactByKeys(item, keySet, style)
      }
    }
    return next
  }

  return value
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
