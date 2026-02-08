// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

const runToolMock = vi.fn<(tool: string, input: string) => string>()
const detectSensitiveMock = vi.fn()
const applyRedactionMock = vi.fn<(text: string, config: unknown) => string>()

vi.mock('./features/convert/converters', () => ({
  runTool: (tool: string, input: string) => runToolMock(tool, input),
}))

vi.mock('./features/redact/redaction', () => ({
  detectSensitive: (text: string, config: unknown) => detectSensitiveMock(text, config),
  applyRedaction: (text: string, config: unknown) => applyRedactionMock(text, config),
}))

describe('App integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs convert action and renders output text', async () => {
    runToolMock.mockReturnValue('converted-output')
    const wrapper = mount(App)

    const input = wrapper.get('textarea[placeholder="Paste JSON / CSV / YAML here"]')
    await input.setValue('{"name":"Alice"}')
    await wrapper.get('.action-row .primary-btn').trigger('click')

    expect(runToolMock).toHaveBeenCalledWith('json-csv', '{"name":"Alice"}')
    const output = wrapper.get('textarea[placeholder="Converted result appears here"]')
    expect((output.element as HTMLTextAreaElement).value).toBe('converted-output')
  })

  it('shows error text when convert action throws', async () => {
    runToolMock.mockImplementation(() => {
      throw new Error('convert failed')
    })
    const wrapper = mount(App)

    await wrapper.get('textarea[placeholder="Paste JSON / CSV / YAML here"]').setValue('bad')
    await wrapper.get('.action-row .primary-btn').trigger('click')

    expect(wrapper.get('.error-text').text()).toBe('convert failed')
  })

  it('previews redaction and applies it to input text', async () => {
    detectSensitiveMock.mockReturnValue({
      summary: { emails: 1, phones: 0, ips: 0, tokens: 0, customs: 0 },
      sample: [{ kind: 'email', before: 'a@test.com', after: '[REDACTED]' }],
    })
    applyRedactionMock.mockReturnValue('[REDACTED] user')

    const wrapper = mount(App)
    const input = wrapper.get('textarea[placeholder="Paste JSON / CSV / YAML here"]')
    await input.setValue('a@test.com user')

    const privacyToggle = wrapper.get('label.privacy-toggle input[type="checkbox"]')
    await privacyToggle.setValue(true)

    await wrapper.get('.privacy-panel .quick-rules .primary-btn').trigger('click')

    expect(detectSensitiveMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Detected:')

    await wrapper.get('.privacy-panel .preview-actions .primary-btn').trigger('click')

    expect(applyRedactionMock).toHaveBeenCalledTimes(1)
    expect((input.element as HTMLTextAreaElement).value).toBe('[REDACTED] user')
    expect(wrapper.get('.info-text').text()).toBe('Redaction applied to input text.')
  })

  it('includes advanced rules in preview after unlocking pro', async () => {
    detectSensitiveMock.mockReturnValue({
      summary: { emails: 0, phones: 0, ips: 0, tokens: 0, customs: 0 },
      sample: [],
    })
    const wrapper = mount(App)

    await wrapper.get('textarea[placeholder="Paste JSON / CSV / YAML here"]').setValue('{"password":"x"}')
    await wrapper.get('label.privacy-toggle input[type="checkbox"]').setValue(true)
    await wrapper.get('.privacy-panel .unlock-btn').trigger('click')

    const jsonKeyInput = wrapper.get('.advanced-body input[placeholder="token,password,email"]')
    await jsonKeyInput.setValue('password')
    await wrapper.get('.privacy-panel .quick-rules .primary-btn').trigger('click')

    const secondCall = detectSensitiveMock.mock.calls[0]
    expect(secondCall?.[1]).toMatchObject({
      includeAdvanced: true,
      advanced: { jsonKeys: ['password'] },
    })
    expect(wrapper.find('.status.pro').exists()).toBe(true)
  })

  it('toggles theme between moon and dawn', async () => {
    const wrapper = mount(App)
    const shell = wrapper.get('.app-shell')

    expect(shell.attributes('data-theme')).toBe('moon')
    expect(wrapper.get('.theme-toggle').text()).toContain('Moon')

    await wrapper.get('.theme-toggle').trigger('click')
    expect(shell.attributes('data-theme')).toBe('dawn')
    expect(wrapper.get('.theme-toggle').text()).toContain('Dawn')
  })
})
