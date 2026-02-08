import { describe, expect, it } from 'vitest'
import { runTool } from './converters'

describe('runTool', () => {
  it('returns empty output when input is blank', () => {
    expect(runTool('format', '   ')).toBe('')
  })

  it('converts JSON array to CSV', () => {
    const input = JSON.stringify([{ name: 'Alice', age: 20 }])
    const output = runTool('json-csv', input)

    expect(output).toBe('name,age\r\nAlice,20')
  })

  it('converts empty JSON array to empty CSV', () => {
    const output = runTool('json-csv', '[]')

    expect(output).toBe('')
  })

  it('converts JSON object to single CSV row', () => {
    const output = runTool('json-csv', '{"name":"Alice"}')

    expect(output).toBe('name\r\nAlice')
  })

  it('converts JSON primitive array to value-column CSV', () => {
    const output = runTool('json-csv', '[1,"two",true]')

    expect(output).toBe('value\r\n1\r\ntwo\r\ntrue')
  })

  it('converts JSON primitive to value-column CSV', () => {
    const output = runTool('json-csv', '123')

    expect(output).toBe('value\r\n123')
  })

  it('converts CSV to pretty JSON and trims headers', () => {
    const input = ' name ,age\nAlice,20'
    const output = runTool('csv-json', input)

    expect(output).toBe('[\n  {\n    "name": "Alice",\n    "age": "20"\n  }\n]')
  })

  it('converts YAML to pretty JSON', () => {
    const input = 'name: Alice\nage: 20'
    const output = runTool('yaml-json', input)

    expect(output).toBe('{\n  "name": "Alice",\n  "age": 20\n}')
  })

  it('converts JSON to YAML', () => {
    const output = runTool('json-yaml', '{"name":"Alice"}')

    expect(output).toBe('name: Alice\n')
  })

  it('formats JSON input', () => {
    const output = runTool('format', '{"name":"Alice","age":20}')

    expect(output).toBe('{\n  "name": "Alice",\n  "age": 20\n}')
  })

  it('formats YAML input', () => {
    const output = runTool('format', 'name: Alice')

    expect(output).toBe('name: Alice\n')
  })

  it('formats plain text as YAML scalar', () => {
    const output = runTool('format', 'hello world')

    expect(output).toBe('hello world\n')
  })

  it('throws on invalid CSV when converting to JSON', () => {
    expect(() => runTool('csv-json', 'name,age\n"Alice,20')).toThrow('Quoted field unterminated')
  })

  it('throws on invalid JSON when converting to CSV', () => {
    expect(() => runTool('json-csv', '{bad json')).toThrow()
  })
})
