<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import InputPanel from './components/InputPanel.vue'
import OutputPanel from './components/OutputPanel.vue'
import PrivacyDrawer from './components/PrivacyDrawer.vue'
import ToolSelector from './components/ToolSelector.vue'
import { runTool } from './features/convert/converters'
import { applyRedaction, detectSensitive } from './features/redact/redaction'
import { mapAppError } from './features/errors/mapAppError'
import type {
  AdvancedState,
  AppError,
  PreviewState,
  QuickRules,
  RedactionConfig,
  ToolId,
} from './types'

const state = reactive({
  theme: 'moon' as 'moon' | 'dawn',
  activeTool: 'json-csv' as ToolId,
  inputText: '',
  inputFileName: '',
  outputText: '',
  error: undefined as AppError | undefined,
  infoMessage: '',

  privacyEnabled: false,
  quickRules: {
    email: true,
    phone: true,
    ip: true,
    token: true,
  } as QuickRules,
  preview: {
    status: 'idle',
  } as PreviewState,
  advanced: {
    jsonKeys: [],
    customRegexRules: [],
    maskStyle: 'REDACTED',
  } as AdvancedState,
})

const themeLabel = computed(() => (state.theme === 'moon' ? 'Moon' : 'Dawn'))

const TOOL_META: Record<ToolId, { title: string; description: string }> = {
  'json-csv': {
    title: 'JSON to CSV Converter - Redact and Convert',
    description: 'Convert JSON to CSV in your browser. Local processing, no uploads, and no tracking.',
  },
  'csv-json': {
    title: 'CSV to JSON Converter - Redact and Convert',
    description: 'Convert CSV to JSON in your browser. Local processing, no uploads, and no tracking.',
  },
  'yaml-json': {
    title: 'YAML to JSON Converter - Redact and Convert',
    description: 'Convert YAML to JSON in your browser. Local processing, no uploads, and no tracking.',
  },
  'json-yaml': {
    title: 'JSON to YAML Converter - Redact and Convert',
    description: 'Convert JSON to YAML in your browser. Local processing, no uploads, and no tracking.',
  },
  format: {
    title: 'Format JSON CSV YAML - Redact and Convert',
    description: 'Format JSON, CSV, and YAML locally in your browser. No uploads and no tracking.',
  },
}

watch(
  () => state.activeTool,
  (tool) => {
    const meta = TOOL_META[tool]
    document.title = meta.title
    upsertMetaDescription(meta.description)
  },
  { immediate: true },
)

function onToolChange(tool: ToolId): void {
  state.activeTool = tool
  state.outputText = ''
  state.error = undefined
  state.infoMessage = ''
}

function onToggleTheme(): void {
  state.theme = state.theme === 'moon' ? 'dawn' : 'moon'
}

function onInputTextChange(text: string): void {
  state.inputText = text
  state.outputText = ''
  state.error = undefined
  state.infoMessage = ''
  state.preview = { status: 'idle' }
}

function onUpload(payload: { name: string; text: string }): void {
  state.inputFileName = payload.name
  onInputTextChange(payload.text)
}

function onClearInput(): void {
  state.inputFileName = ''
  onInputTextChange('')
}

function onPrivacyEnabledChange(enabled: boolean): void {
  state.privacyEnabled = enabled
  state.preview = { status: 'idle' }
  state.error = undefined
  state.infoMessage = ''
}

function onQuickRulesChange(rules: QuickRules): void {
  state.quickRules = rules
  state.preview = { status: 'idle' }
}

function onAdvancedChange(advanced: AdvancedState): void {
  state.advanced = advanced
  state.preview = { status: 'idle' }
}

function onPreviewRedaction(): void {
  if (!state.privacyEnabled || !state.inputText.trim()) {
    return
  }

  state.preview = { status: 'computing' }

  try {
    const result = detectSensitive(state.inputText, buildRedactionConfig())
    state.preview = {
      status: 'ready',
      summary: result.summary,
      sample: result.sample,
    }
    state.error = undefined
    state.infoMessage = ''
  } catch (error) {
    const mapped = mapAppError('preview', error)
    state.preview = {
      status: 'error',
      errorMessage: mapped.message,
    }
  }
}

