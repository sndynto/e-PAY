import { Wallet, Globe2, Copy, CheckCircle2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const SUPPORTED_CHAINS = [
  { name: 'Arc Testnet', id: 48900, status: 'active', native: 'USDC', rpc: 'https://testnet-rpc.arc.io' },
  { name: 'Arc Mainnet', id: 48899, status: 'inactive', native: 'USDC', rpc: 'https://rpc.arc.io' },
  { name: 'Ethereum Sepolia', id: 11155111, status: 'inactive', native: 'ETH', rpc: '' },
  { name: 'Base Sepolia', id: 84532, status: 'inactive', native: 'ETH', rpc: '' },
]

export function WalletSettingsPage() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-primary tracking-tight mb-1" style={{ letterSpacing: '-0.015em' }}>
            Wallet & Network
          </h1>
          <p className="text-sm text-secondary">Connected wallet and chain settings</p>
        </div>

        {/* Connected wallet */}
        <Card variant="default" padding="none" className="mb-4">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <CardTitle>Connected wallet</CardTitle>
            {isConnected && (
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <Button variant="ghost" size="sm" onClick={show}>Manage</Button>
                )}
              </ConnectKitButton.Custom>
            )}
          </div>

          <div className="border-t border-border px-4 py-4">
            {isConnected && address ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center flex-shrink-0">
                    <Wallet size={13} className="text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-secondary">Connected</p>
                    <p className="mono text-xs text-primary truncate">{address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyAddress} className="text-secondary/40 hover:text-secondary transition-colors" aria-label="Copy">
                      {copied ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
                    </button>
                    <a
                      href={`https://explorer.arc.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary/40 hover:text-secondary transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-secondary/50">
                  E-PAY never holds your private keys.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-sm text-secondary">No wallet connected</p>
                <ConnectKitButton />
              </div>
            )}
          </div>
        </Card>

        {/* Networks */}
        <Card variant="default" padding="none" className="mb-4">
          <div className="px-4 pt-4 pb-3">
            <CardTitle>Networks</CardTitle>
          </div>
          <div className="divide-y divide-border border-t border-border">
            {SUPPORTED_CHAINS.map((chain) => (
              <div key={chain.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  chain.status === 'active' ? 'bg-success' : 'bg-border'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-primary">{chain.name}</p>
                  <p className="text-xs text-secondary">Chain {chain.id} · {chain.native} gas</p>
                </div>
                {chain.status === 'active' ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="muted">Inactive</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Arc info */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border">
          <Globe2 size={14} className="text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-primary mb-1">Why Arc?</p>
            <p className="text-xs text-secondary leading-relaxed">
              Arc uses USDC as its native gas token, so you never need a separate gas token for transactions. Sub-second finality means payments confirm almost instantly.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
