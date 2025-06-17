import { WebContainer } from '@webcontainer/api'

// Files to mount in the WebContainer
const files = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'nimiq-webcontainer-test',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'node nimiq-test.js'
        },
        dependencies: {
          '@nimiq/core': '^2.0.0'
        }
      }, null, 2)
    }
  },
  'nimiq-test.js': {
    file: {
      contents: `console.log('🚀 Starting Nimiq Node Sync...')

async function syncWithNimiq() {
  try {
    // Dynamically import Nimiq Core (required for WASM modules)
    console.log('📦 Loading Nimiq Core...')
    const Nimiq = await import('@nimiq/core')
    console.log('✅ Nimiq Core loaded')
    
    // Configure client for TestAlbatross network
    const config = new Nimiq.ClientConfiguration()
    config.network('testalbatross')
    config.logLevel('info')
    
    // Create client
    console.log('🌐 Creating Nimiq client...')
    const client = await Nimiq.Client.create(config.build())
    console.log('✅ Client created')
    
    // Wait for consensus to be established
    console.log('⏳ Waiting for consensus...')
    await client.waitForConsensusEstablished()
    console.log('✅ Consensus established')
    
    // Get network info
    const networkId = await client.getNetworkId()
    const headBlock = await client.getHeadBlock()
    
    console.log(\`🌐 Network: \${networkId}\`)
    console.log(\`📈 Current block height: \${headBlock.height}\`)
    console.log(\`🔗 Head block hash: \${headBlock.hash}\`)
    
    // Listen for consensus changes
    client.addConsensusChangedListener((consensus) => {
      console.log(\`📊 Consensus: \${consensus}\`)
    })
    
    // Listen for new blocks
    client.addHeadChangedListener(async (blockHash) => {
      const block = await client.getBlock(blockHash)
      console.log(\`🆕 New block: #\${block.height} (\${block.hash})\`)
    })
    
    // Listen for peer changes
    client.addPeerChangedListener((peerId, reason, peerCount) => {
      console.log(\`👥 Peers: \${peerCount}\`)
    })
    
    console.log('🔄 Syncing with network... (Press Ctrl+C to stop)')
    
    // Keep the process running in WebContainer context
    let running = true
    
    // Simulate SIGINT handler for WebContainer
    const cleanup = async () => {
      console.log('\\n🛑 Shutting down...')
      running = false
      try {
        await client.disconnectNetwork()
      } catch (e) {
        console.log('⚠️ Cleanup completed with warnings')
      }
    }
    
    // Keep alive with proper exit handling
    let iterations = 0
    while (running && iterations < 300) { // Run for max 5 minutes
      await new Promise(resolve => setTimeout(resolve, 1000))
      iterations++
      
      // Auto-cleanup after 5 minutes to prevent infinite running in WebContainer
      if (iterations >= 300) {
        console.log('\\n⏰ Timeout reached, shutting down...')
        await cleanup()
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

syncWithNimiq()
`
    }
  },
  'pnpm-workspace.yaml': {
    file: {
      contents: `packages:
  - .
`
    }
  }
}

let webcontainerInstance = null

// DOM elements
const statusEl = document.getElementById('status')
const outputEl = document.getElementById('output')
const startTestBtn = document.getElementById('startTestBtn')
const clearBtn = document.getElementById('clearBtn')