function onApplyRedaction(): void {
  if (!state.privacyEnabled || !state.inputText.trim()) {
    return
  }

  try {
    state.inputText = applyRedaction(state.inputText, buildRedactionConfig())
    state.preview = { status: 'idle' }
    state.error = undefined
    state.infoMessage = 'Redaction applied to input text.'
  } catch (error) {
    state.error = mapAppError('redact', error)
  }
}

function onCancelPreview(): void {
  state.preview = { status: 'idle' }
}

function onFormat(): void {
  if (!state.inputText.trim()) return
  state.error = undefined
  state.infoMessage = ''
  try {
    state.inputText = runTool('format', state.inputText)
    state.infoMessage = 'Input formatted.'
  } catch (error) {
    state.error = mapAppError('format', error)
  }
}

function onRunPrimaryAction(): void {
  state.error = undefined
  state.infoMessage = ''

  try {
    state.outputText = runTool(state.activeTool, state.inputText)
  } catch (error) {
    state.error = mapAppError('convert', error)
  }
}

async function onCopyOutput(): Promise<void> {
  if (!state.outputText) {
    return
  }

  try {
    await navigator.clipboard.writeText(state.outputText)
    state.infoMessage = 'Output copied.'
  } catch {
    state.infoMessage = 'Copy failed. Please copy manually.'
  }
}

function onDownloadOutput(): void {
  if (!state.outputText) {
    return
  }

  const extension = extensionForTool(state.activeTool)
  const blob = new Blob([state.outputText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `output.${extension}`
  link.click()
  URL.revokeObjectURL(url)
  state.infoMessage = 'Output downloaded.'
}

function buildRedactionConfig(): RedactionConfig {
  return {
    quickRules: state.quickRules,
    advanced: state.advanced,
    includeAdvanced: true,
  }
}

function extensionForTool(tool: ToolId): string {
  if (tool === 'json-csv') return 'csv'
  if (tool === 'csv-json' || tool === 'yaml-json' || tool === 'format') return 'json'
  if (tool === 'json-yaml') return 'yaml'
  return 'txt'
}

function upsertMetaDescription(content: string): void {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
</script>

<template>
  <div class="app-shell" :data-theme="state.theme">
    <header class="top-bar">
      <div class="brand-block">
        <p class="eyebrow">Offline Utility Suite</p>
        <h1>Redact and Convert</h1>
        <p>Transform and sanitize JSON / CSV / YAML directly in your browser.</p>
      </div>
      <div class="top-actions">
        <button type="button" class="theme-toggle" @click="onToggleTheme">
          Theme: {{ themeLabel }}
        </button>
        <a class="ghost-btn policy-link" href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
      </div>
    </header>

    <ToolSelector :model-value="state.activeTool" @update:model-value="onToolChange" />

    <main class="workspace">
      <div class="left-column">
        <InputPanel
          :model-value="state.inputText"
          :privacy-enabled="state.privacyEnabled"
          @update:model-value="onInputTextChange"
          @update:privacy-enabled="onPrivacyEnabledChange"
          @upload="onUpload"
          @clear="onClearInput"
          @format="onFormat"
          @run="onRunPrimaryAction"
        />
      </div>

      <OutputPanel :output-text="state.outputText" @copy="onCopyOutput" @download="onDownloadOutput" />
    </main>

    <!-- Slide-over Privacy Drawer -->
    <Transition name="fade">
      <div v-if="state.privacyEnabled" class="drawer-overlay" @click="onPrivacyEnabledChange(false)" />
    </Transition>

    <Transition name="slide">
      <PrivacyDrawer
        v-if="state.privacyEnabled"
        :enabled="state.privacyEnabled"
        :quick-rules="state.quickRules"
        :preview="state.preview"
        :advanced="state.advanced"
        @update:quick-rules="onQuickRulesChange"
        @preview="onPreviewRedaction"
        @apply="onApplyRedaction"
        @cancel="onCancelPreview"
        @update:advanced="onAdvancedChange"
        @close="onPrivacyEnabledChange(false)"
      />
    </Transition>

    <p v-if="state.error" class="error-text" role="alert">{{ state.error.message }}</p>
    <p v-else-if="state.infoMessage" class="info-text" aria-live="polite">{{ state.infoMessage }}</p>

    <footer>
      <span>© {{ new Date().getFullYear() }} Redact and Convert. MIT License.</span>
    </footer>
  </div>
</template>
