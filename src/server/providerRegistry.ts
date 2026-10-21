// ─────────────────────────────────────────────────────────────────────────────
// Provider Registry
// Selects the correct adapter based on VITE_*_PROVIDER_MODE env vars.
// Adding a new provider: implement the interface, import here, add a case.
// ─────────────────────────────────────────────────────────────────────────────
import { getConfig } from './types'
import { DemoQuoteAdapter } from './adapters/demoQuoteAdapter'
import { DemoPaymentAdapter } from './adapters/demoPaymentAdapter'
import { DemoFulfillmentAdapter } from './adapters/demoFulfillmentAdapter'
import { DemoBlockchainAdapter } from './adapters/demoBlockchainAdapter'
import type {
  QuoteProviderAdapter,
  PaymentProviderAdapter,
  FulfillmentProviderAdapter,
  BlockchainAdapterInterface,
} from './types'

// Singletons — instantiated once per app session
let _quote: QuoteProviderAdapter | null = null
let _payment: DemoPaymentAdapter | null = null   // typed as Concrete for simulatePayment access
let _fulfillment: FulfillmentProviderAdapter | null = null
let _blockchain: BlockchainAdapterInterface | null = null

export function getQuoteAdapter(): QuoteProviderAdapter {
  if (_quote) return _quote
  const { quoteProviderMode } = getConfig()
  switch (quoteProviderMode) {
    case 'demo':
      _quote = new DemoQuoteAdapter()
      break
    // case 'coingecko': _quote = new CoinGeckoQuoteAdapter(); break
    // case 'binance':   _quote = new BinanceQuoteAdapter(); break
    default:
      console.warn(`[E-PAY] Unknown quote provider mode "${quoteProviderMode}", falling back to demo`)
      _quote = new DemoQuoteAdapter()
  }
  return _quote
}

export function getPaymentAdapter(): DemoPaymentAdapter {
  if (_payment) return _payment
  const { paymentProviderMode } = getConfig()
  switch (paymentProviderMode) {
    case 'demo':
      _payment = new DemoPaymentAdapter()
      break
    // case 'midtrans': _payment = new MidtransPaymentAdapter(); break
    // case 'xendit':   _payment = new XenditPaymentAdapter(); break
    default:
      console.warn(`[E-PAY] Unknown payment provider mode "${paymentProviderMode}", falling back to demo`)
      _payment = new DemoPaymentAdapter()
  }
  return _payment
}

export function getFulfillmentAdapter(): FulfillmentProviderAdapter {
  if (_fulfillment) return _fulfillment
  const { fulfillmentProviderMode } = getConfig()
  switch (fulfillmentProviderMode) {
    case 'demo':
      _fulfillment = new DemoFulfillmentAdapter()
      break
    // case 'hot_wallet': _fulfillment = new HotWalletFulfillmentAdapter(); break
    default:
      console.warn(`[E-PAY] Unknown fulfillment provider mode "${fulfillmentProviderMode}", falling back to demo`)
      _fulfillment = new DemoFulfillmentAdapter()
  }
  return _fulfillment
}

export function getBlockchainAdapter(): BlockchainAdapterInterface {
  if (_blockchain) return _blockchain
  const { arcNetworkMode } = getConfig()
  switch (arcNetworkMode) {
    case 'demo':
      _blockchain = new DemoBlockchainAdapter()
      break
    // case 'live': _blockchain = new ViemBlockchainAdapter(); break
    default:
      console.warn(`[E-PAY] Unknown arc network mode "${arcNetworkMode}", falling back to demo`)
      _blockchain = new DemoBlockchainAdapter()
  }
  return _blockchain
}