// Utility functions
function updateStatus(message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

function addOutput(text) {
  outputEl.textContent += text + '\n'
  outputEl.scrollTop = outputEl.scrollHeight
}

function clearOutput() {
  outputEl.textContent = ''
}

// Combined function to run all operations
async function runCompleteNimiqTest() {
  if (startTestBtn.disabled) return
  
  try {
    // Disable the button during execution
    startTestBtn.disabled = true
    startTestBtn.textContent = 'Running...'
    
    addOutput('🚀 Starting complete Nimiq test process...')
    addOutput('')
    
    // Step 1: Boot WebContainer
    updateStatus('Booting WebContainer...', 'info')
    addOutput('🚀 Step 1: Starting WebContainer boot process...')
    
    webcontainerInstance = await WebContainer.boot()
    addOutput('✅ WebContainer booted successfully')
    
    addOutput('📁 Mounting project files...')
    await webcontainerInstance.mount(files)
    addOutput('✅ Files mounted successfully')
    
    webcontainerInstance.on('server-ready', (port, url) => {
      addOutput(`🌐 Server ready on port ${port}: ${url}`)
    })
    
    addOutput('')
    
    // Step 2: Install Dependencies
    updateStatus('Installing dependencies...', 'info')
    addOutput('📦 Step 2: Installing dependencies...')
    addOutput('📥 Installing project dependencies with npm...')
    
    const installProcess = await webcontainerInstance.spawn('npm', ['install'])
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        addOutput(data)
      }
    }))
    
    const installExitCode = await installProcess.exit
    if (installExitCode !== 0) {
      throw new Error(`Dependencies installation failed with exit code ${installExitCode}`)
    }
    
    addOutput('✅ Dependencies installed successfully')
    addOutput('')
    
    // Step 3: Run Nimiq Test
    updateStatus('Running Nimiq test...', 'info')
    addOutput('🧪 Step 3: Starting Nimiq Core v2 test...')
    
    const testProcess = await webcontainerInstance.spawn('npm', ['run', 'dev'])
    
    testProcess.output.pipeTo(new WritableStream({
      write(data) {
        addOutput(data)
      }
    }))
    
    const testExitCode = await testProcess.exit
    if (testExitCode === 0) {
      updateStatus('Nimiq test completed successfully!', 'success')
      addOutput('🎉 Complete test process finished successfully!')
    } else {
      updateStatus(`Nimiq test failed with exit code ${testExitCode}`, 'error')
      addOutput(`❌ Test failed with exit code ${testExitCode}`)
    }
    
  } catch (error) {
    const errorMsg = `Failed during test process: ${error.message}`
    updateStatus(errorMsg, 'error')
    addOutput(`❌ ${errorMsg}`)
    console.error(error)
  } finally {
    // Re-enable the button
    startTestBtn.disabled = false
    startTestBtn.textContent = 'Start Nimiq Test'
  }
}

// Event listeners
startTestBtn.addEventListener('click', runCompleteNimiqTest)
clearBtn.addEventListener('click', clearOutput)

// Diagnostic function to check browser capabilities
function runDiagnostics() {
  addOutput('🔍 Running WebContainer diagnostics...')
  
  // Check browser
  addOutput(`📱 User Agent: ${navigator.userAgent}`)
  
  // Check secure context
  if (window.isSecureContext) {
    addOutput('✅ Secure context (HTTPS/localhost): Yes')
  } else {
    addOutput('❌ Secure context (HTTPS/localhost): No - WebContainer requires HTTPS or localhost')
  }
  
  // Check SharedArrayBuffer
  if (typeof SharedArrayBuffer !== 'undefined') {
    addOutput('✅ SharedArrayBuffer: Available')
  } else {
    addOutput('❌ SharedArrayBuffer: Not available - required for WebContainer')
  }
  
  // Check CORS headers
  addOutput('🌐 CORS headers should be:')
  addOutput('   Cross-Origin-Embedder-Policy: require-corp')
  addOutput('   Cross-Origin-Opener-Policy: same-origin')
  
  // Check WebAssembly
  if (typeof WebAssembly !== 'undefined') {
    addOutput('✅ WebAssembly: Available')
  } else {
    addOutput('❌ WebAssembly: Not available')
  }
  
  // Check if we're in an iframe
  if (window.top !== window.self) {
    addOutput('⚠️  Running in iframe - this may cause issues')
  } else {
    addOutput('✅ Not in iframe')
  }
}

// Initial check for WebContainer support
async function checkWebContainerSupport() {
  runDiagnostics()
  
  try {
    // Check if WebContainer import worked
    if (typeof WebContainer === 'undefined') {
      throw new Error('WebContainer import failed - module not loaded correctly')
    }
    
    // Check for required browser features
    if (!window.SharedArrayBuffer) {
      throw new Error('SharedArrayBuffer not available - required for WebContainer')
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      throw new Error('WebContainer requires a secure context (HTTPS or localhost)')
    }
    
    updateStatus('WebContainer API available - ready to start!', 'success')
    addOutput('✅ WebContainer API is available and ready!')
    
  } catch (error) {
    updateStatus(`WebContainer not supported: ${error.message}`, 'error')
    addOutput(`❌ WebContainer check failed: ${error.message}`)
    addOutput('')
    addOutput('🛠️  Troubleshooting steps:')
    addOutput('1. Ensure you are using Chrome, Firefox, or Edge (latest version)')
    addOutput('2. Make sure you are accessing via localhost or HTTPS')
    addOutput('3. Try opening in a new tab (not iframe)')
    addOutput('4. Disable browser extensions temporarily')
    addOutput('5. Check browser console for additional errors')
    startTestBtn.disabled = true
  }
}

// Run the check when the page loads
checkWebContainerSupport() 
