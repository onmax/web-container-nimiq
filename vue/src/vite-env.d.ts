/// <reference types="vite/client" />

declare module '@nimiq/core' {
  export class Client {
    static create(config: any): Promise<Client>
    waitForConsensusEstablished(): Promise<void>
    getNetworkId(): Promise<string>
    getHeadBlock(): Promise<any>
    getBlock(hash: string): Promise<any>
    addHeadChangedListener(callback: (blockHash: string) => void): void
    addPeerChangedListener(callback: (peerId: string, reason: string, peerCount: number) => void): void
    disconnectNetwork(): Promise<void>
  }
  
  export class ClientConfiguration {
    network(name: string): void
    seedNodes(nodes: string[]): void
    logLevel(level: string): void
    build(): any
  }
}
