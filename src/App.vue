<script setup lang="ts">
import { computed, reactive } from 'vue'
import InputPanel from './components/InputPanel.vue'
import OutputPanel from './components/OutputPanel.vue'
import PrivacyDrawer from './components/PrivacyDrawer.vue'
import ToolSelector from './components/ToolSelector.vue'
import { runTool } from './features/convert/converters'
import { applyRedaction, detectSensitive } from './features/redact/redaction'
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

  proStatus: 'free' as 'free' | 'pro',
  advanced: {
    jsonKeys: [],
    customRegexRules: [],
    maskStyle: 'REDACTED',
  } as AdvancedState,
})

const isPro = computed(() => state.proStatus === 'pro')
const primaryLabel = computed(() => (state.activeTool === 'format' ? 'Format' : 'Convert'))
const themeLabel = computed(() => (state.theme === 'moon' ? 'Moon' : 'Dawn'))

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
    const message = error instanceof Error ? error.message : 'Preview failed'
    state.preview = {
      status: 'error',
      errorMessage: message,
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
    state.error = {
      stage: 'redact',
      message: error instanceof Error ? error.message : 'Redaction failed',
    }
  }
}

function onCancelPreview(): void {
  state.preview = { status: 'idle' }
}

function onUnlockPro(): void {
  state.proStatus = 'pro'
  state.infoMessage = 'Pro unlocked in this browser session.'
}

function onRunPrimaryAction(): void {
  state.error = undefined
  state.infoMessage = ''

  try {
    state.outputText = runTool(state.activeTool, state.inputText)
  } catch (error) {
    state.error = {
      stage: state.activeTool === 'format' ? 'format' : 'convert',
      message: error instanceof Error ? error.message : 'Action failed',
    }
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
    includeAdvanced: isPro.value,
  }
}

function extensionForTool(tool: ToolId): string {
  if (tool === 'json-csv') return 'csv'
  if (tool === 'csv-json' || tool === 'yaml-json' || tool === 'format') return 'json'
  if (tool === 'json-yaml') return 'yaml'
  return 'txt'
}
</script>

<template>
  <div class="app-shell" :data-theme="state.theme">
    <header class="top-bar">
      <div>
        <h1>Redact and Convert</h1>
        <p>Offline JSON / CSV / YAML tools with optional privacy redaction.</p>
      </div>
      <div class="top-actions">
        <button type="button" class="theme-toggle" @click="onToggleTheme">
          Theme: {{ themeLabel }}
        </button>
        <span class="status" :class="{ pro: isPro }">{{ isPro ? 'Pro' : 'Free' }}</span>
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
        />

        <PrivacyDrawer
          :enabled="state.privacyEnabled"
          :quick-rules="state.quickRules"
          :preview="state.preview"
          :advanced="state.advanced"
          :is-pro="isPro"
          @update:quick-rules="onQuickRulesChange"
          @preview="onPreviewRedaction"
          @apply="onApplyRedaction"
          @cancel="onCancelPreview"
          @unlock="onUnlockPro"
          @update:advanced="onAdvancedChange"
        />
      </div>

      <OutputPanel :output-text="state.outputText" @copy="onCopyOutput" @download="onDownloadOutput" />
    </main>

    <section class="action-row">
      <button type="button" class="primary-btn" @click="onRunPrimaryAction">{{ primaryLabel }}</button>
      <p>Runs locally. No uploads.</p>
    </section>

    <p v-if="state.error" class="error-text">{{ state.error.message }}</p>
    <p v-else-if="state.infoMessage" class="info-text">{{ state.infoMessage }}</p>
  </div>
</template>
