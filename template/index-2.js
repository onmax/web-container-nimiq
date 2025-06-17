import { Address, BufferUtils, Client, ClientConfiguration, KeyPair, PrivateKey, TransactionBuilder } from "@nimiq/core";

let client;

async function connect() {
  console.log('🚀 Starting Nimiq Node Sync...')
  console.log('📦 Loading Nimiq Core...')

  const config = new ClientConfiguration();
  // config.network('TestAlbatross');
  config.network('TestAlbatross');
  config.seedNodes(['/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss']);
  config.logLevel('info');

  console.log('🌐 Creating Nimiq client...')
  client = await Client.create(config.build());
  console.log('✅ Client created')

  console.log('⏳ Waiting for consensus...')
  await client.waitForConsensusEstablished();
  console.log('✅ Consensus established')

  // Get network info
  const networkId = await client.getNetworkId();
  const headBlock = await client.getHeadBlock();

  console.log(`🌐 Network: ${networkId}`)
  console.log(`📈 Current block height: ${headBlock.height}`)
  console.log(`🔗 Head block hash: ${headBlock.hash}`)

  // Listen for consensus changes
  client.addConsensusChangedListener((consensus) => {
    console.log(`📊 Consensus: ${consensus}`)
  });

  // Listen for new blocks
  client.addHeadChangedListener(async (blockHash) => {
    const block = await client.getBlock(blockHash);
    console.log(`🆕 New block: #${block.height} (${block.hash})`)
  });

  // Listen for peer changes
  client.addPeerChangedListener((peerId, reason, peerCount) => {
    console.log(`👥 Peers: ${peerCount}`)
  });

  console.log('🔄 Syncing with network... (Press Ctrl+C to stop)')

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...')
    await client.disconnectNetwork()
    process.exit(0)
  });

  // Keep alive
  setInterval(() => {
    // This keeps the process running
  }, 1000);
}

function toAddress(address) {
  return Address.fromAny(address);
}

async function getAccount(address) {
  return (await client.getAccounts([Address.fromAny(address)]))[0];
}

async function getTransactionByHash(hash) {
  return await client.getTransaction(hash);
}

async function getHeadBlock() {
  return await client.getHeadBlock();
}

async function getNetworkId() {
  return await client.getNetworkId();
}

async function sendExtendedTransaction(to, value, fee = 0, data) {
  // Note: This would require a wallet/keypair to be configured
  // For now, this is just the structure
  throw new Error('Wallet not configured - sendExtendedTransaction requires private key setup');
}

// Start the sync process
async function startSync() {
  try {
    await connect();
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

startSync(); 
