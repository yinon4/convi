# Convi - File Converter

A powerful, client-side file converter built with React, TypeScript, and Vite.

## Features

- **Document Conversion**: PDF, DOCX, TXT, HTML
- **Data Conversion**: JSON, CSV, XML
- **Image Conversion**: JPG, PNG, WEBP, BMP, GIF, ICO
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
- **jsPDF** & **html2pdf.js** (PDF generation)
- **mammoth** & **docx** (DOCX processing)
- **pdfjs-dist** (PDF reading)
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
