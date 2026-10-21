// ─────────────────────────────────────────────────────────────────────────────
// Demo Fulfillment Adapter
// Simulates USDC delivery — no real transaction is broadcast.
// Replace with a live hot-wallet signer for production.
// ─────────────────────────────────────────────────────────────────────────────
import type { FulfillmentProviderAdapter, FulfillmentResult } from '../types'

interface DemoTx {
  txHash: string
  status: FulfillmentResult['status']
  submittedAt: Date
  confirmedAt?: Date
}

const demoTxs = new Map<string, DemoTx>()

function makeDemoTxHash(): string {
  // Clearly demo — not a real 32-byte hash
  return `0xDEMO${Date.now().toString(16).padStart(56, '0').slice(0, 60)}`
}

export class DemoFulfillmentAdapter implements FulfillmentProviderAdapter {
  readonly name = 'demo'

  async sendUsdc(params: {
    toAddress: string
    usdcAmount: number
    intentId: string
  }): Promise<FulfillmentResult> {
    // Validate address format
    if (!/^0x[0-9a-fA-F]{40}$/.test(params.toAddress)) {
      throw new Error('Invalid recipient address')
    }
    if (params.usdcAmount <= 0) {
      throw new Error('Amount must be positive')
    }

    const txHash = makeDemoTxHash()
    const submittedAt = new Date()

    const tx: DemoTx = { txHash, status: 'SUBMITTED', submittedAt }
    demoTxs.set(txHash, tx)

    // Simulate confirmation after 2 s
    setTimeout(() => {
      const t = demoTxs.get(txHash)
      if (t) {
        t.status = 'CONFIRMED'
        t.confirmedAt = new Date()
      }
    }, 2000)

    await new Promise<void>((r) => setTimeout(r, 150))

    return {
      provider: this.name,
      txHash,
      status: 'SUBMITTED',
      submittedAt,
    }
  }

  getStatus(txHash: string): Promise<{ status: FulfillmentResult['status']; confirmedAt?: Date }> {
    const tx = demoTxs.get(txHash)
    if (!tx) return Promise.resolve({ status: 'FAILED' as const })
    return Promise.resolve({ status: tx.status, confirmedAt: tx.confirmedAt })
  }
}
