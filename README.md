# Redact and Convert

A browser-first utility for transforming and sanitizing JSON, CSV, and YAML.

The app runs entirely on the client side and is designed for quick data conversion plus optional privacy redaction before sharing or exporting content.

## Features

- Convert between common formats:
  - JSON -> CSV
  - CSV -> JSON
  - YAML -> JSON
  - JSON -> YAML
- Format input (`Format`) for supported JSON/YAML/CSV text.
- Privacy drawer with local redaction tools:
  - Quick rules: emails, phone numbers, IPv4 addresses, API-like tokens
  - Custom regex rule
  - JSON key-based redaction
  - Mask styles: `[REDACTED]`, `***`, hash
- Preview sensitive matches before applying redaction.
- Copy and download output.
- Upload local files (`.json`, `.csv`, `.yaml`, `.yml`, `.txt`).
- Theme toggle (Moon / Dawn).

## Privacy

- Processing is done in the browser.
- No server upload is required by the app workflow.

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Papa Parse (CSV)
- YAML (parse/stringify)
- Vitest + Vue Test Utils

## Requirements

- Node.js 20+
- pnpm

## Getting Started

```bash
pnpm install
pnpm dev
```

Open the local URL shown by Vite (commonly `http://localhost:5173`).

## Scripts

```bash
pnpm dev        # start dev server
pnpm build      # type-check and build for production
pnpm preview    # preview production build
pnpm test       # run tests in watch mode
pnpm test:run   # run tests once
```

## How to Use

1. Paste text into **Input** or upload a file.
2. Choose a conversion tool from the toolbar.
3. Optional: open **Privacy** to scan and redact sensitive data.
4. Click **Convert** to generate output.
5. Use **Copy** or **Download** from the Output panel.

## Project Structure

```text
src/
  components/              UI panels and controls
  features/
    convert/               conversion + formatting logic
    redact/                detection/redaction logic
  styles/                  theme, layout, component styles
  App.vue                  main app composition
```

## Testing

```bash
pnpm test:run
```

The project includes unit tests for conversion/redaction logic and integration tests for main app flows.

## License

MIT. See [LICENSE](./LICENSE).
