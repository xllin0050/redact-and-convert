import type { AppError } from '../../types'

type ErrorContext = 'format' | 'convert' | 'redact' | 'preview'

const LOCAL_NOTICE = 'All processing is completed locally.'

const PARSE_HINT =
  'We could not parse your input. Please check JSON, CSV, or YAML syntax and try again.'
const CONVERT_HINT = 'We could not complete the conversion. Please verify tool selection and input format.'
const REDACT_HINT = 'We could not complete redaction. Please review your redaction rules and input content.'

export function mapAppError(context: ErrorContext, error: unknown): AppError {
  const raw = getRawMessage(error)

  if (context === 'redact' || context === 'preview') {
    return {
      stage: 'redact',
      message: `Redact error: ${REDACT_HINT} ${LOCAL_NOTICE}`,
    }
  }

  if (isParseLikeError(raw)) {
    return {
      stage: 'parse',
      message: `Parse error: ${PARSE_HINT} ${LOCAL_NOTICE}`,
    }
  }

  return {
    stage: 'convert',
    message: `Convert error: ${CONVERT_HINT} ${LOCAL_NOTICE}`,
  }
}

function getRawMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase()
  }
  return String(error ?? '').toLowerCase()
}

function isParseLikeError(rawMessage: string): boolean {
  const patterns = [
    'unexpected token',
    'unexpected end',
    'invalid csv',
    'unsupported format',
    'yaml',
    'json',
    'parse',
  ]
  return patterns.some((pattern) => rawMessage.includes(pattern))
}
