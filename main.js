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
      contents: `import * as Nimiq from '@nimiq/core'

console.log('🚀 Starting Nimiq Core v2 test...')

try {
  console.log('📦 Initializing Nimiq Core...')
  
  // Initialize Nimiq Core
  await Nimiq.default()
  console.log('✅ Nimiq Core initialized successfully')
  
  console.log('🌐 Setting up network configuration...')
  
  // Configure for testnet
  const config = new Nimiq.ClientConfiguration()
  config.network('testalbatross')
  config.seedNodes([
    '/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss',
    '/dns4/seed2.pos.nimiq-testnet.com/tcp/8443/wss',
    '/dns4/seed3.pos.nimiq-testnet.com/tcp/8443/wss',
    '/dns4/seed4.pos.nimiq-testnet.com/tcp/8443/wss',
  ])
  config.syncMode('pico')
  
  console.log('📊 Creating Nimiq client...')
  console.log('Config:', config.build())
  
  // Create client with timeout (30 seconds)
  const client = await Promise.race([
    Nimiq.Client.create(config.build()),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Client creation timeout after 30s')), 30000)
    )
  ])
  
  console.log('✅ Nimiq client created successfully')
  console.log('📊 Client type:', typeof client)
  
  // Get initial network info
  console.log('🔗 Getting network information...')
  const networkId = await client.getNetworkId()
  console.log('🌐 Network ID:', networkId)
  
  const headBlock = await client.getHeadBlock()
  console.log('📈 Current block height:', headBlock.height)
  console.log('🔗 Head block hash:', headBlock.hash)
  console.log('⏰ Head block timestamp:', new Date(headBlock.timestamp * 1000).toISOString())
  
  // Add consensus listener
  let consensusEstablished = false
  client.addConsensusChangedListener((consensus) => {
    console.log('📊 Consensus state changed:', consensus)
    if (consensus === 'established') {
      consensusEstablished = true
    }
  })
  
  // Add peer listener
  client.addPeerChangedListener((peerId, reason, peerCount) => {
    console.log('👥 Peer count changed:', peerCount)
  })
  
  // Add head changed listener
  client.addHeadChangedListener(async (blockHash) => {
    const block = await client.getBlock(blockHash)
    console.log('🆕 New head block:', block.height, 'hash:', block.hash)
  })
  
  // Wait for consensus to be established (with timeout)
  console.log('⏳ Waiting for consensus to be established...')
  const consensusTimeout = 60000 // 60 seconds
  const startTime = Date.now()
  
  while (!consensusEstablished && (Date.now() - startTime) < consensusTimeout) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('⏳ Still waiting for consensus... (' + Math.floor((Date.now() - startTime) / 1000) + 's)')
  }
  
  if (consensusEstablished) {
    console.log('🎯 Consensus established!')
    
    // Get updated network info
    const finalHeadBlock = await client.getHeadBlock()
    console.log('📈 Final block height:', finalHeadBlock.height)
    console.log('🔗 Final head block hash:', finalHeadBlock.hash)
  } else {
    console.log('⚠️  Consensus not established within timeout, but client is working')
  }
  
  console.log('🎉 Nimiq Core v2 test completed successfully!')
  
  // Cleanup
  console.log('🧹 Cleaning up...')
  await client.disconnectNetwork()
  
} catch (error) {
  console.error('❌ Error during Nimiq test:', error)
  console.error('Stack:', error.stack)
  process.exit(1)
}
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
const bootBtn = document.getElementById('bootBtn')
const installBtn = document.getElementById('installBtn')
const runNimiqBtn = document.getElementById('runNimiqBtn')
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

// WebContainer operations
async function bootWebContainer() {
  try {
    updateStatus('Booting WebContainer...', 'info')
    addOutput('🚀 Starting WebContainer boot process...')
    
    // Boot WebContainer
    webcontainerInstance = await WebContainer.boot()
    addOutput('✅ WebContainer booted successfully')
    
    // Mount files
    addOutput('📁 Mounting project files...')
    await webcontainerInstance.mount(files)
    addOutput('✅ Files mounted successfully')
    
    // Listen for process outputs
    webcontainerInstance.on('server-ready', (port, url) => {
      addOutput(`🌐 Server ready on port ${port}: ${url}`)
    })
    
    updateStatus('WebContainer ready!', 'success')
    bootBtn.disabled = true
    installBtn.disabled = false
    
  } catch (error) {
    const errorMsg = `Failed to boot WebContainer: ${error.message}`
    updateStatus(errorMsg, 'error')
    addOutput(`❌ ${errorMsg}`)
    console.error(error)
  }
}

async function installDependencies() {
  if (!webcontainerInstance) {
    updateStatus('WebContainer not ready', 'error')
    return
  }
  
  try {
    updateStatus('Installing dependencies...', 'info')
    addOutput('📦 Installing dependencies...')
    
    // Use npm directly instead of pnpm to avoid global installation issues
    addOutput('📥 Installing project dependencies with npm...')
    const installProcess = await webcontainerInstance.spawn('npm', ['install'])
    
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        addOutput(data)
      }
    }))
    
    const exitCode = await installProcess.exit
    if (exitCode !== 0) {
      throw new Error(`Dependencies installation failed with exit code ${exitCode}`)
    }
    
    addOutput('✅ Dependencies installed successfully')
    updateStatus('Dependencies installed!', 'success')
    installBtn.disabled = true
    runNimiqBtn.disabled = false
    
  } catch (error) {
    const errorMsg = `Failed to install dependencies: ${error.message}`
    updateStatus(errorMsg, 'error')
    addOutput(`❌ ${errorMsg}`)
    console.error(error)
  }
}

async function runNimiqTest() {
  if (!webcontainerInstance) {
    updateStatus('WebContainer not ready', 'error')
    return
  }
  
  try {
    updateStatus('Running Nimiq test...', 'info')
            addOutput('🧪 Starting Nimiq Core v2 test...')
    
    const testProcess = await webcontainerInstance.spawn('npm', ['run', 'dev'])
    
    testProcess.output.pipeTo(new WritableStream({
      write(data) {
        addOutput(data)
      }
    }))
    
    const exitCode = await testProcess.exit
    if (exitCode === 0) {
      updateStatus('Nimiq test completed successfully!', 'success')
      addOutput('🎉 Test completed successfully!')
    } else {
      updateStatus(`Nimiq test failed with exit code ${exitCode}`, 'error')
      addOutput(`❌ Test failed with exit code ${exitCode}`)
    }
    
  } catch (error) {
    const errorMsg = `Failed to run Nimiq test: ${error.message}`
    updateStatus(errorMsg, 'error')
    addOutput(`❌ ${errorMsg}`)
    console.error(error)
  }
}

// Event listeners
bootBtn.addEventListener('click', bootWebContainer)
installBtn.addEventListener('click', installDependencies)
runNimiqBtn.addEventListener('click', runNimiqTest)
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
    bootBtn.disabled = true
  }
}

// Run the check when the page loads
checkWebContainerSupport() 
