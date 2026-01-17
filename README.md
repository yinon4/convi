# Convi - File Converter

A powerful, client-side file converter built with React, TypeScript, and Vite.

## Features

- **Text Conversion**: TXT, HTML, MD
- **Data Conversion**: JSON, CSV, XML, TSV
- **Image Conversion**: JPG, PNG, WEBP, BMP, ICO, GIF
- **Privacy Focused**: All conversions happen locally in your browser.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## Technologies Used

- **React 19**
- **Vite**
- **Tailwind CSS & DaisyUI**
- **browser-image-compression** (Image processing)
- **Vitest** (Testing)
  import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
