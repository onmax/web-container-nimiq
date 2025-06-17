<script setup lang="ts">
import { ref } from 'vue'
import * as Nimiq from '@nimiq/core/web'

const isConnecting = ref(false)
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const output = ref<string[]>([])
const nimiqClient = ref<any>(null)

function addOutput(message: string) {
  output.value.push(message)
}

function clearOutput() {
  output.value = []
}

async function syncWithNimiq() {
  if (isConnecting.value) return

  try {
    isConnecting.value = true
    connectionStatus.value = 'connecting'

    addOutput('🔄 Starting Nimiq web client sync...')
    addOutput('')

    // Dynamically import Nimiq Core
    addOutput('📦 Loading Nimiq Core...')
    await Nimiq.default()
    addOutput('✅ Nimiq Core loaded successfully')

    // Configure client for TestAlbatross network
    addOutput('⚙️ Configuring client for TestAlbatross network...')
    const config = new Nimiq.ClientConfiguration()
    config.network('TestAlbatross')
    config.seedNodes(['/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss'])
    config.logLevel('info')

    // Create client
    addOutput('🌐 Creating Nimiq client...')
    const client = await Nimiq.Client.create(config.build())
    addOutput('✅ Client created successfully')

    addOutput('⏳ Waiting for consensus to be established...')

    // Wait for consensus
    await client.waitForConsensusEstablished()
    addOutput('✅ Consensus established!')

    // Get network information
    const networkId = await client.getNetworkId()
    const headBlock = await client.getHeadBlock()

    addOutput('')
    addOutput(`🌐 Network: ${networkId}`)
    addOutput(`📈 Current block height: ${headBlock.height}`)
    addOutput(`🔗 Head block hash: ${headBlock.hash}`)
    addOutput('')

    connectionStatus.value = 'connected'
    addOutput('🎉 Successfully synced with Nimiq web client!')
    addOutput('✨ You are now connected to the TestAlbatross network')

    // Set up listeners for real-time updates
    addOutput('🔔 Setting up real-time listeners...')

    // Listen for new blocks
    client.addHeadChangedListener(async (blockHash: string) => {
      try {
        const block = await client.getBlock(blockHash)
        addOutput(`🆕 New block: #${block.height} (${block.hash})`)
      } catch (error: any) {
        addOutput(`⚠️ Error getting block details: ${error.message}`)
      }
    })

    // Listen for peer changes
    client.addPeerChangedListener((_peerId: string, _reason: string, peerCount: number) => {
      addOutput(`👥 Peer count updated: ${peerCount} peers`)
    })

    addOutput('✅ Real-time listeners activated')
    addOutput('🔄 Monitoring network for new blocks and peer changes...')

    // Store client reference
    nimiqClient.value = client

  } catch (error: any) {
    connectionStatus.value = 'error'
    const errorMsg = `Sync failed: ${error.message}`
    addOutput(`❌ ${errorMsg}`)
    console.error('Sync error:', error)
  } finally {
    isConnecting.value = false
  }
}

async function disconnect() {
  if (nimiqClient.value) {
    try {
      addOutput('🛑 Disconnecting from Nimiq network...')
      await nimiqClient.value.disconnectNetwork()
      nimiqClient.value = null
      connectionStatus.value = 'disconnected'
      addOutput('✅ Disconnected successfully')
    } catch (error: any) {
      addOutput(`⚠️ Error during disconnect: ${error.message}`)
    }
  }
}

function getStatusColor() {
  switch (connectionStatus.value) {
    case 'connected': return '#22c55e'
    case 'connecting': return '#f59e0b'
    case 'error': return '#ef4444'
    default: return '#6b7280'
  }
}

function getStatusText() {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting...'
    case 'error': return 'Error'
    default: return 'Disconnected'
  }
}
</script>

<template>
  <!-- Nimiq Sync Section -->
  <div class="nimiq-section">
    <h2>🌐 Nimiq Network Sync</h2>

    <div class="status-bar">
      <span class="status-indicator" :style="{ backgroundColor: getStatusColor() }"></span>
      <span class="status-text">{{ getStatusText() }}</span>
    </div>

    <div class="controls">
      <button type="button" @click="syncWithNimiq" :disabled="isConnecting || connectionStatus === 'connected'"
        class="sync-btn">
        {{ isConnecting ? '🔄 Connecting...' : '🚀 Sync with Nimiq' }}
      </button>

      <button type="button" @click="disconnect" :disabled="connectionStatus !== 'connected'" class="disconnect-btn">
        🛑 Disconnect
      </button>

      <button type="button" @click="clearOutput" class="clear-btn">
        🗑️ Clear Output
      </button>
    </div>

    <div class="output-container">
      <div class="output-content">
        <div v-for="(line, index) in output" :key="index" class="output-line">
          {{ line }}
        </div>
        <div v-if="output.length === 0" class="placeholder">
          Click "Sync with Nimiq" to connect to the TestAlbatross network
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.nimiq-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.nimiq-section h2 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.status-bar {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-text {
  font-weight: 500;
  color: #374151;
}

.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.sync-btn,
.disconnect-btn,
.clear-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-btn {
  background: #3b82f6;
  color: white;
}

.sync-btn:hover:not(:disabled) {
  background: #2563eb;
}

.sync-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.disconnect-btn {
  background: #ef4444;
  color: white;
}

.disconnect-btn:hover:not(:disabled) {
  background: #dc2626;
}

.disconnect-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.clear-btn {
  background: #6b7280;
  color: white;
}

.clear-btn:hover {
  background: #4b5563;
}

.output-container {
  background: #1f2937;
  border-radius: 6px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.output-content {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.output-line {
  color: #f3f4f6;
  margin: 0;
  white-space: pre-wrap;
}

.placeholder {
  color: #9ca3af;
  font-style: italic;
}

/* Scrollbar styling */
.output-container::-webkit-scrollbar {
  width: 6px;
}

.output-container::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 3px;
}

.output-container::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 3px;
}

.output-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
