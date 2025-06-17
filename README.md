# WebContainer + Nimiq Web Client Reproduction

This is a minimal reproduction case for testing WebContainers with pnpm package manager and the Nimiq web client with consensus functionality.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the displayed URL (usually `http://localhost:5173`)

## Important Notes

- **HTTPS Required**: WebContainers require HTTPS in production. For local development, the Vite dev server should work.
- **CORS Headers**: The application sets required CORS headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`) for WebContainer support.
- **Browser Support**: Modern browsers only (Chrome, Firefox, Edge, Safari).

## What This Demonstrates

1. **WebContainer Boot**: Initializes a browser-based Node.js runtime
2. **pnpm Integration**: Installs pnpm and uses it to manage dependencies
3. **Nimiq Web Client**: Loads and tests the Nimiq web client with consensus functionality

## Usage

1. Click "Boot WebContainer" to initialize the container
2. Click "Install Dependencies" to install pnpm and project dependencies
3. Click "Run Nimiq Example" to test the Nimiq web client

## Expected Behavior

The reproduction should:
- Successfully boot a WebContainer
- Install pnpm and the Nimiq web client
- Create a Nimiq client instance with light consensus
- Connect to the Nimiq testnet
- Display network information (network ID, block number)

## Troubleshooting

- If WebContainer fails to boot, ensure you're using HTTPS or a local dev server
- If Nimiq client fails, check browser console for WebAssembly/network errors
- Ensure your browser supports WebAssembly and SharedArrayBuffer

## Technical Details

- **WebContainer**: Browser-based Node.js runtime by StackBlitz
- **Nimiq Web Client**: JavaScript library compiled from Rust to WebAssembly
- **pnpm**: Fast, disk space efficient package manager
- **Consensus**: Light consensus mode for minimal resource usage 
