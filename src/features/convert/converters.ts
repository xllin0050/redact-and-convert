import Papa from 'papaparse'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { ToolId } from '../../types'

export function runTool(tool: ToolId, input: string): string {
  const source = input.trim()
  if (!source) {
    return ''
  }

  if (tool === 'json-csv') {
    return jsonToCsv(source)
  }

  if (tool === 'csv-json') {
    return csvToJson(source)
  }

  if (tool === 'yaml-json') {
    return yamlToJson(source)
  }

  if (tool === 'json-yaml') {
    return jsonToYaml(source)
  }

  return formatInput(source)
}

function jsonToCsv(input: string): string {
  const parsed = JSON.parse(input) as unknown
  const rows = normalizeRows(parsed)
  return Papa.unparse(rows)
}

function csvToJson(input: string): string {
  const parsed = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? 'Invalid CSV input')
  }

  return JSON.stringify(parsed.data, null, 2)
}

function yamlToJson(input: string): string {
  const parsed = parseYaml(input)
  return JSON.stringify(parsed, null, 2)
}

function jsonToYaml(input: string): string {
  const parsed = JSON.parse(input)
  return stringifyYaml(parsed)
}

function formatInput(input: string): string {
  try {
    const json = JSON.parse(input)
    return JSON.stringify(json, null, 2)
  } catch {
    // Try next format.
  }

  try {
    const yaml = parseYaml(input)
    return stringifyYaml(yaml)
  } catch {
    // Try next format.
  }

  const parsedCsv = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  })

  if (parsedCsv.errors.length === 0) {
    return Papa.unparse(parsedCsv.data)
  }

  throw new Error('Unsupported format. Please provide valid JSON, CSV, or YAML.')
}

function normalizeRows(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return []
    }

    if (typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
      return parsed as Record<string, unknown>[]
    }

    return parsed.map((value) => ({ value }))
  }

  if (typeof parsed === 'object' && parsed !== null) {
    return [parsed as Record<string, unknown>]
  }

  return [{ value: parsed }]
}
