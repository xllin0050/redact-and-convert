<script setup lang="ts">
const props = defineProps<{ outputText: string }>()

const emit = defineEmits<{
  (event: 'copy'): void
  (event: 'download'): void
}>()
</script>

<template>
  <section class="panel">
    <header class="panel-header">
      <h2>Output</h2>
      <div class="panel-actions">
        <button type="button" class="ghost-btn" @click="emit('copy')" :disabled="!props.outputText">Copy</button>
        <button type="button" class="ghost-btn" @click="emit('download')" :disabled="!props.outputText">Download</button>
      </div>
    </header>

    <textarea
      class="text-area"
      readonly
      :value="props.outputText"
      placeholder="Converted result appears here"
      aria-label="Output content"
    />

    <p class="badge">Processed locally · No uploads · No tracking</p>
  </section>
</template>
