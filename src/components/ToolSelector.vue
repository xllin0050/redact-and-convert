<script setup lang="ts">
import type { ToolId } from '../types'

const props = defineProps<{ modelValue: ToolId }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: ToolId): void }>()

const tools: Array<{ id: ToolId; label: string }> = [
  { id: 'json-csv', label: 'JSON -> CSV' },
  { id: 'csv-json', label: 'CSV -> JSON' },
  { id: 'yaml-json', label: 'YAML -> JSON' },
  { id: 'json-yaml', label: 'JSON -> YAML' },
  { id: 'format', label: 'Format' },
]

function onSelect(tool: ToolId): void {
  emit('update:modelValue', tool)
}
</script>

<template>
  <div class="tool-selector">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="tool-chip"
      :class="{ active: props.modelValue === tool.id }"
      @click="onSelect(tool.id)"
    >
      {{ tool.label }}
    </button>
  </div>
</template>
