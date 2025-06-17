console.log('🚀 Starting Nimiq Node Sync...')

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
    
    console.log(`🌐 Network: ${networkId}`)
    console.log(`📈 Current block height: ${headBlock.height}`)
    console.log(`🔗 Head block hash: ${headBlock.hash}`)
    
    // Listen for consensus changes
    client.addConsensusChangedListener((consensus) => {
      console.log(`📊 Consensus: ${consensus}`)
    })
    
    // Listen for new blocks
    client.addHeadChangedListener(async (blockHash) => {
      const block = await client.getBlock(blockHash)
      console.log(`🆕 New block: #${block.height} (${block.hash})`)
    })
    
    // Listen for peer changes
    client.addPeerChangedListener((peerId, reason, peerCount) => {
      console.log(`👥 Peers: ${peerCount}`)
    })
    
    console.log('🔄 Syncing with network... (Press Ctrl+C to stop)')
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...')
      await client.disconnectNetwork()
      process.exit(0)
    })
    
    // Keep alive
    setInterval(() => {
      // This keeps the process running
    }, 1000)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

syncWithNimiq() 
