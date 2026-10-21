// ─────────────────────────────────────────────────────────────────────────────
// Demo Payment Adapter
// Simulates QRIS checkout sessions in-memory.
// NEVER processes real payments — all sessions are simulated.
// Replace with Midtrans / Xendit / etc. for production.
// ─────────────────────────────────────────────────────────────────────────────
import type { PaymentProviderAdapter, PaymentSessionResult, PaymentStatusResult } from '../types'

interface DemoSession {
  sessionId: string
  idrAmount: number
  status: PaymentStatusResult['status']
  expiresAt: Date
  createdAt: Date
}

// In-memory session store — reset on page reload, no persistence
const sessions = new Map<string, DemoSession>()

function makeDemoSessionId(): string {
  return `demo-sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export class DemoPaymentAdapter implements PaymentProviderAdapter {
  readonly name = 'demo'

  async createSession(params: {
    intentId: string
    idrAmount: number
    description: string
    expiresAt: Date
  }): Promise<PaymentSessionResult> {
    const sessionId = makeDemoSessionId()
    sessions.set(sessionId, {
      sessionId,
      idrAmount: params.idrAmount,
      status: 'PENDING',
      expiresAt: params.expiresAt,
      createdAt: new Date(),
    })
    // Simulate short network latency
    await new Promise<void>((r) => setTimeout(r, 80))
    return {
      provider: this.name,
      sessionId,
      expiresAt: params.expiresAt,
      // No real QRIS payload in demo — UI will show a placeholder SVG
    }
  }

  getStatus(sessionId: string): Promise<PaymentStatusResult> {
    const session = sessions.get(sessionId)
    if (!session) {
      return Promise.resolve({ sessionId, status: 'FAILED' as const })
    }
    if (session.expiresAt < new Date() && session.status === 'PENDING') {
      session.status = 'EXPIRED'
    }
    return Promise.resolve({
      sessionId,
      status: session.status,
      paidAmount: session.status === 'CONFIRMED' ? session.idrAmount : undefined,
      confirmedAt: session.status === 'CONFIRMED' ? new Date() : undefined,
    })
  }

  /**
   * Demo-only: simulate a successful payment for a session.
   * Called by the "Simulate Payment" button in the UI.
   */
  simulatePayment(sessionId: string): void {
    const session = sessions.get(sessionId)
    if (session && session.status === 'PENDING') {
      session.status = 'CONFIRMED'
    }
  }

  /** In demo mode, no real webhook signature — always returns true */
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true
  }

  parseWebhookEvent(payload: string): PaymentStatusResult {
    // Demo webhook shape: { sessionId, status }
    try {
      const data = JSON.parse(payload) as { sessionId?: string; status?: string }
      return {
        sessionId: data.sessionId ?? '',
        status: (data.status ?? 'FAILED') as PaymentStatusResult['status'],
      }
    } catch {
      return { sessionId: '', status: 'FAILED' }
    }
  }
}
