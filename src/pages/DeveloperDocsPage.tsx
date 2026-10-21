import { motion } from 'framer-motion'
import { useState } from 'react'
import { Code2, BookOpen, Zap, Webhook, Key, Copy, CheckCircle2 } from 'lucide-react'
import { PublicLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EPayLogo } from '@/components/ui/EPayLogo'

function CodeBlock({ code }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group">
      <pre className="mono text-xs text-primary/80 bg-bg border border-border rounded-xl p-4 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-elevated border border-border text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <CheckCircle2 size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

const sections = [
  {
    id: 'quickstart',
    icon: Zap,
    title: 'Quickstart',
    content: `# Get started with E-PAY API

Base URL: https://api.epay.id/v1

All requests require an API key in the Authorization header:
Authorization: Bearer YOUR_API_KEY`,
    code: `curl -X GET https://api.epay.id/v1/health \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  },
  {
    id: 'quotes',
    icon: BookOpen,
    title: 'Request a quote',
    content: `POST /quotes

Request a USDC purchase quote for a given IDR amount.`,
    code: `curl -X POST https://api.epay.id/v1/quotes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"idr_amount": 500000, "wallet_address": "0x..."}'`,
  },
  {
    id: 'checkout',
    icon: Key,
    title: 'Create QRIS checkout',
    content: `POST /checkouts

Create a QRIS payment session. Returns a QRIS code and session ID.`,
    code: `curl -X POST https://api.epay.id/v1/checkouts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
  "quote_id": "quo_xxxxxxxxxxxx",
  "wallet_address": "0x...",
  "idempotency_key": "your-unique-key"
}'`,
  },
  {
    id: 'webhooks',
    icon: Webhook,
    title: 'Webhooks',
    content: `E-PAY sends webhook events for key state changes. Register your endpoint in the dashboard.

Events:
- checkout.pending
- checkout.completed
- checkout.failed
- usdc.delivered`,
    code: `// Verify webhook signature
const signature = req.headers['x-epay-signature'];
const isValid = verifyWebhookSignature(
  req.body,
  signature,
  process.env.EPAY_WEBHOOK_SECRET
);`,
  },
]

export function DeveloperDocsPage() {
  const [active, setActive] = useState('quickstart')

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Code2 size={24} className="text-accent" />
            <div>
              <h1 className="display text-3xl font-bold text-primary">Developer Docs</h1>
              <p className="text-secondary mt-0.5">E-PAY API reference and integration guides</p>
            </div>
            <Badge variant="warning" className="ml-auto self-start">Coming in Part 2</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar nav */}
            <div className="lg:col-span-1">
              <Card variant="elevated" padding="md" className="sticky top-24">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Contents</p>
                <nav className="flex flex-col gap-1">
                  {sections.map((s) => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActive(s.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                          active === s.id
                            ? 'bg-accent/10 text-accent'
                            : 'text-secondary hover:text-primary hover:bg-elevated'
                        }`}
                      >
                        <Icon size={14} />
                        {s.title}
                      </button>
                    )
                  })}
                </nav>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {sections.map((s) => (
                <div key={s.id} id={s.id}>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle>{s.title}</CardTitle>
                    </CardHeader>
                    <pre className="text-sm text-secondary whitespace-pre-wrap mb-4 leading-relaxed font-sans">
                      {s.content}
                    </pre>
                    <CodeBlock code={s.code} />
                  </Card>
                </div>
              ))}

              {/* Arc integration note */}
              <Card variant="accent" padding="md">
                <div className="flex items-start gap-3">
                  <EPayLogo variant="icon" size="xs" />
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Built on Arc</p>
                    <p className="text-xs text-secondary leading-relaxed">
                      E-PAY uses Arc as its settlement layer. USDC is the native gas token on Arc,
                      so users never need a separate gas token. Transactions confirm in under one second.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Arc documentation
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  )
}
