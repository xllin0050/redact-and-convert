export type ToolId = 'json-csv' | 'csv-json' | 'yaml-json' | 'json-yaml' | 'format'

export type RedactKind = 'email' | 'phone' | 'ip' | 'token' | 'custom'
export type Stage = 'parse' | 'redact' | 'convert' | 'format'

export interface AppError {
  stage: Stage
  message: string
}

export interface QuickRules {
  email: boolean
  phone: boolean
  ip: boolean
  token: boolean
}

export interface PreviewSummary {
  emails: number
  phones: number
  ips: number
  tokens: number
  customs: number
}

export interface PreviewSample {
  kind: RedactKind
  before: string
  after: string
}

export interface PreviewState {
  status: 'idle' | 'computing' | 'ready' | 'error'
  summary?: PreviewSummary
  sample?: PreviewSample[]
  errorMessage?: string
}

export interface CustomRegexRule {
  name: string
  pattern: string
  flags?: string
}

export type MaskStyle = 'REDACTED' | 'ASTERISKS' | 'HASH'

export interface AdvancedState {
  jsonKeys: string[]
  customRegexRules: CustomRegexRule[]
  maskStyle: MaskStyle
}

export interface RedactionConfig {
  quickRules: QuickRules
  advanced: AdvancedState
  includeAdvanced: boolean
}
