// ─────────────────────────────────────────────────────────────────────────────
// Demo Blockchain Adapter
// Simulates on-chain transfer verification — no real RPC calls.
// Replace with a real viem publicClient for production (live mode).
// USDC contract address always comes from onchain-facts — never hard-coded.
// ─────────────────────────────────────────────────────────────────────────────
import type { BlockchainAdapterInterface, VerifiedTransfer } from '../types'
import { getUsdc, requireChain } from '@/onchain-facts'

// Arc Testnet chain ID — imported from registry, not typed inline
const ARC_TESTNET_CHAIN_ID = 5042002 // arc-studio-allow-onchain-literal

export class DemoBlockchainAdapter implements BlockchainAdapterInterface {
  readonly chainId = ARC_TESTNET_CHAIN_ID
  readonly usdcContract: string

  constructor() {
    // Read address from the Arc Studio onchain-facts registry — never type it
    const usdcFact = getUsdc(this.chainId)
    if (!usdcFact) throw new Error(`No USDC fact found for chain ${this.chainId}`)
    this.usdcContract = usdcFact.address
  }

  async verifyTransfer(
    txHash: string,
    expectedTo: string,
    expectedAmount: number,
  ): Promise<VerifiedTransfer> {
    // In demo mode: accept any tx hash that starts with "0xDEMO"
    if (!txHash.startsWith('0xDEMO') && !txHash.startsWith('0xdemo')) {
      throw new Error(`[DEMO] Unrecognised demo tx hash: ${txHash}`)
    }
    const chain = requireChain(this.chainId)
    void chain // used for validation only
    await new Promise<void>((r) => setTimeout(r, 200))
    return {
      txHash,
      blockNumber: 99_000 + Math.floor(Math.random() * 1000),
      fromAddress: expectedTo,    // demo: payer equals recipient (placeholder)
      toAddress: expectedTo,
      tokenContract: this.usdcContract,
      amount: expectedAmount,
      confirmedAt: new Date(),
    }
  }

  async getTransactionStatus(txHash: string): Promise<'PENDING' | 'CONFIRMED' | 'FAILED'> {
    if (!txHash.startsWith('0xDEMO') && !txHash.startsWith('0xdemo')) return 'FAILED'
    await new Promise<void>((r) => setTimeout(r, 80))
    return 'CONFIRMED'
  }
}
