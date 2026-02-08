<script setup lang="ts">
import { computed } from 'vue'
import type { AdvancedState, MaskStyle, PreviewState, QuickRules, RedactKind } from '../types'

const props = defineProps<{
  enabled: boolean
  quickRules: QuickRules
  preview: PreviewState
  isPro: boolean
  advanced: AdvancedState
}>()

const emit = defineEmits<{
  (event: 'update:quickRules', value: QuickRules): void
  (event: 'preview'): void
  (event: 'apply'): void
  (event: 'cancel'): void
  (event: 'unlock'): void
  (event: 'update:advanced', value: AdvancedState): void
}>()

const hasPreview = computed(() => props.preview.status === 'ready' && props.preview.summary)
const jsonKeysText = computed(() => props.advanced.jsonKeys.join(','))
const regexText = computed(() => props.advanced.customRegexRules[0]?.pattern ?? '')

function toggleQuickRule(rule: keyof QuickRules, event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:quickRules', {
    ...props.quickRules,
    [rule]: target.checked,
  })
}

function onJsonKeysInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const jsonKeys = target.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  emit('update:advanced', {
    ...props.advanced,
    jsonKeys,
  })
}

function onRegexInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const trimmed = target.value.trim()
  const customRegexRules = trimmed
    ? [
        {
          name: 'custom-1',
          pattern: trimmed,
          flags: 'gi',
        },
      ]
    : []

  emit('update:advanced', {
    ...props.advanced,
    customRegexRules,
  })
}

function updateMaskStyle(style: MaskStyle): void {
  emit('update:advanced', {
    ...props.advanced,
    maskStyle: style,
  })
}

function kindLabel(kind: RedactKind): string {
  if (kind === 'email') return 'Email'
  if (kind === 'phone') return 'Phone'
  if (kind === 'ip') return 'IP'
  if (kind === 'token') return 'Token'
  return 'Custom'
}
</script>

<template>
  <section v-if="props.enabled" class="panel privacy-panel">
    <h2>Privacy</h2>

    <div class="quick-rules">
      <h3>Quick redaction</h3>
      <label><input type="checkbox" :checked="props.quickRules.email" @change="toggleQuickRule('email', $event)" /> Emails</label>
      <label><input type="checkbox" :checked="props.quickRules.phone" @change="toggleQuickRule('phone', $event)" /> Phone numbers</label>
      <label><input type="checkbox" :checked="props.quickRules.ip" @change="toggleQuickRule('ip', $event)" /> IP addresses (IPv4)</label>
      <label><input type="checkbox" :checked="props.quickRules.token" @change="toggleQuickRule('token', $event)" /> Tokens / API keys</label>
      <p class="hint">Nothing is uploaded. Redaction happens in your browser.</p>
      <button type="button" class="primary-btn" @click="emit('preview')">Preview redaction</button>
    </div>

    <div class="preview-box" v-if="hasPreview">
      <p class="preview-summary">
        Detected:
        {{ props.preview.summary?.emails }} emails ·
        {{ props.preview.summary?.phones }} phone numbers ·
        {{ props.preview.summary?.ips }} IPs ·
        {{ props.preview.summary?.tokens }} tokens
      </p>
      <ul class="preview-list">
        <li v-for="(row, index) in props.preview.sample" :key="index">
          <strong>{{ kindLabel(row.kind) }}:</strong> <code>{{ row.before }}</code> -> <code>{{ row.after }}</code>
        </li>
      </ul>
      <div class="preview-actions">
        <button type="button" class="primary-btn" @click="emit('apply')">Apply redaction</button>
        <button type="button" class="ghost-btn" @click="emit('cancel')">Cancel</button>
      </div>
      <p class="pro-hint">Need more control (specific keys, custom regex, batch)? Unlock Pro.</p>
    </div>

    <div class="preview-box" v-if="props.preview.status === 'error'">
      <p class="error-text">{{ props.preview.errorMessage }}</p>
    </div>

    <details class="advanced" :open="!props.isPro">
      <summary>Advanced rules (Pro)</summary>
      <div class="advanced-body">
        <label>
          Redact by JSON keys
          <input
            type="text"
            :value="jsonKeysText"
            :disabled="!props.isPro"
            placeholder="token,password,email"
            @input="onJsonKeysInput"
          />
        </label>

        <label>
          Custom regex rule
          <input
            type="text"
            :value="regexText"
            :disabled="!props.isPro"
            placeholder="bearer\\s+[a-z0-9-_.]+"
            @input="onRegexInput"
          />
        </label>

        <fieldset :disabled="!props.isPro">
          <legend>Mask style</legend>
          <label><input type="radio" name="mask-style" value="REDACTED" :checked="props.advanced.maskStyle === 'REDACTED'" @change="updateMaskStyle('REDACTED')" /> [REDACTED]</label>
          <label><input type="radio" name="mask-style" value="ASTERISKS" :checked="props.advanced.maskStyle === 'ASTERISKS'" @change="updateMaskStyle('ASTERISKS')" /> ***</label>
          <label><input type="radio" name="mask-style" value="HASH" :checked="props.advanced.maskStyle === 'HASH'" @change="updateMaskStyle('HASH')" /> hash</label>
        </fieldset>

        <p class="hint">One-time unlock. Works offline. No account.</p>
        <button v-if="!props.isPro" type="button" class="unlock-btn" @click="emit('unlock')">Unlock Pro ($4)</button>
      </div>
    </details>
  </section>
</template>
