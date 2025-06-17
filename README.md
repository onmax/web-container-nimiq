# Nimiq Core v2 Issue Reproduction

This repository demonstrates a compatibility issue between Nimiq Core v2 and different JavaScript environments, specifically comparing behavior between Node.js and WebContainer environments.

## Issue Description

The reproduction showcases potential differences in how Nimiq Core v2 behaves when running in:
1. **Node.js environment** (traditional server-side execution)
2. **WebContainer environment** (browser-based Node.js simulation)

### Key Differences Observed

- **Import mechanisms**: Different module loading strategies between environments
- **Event listener APIs**: Potential discrepancies in event handling (`addEventListener` vs node-style event listeners)
- **WASM initialization**: Different WebAssembly loading behaviors
- **Network connectivity**: Varying peer discovery and consensus establishment patterns

## Project Structure

```
web-container/
├── index.html              # WebContainer test UI
├── main.js                 # WebContainer implementation
├── package.json            # WebContainer dependencies
├── vite.config.js          # Vite configuration
└── template/
    ├── index.js            # Node.js implementation
    ├── package.json        # Node.js dependencies
    └── pnpm-lock.yaml      # Node.js lockfile
```

## Prerequisites

- **Node.js** 18+ (for Node.js test)
- **pnpm** (for Node.js dependencies)
- **Modern browser** with WASM support (for WebContainer test)
- Active internet connection (for Nimiq TestAlbatross network)

## Running the Node.js Test

The Node.js implementation demonstrates the traditional server-side approach:

```bash
# Navigate to template directory
cd template

# Install dependencies
pnpm install

# Run the test
pnpm run dev
```

### Expected Node.js Behavior

The Node.js version should:
- ✅ Load Nimiq Core successfully
- ✅ Create and configure the client
- ✅ Establish consensus with TestAlbatross network
- ✅ Listen for network events (new blocks, peer changes)
- ✅ Handle graceful shutdown on Ctrl+C

### Common Node.js Issues

If you encounter errors, they might include:
- `init is not a function` - Incorrect import syntax
- `addEventListener is not defined` - Browser API used in Node.js context
- Network connectivity issues - Firewall or network restrictions

## Running the WebContainer Test

The WebContainer implementation runs Node.js code in a browser environment:

```bash
# From the root directory
pnpm install

# Start the development server
pnpm run dev
```

Then:
1. Open your browser to the displayed URL (typically `http://localhost:5173`)
2. Click "Start Nimiq Test" button
3. Monitor the output console

### Expected WebContainer Behavior

The WebContainer version should:
- ✅ Boot WebContainer successfully
- ✅ Install dependencies in the virtual environment
- ✅ Load Nimiq Core within WebContainer
- ✅ Demonstrate the same network functionality as Node.js
- ⏰ Auto-terminate after 5 minutes to prevent infinite running

### Common WebContainer Issues

WebContainer-specific challenges may include:
- WASM loading differences in virtualized environment
- Network restrictions due to browser security policies
- Memory limitations compared to native Node.js
- Event system differences

## Key Implementation Differences

### Import Strategy

**Node.js** (template/index.js):
```javascript
const Nimiq = await import('@nimiq/core')
```

**WebContainer** (via main.js):
```javascript
// Same import, but runs in virtualized Node.js environment
const Nimiq = await import('@nimiq/core')
```

### Event Handling

Both implementations use the same Nimiq event listeners:
```javascript
client.addConsensusChangedListener((consensus) => { ... })
client.addHeadChangedListener(async (blockHash) => { ... })
client.addPeerChangedListener((peerId, reason, peerCount) => { ... })
```

### Process Management

**Node.js**:
```javascript
process.on('SIGINT', async () => {
  await client.disconnectNetwork()
  process.exit(0)
})
```

**WebContainer**:
```javascript
// Timeout-based cleanup to prevent infinite running
let iterations = 0
while (running && iterations < 300) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  iterations++
}
```

## Troubleshooting

### Network Issues
- Ensure your firewall allows WebRTC connections
- Check that the TestAlbatross network is accessible
- Try running with different log levels (`debug`, `info`, `warn`)

### WASM Issues
- Verify your browser supports WebAssembly
- Check browser console for WASM-related errors
- Ensure proper CORS headers are set for WebContainer

### Memory Issues
- Monitor browser memory usage during WebContainer execution
- Consider reducing consensus timeout for testing
- Clear browser cache if experiencing loading issues

## Expected Output

Both environments should produce similar output:

```
🚀 Starting Nimiq Node Sync...
📦 Loading Nimiq Core...
✅ Nimiq Core loaded
🌐 Creating Nimiq client...
✅ Client created
⏳ Waiting for consensus...
✅ Consensus established
🌐 Network: TestAlbatross
📈 Current block height: [HEIGHT]
🔗 Head block hash: [HASH]
🔄 Syncing with network...
👥 Peers: [COUNT]
🆕 New block: #[HEIGHT] ([HASH])
```

## Development Notes

- Both implementations use Nimiq Core v2 with TestAlbatross network
- WebContainer has additional safety mechanisms to prevent infinite execution
- The issue reproduction helps identify environment-specific compatibility problems
- Event listeners and network APIs should behave consistently across environments

## Contributing

If you encounter different behaviors between Node.js and WebContainer environments, please:

1. Document the specific differences observed
2. Include console output from both environments
3. Note your browser version and Node.js version
4. Describe network configuration if relevant

This reproduction case helps ensure Nimiq Core v2 works consistently across different JavaScript execution environments. 
