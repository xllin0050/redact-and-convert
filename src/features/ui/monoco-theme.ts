import { addCorners, type CornerOptions, unobserve } from '@monokai/monoco'

const MONOCO_APPLIED_ATTR = 'data-monoco-applied'

interface MonocoProfile {
  selector: string
  options: CornerOptions
}

const PROFILES: MonocoProfile[] = [
  {
    selector: '.top-bar, .panel, .action-row',
    options: { clip: true, borderRadius: 24, smoothing: 1 },
  },
  {
    selector: '.text-area',
    options: { clip: true, borderRadius: 16, smoothing: 1 },
  },
  {
    selector: '.tool-chip',
    options: { clip: true, borderRadius: 14, smoothing: 0.95 },
  },
  {
    selector: '.upload-btn, .primary-btn, .ghost-btn, .unlock-btn',
    options: { clip: true, borderRadius: 12, smoothing: 1 },
  },
  {
    selector: '.status',
    options: { clip: true, borderRadius: 999, smoothing: 1 },
  },
]

export function applyMonocoTheme(root: ParentNode = document): void {
  for (const profile of PROFILES) {
    const nodes = root.querySelectorAll<HTMLElement>(profile.selector)
    for (const node of nodes) {
      if (node.getAttribute(MONOCO_APPLIED_ATTR) === 'true') {
        continue
      }
      addCorners(node, profile.options)
      node.setAttribute(MONOCO_APPLIED_ATTR, 'true')
    }
  }
}

export function cleanupMonocoTheme(root: ParentNode = document): void {
  const nodes = root.querySelectorAll<HTMLElement>(`[${MONOCO_APPLIED_ATTR}="true"]`)
  for (const node of nodes) {
    unobserve(node)
    node.removeAttribute(MONOCO_APPLIED_ATTR)
  }
}
