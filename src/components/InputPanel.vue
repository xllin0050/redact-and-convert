<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  privacyEnabled: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'update:privacyEnabled', value: boolean): void
  (event: 'upload', payload: { name: string; text: string }): void
  (event: 'clear'): void
}>()

function onTextInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function onTogglePrivacy(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:privacyEnabled', target.checked)
}

function onUpload(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    emit('upload', { name: file.name, text })
  }
  reader.readAsText(file)
  target.value = ''
}
</script>

<template>
  <section class="panel">
    <header class="panel-header">
      <h2>Input</h2>
      <label class="privacy-toggle" title="Redact sensitive info before converting. Runs locally.">
        <input type="checkbox" :checked="props.privacyEnabled" @change="onTogglePrivacy" />
        Privacy mode
      </label>
    </header>

    <div class="panel-actions">
      <label class="upload-btn">
        Upload file
        <input type="file" accept=".json,.csv,.yaml,.yml,.txt" @change="onUpload" />
      </label>
      <button type="button" class="ghost-btn" @click="emit('clear')">Clear</button>
    </div>

    <textarea
      class="text-area"
      placeholder="Paste JSON / CSV / YAML here"
      aria-label="Input content"
      :value="props.modelValue"
      @input="onTextInput"
    />
  </section>
</template>
