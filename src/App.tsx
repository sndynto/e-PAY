import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Pages
import { LandingPage } from '@/pages/LandingPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { OnboardingPage } from '@/pages/auth/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { BuyUSDCPage } from '@/pages/BuyUSDCPage'
import { QRISCheckoutPage } from '@/pages/QRISCheckoutPage'
import { PurchaseStatusPage } from '@/pages/PurchaseStatusPage'
import { PayWithUSDCPage } from '@/pages/PayWithUSDCPage'
import { TransactionHistoryPage } from '@/pages/TransactionHistoryPage'
import { WalletSettingsPage } from '@/pages/WalletSettingsPage'
import { AccountSettingsPage } from '@/pages/AccountSettingsPage'
import { AdminPage } from '@/pages/AdminPage'
import { DeveloperDocsPage } from '@/pages/DeveloperDocsPage'
import { MerchantDashboardPage } from '@/pages/merchant/MerchantDashboardPage'
import { CreateInvoicePage } from '@/pages/merchant/CreateInvoicePage'
import { InvoicePage } from '@/pages/merchant/InvoicePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/developers" element={<DeveloperDocsPage />} />

        {/* Public hosted invoice (no auth required) */}
        <Route path="/invoice/:id" element={<InvoicePage />} />

        {/* Customer app (auth guard in Part 2) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/buy-usdc" element={<BuyUSDCPage />} />
        <Route path="/qris-checkout" element={<QRISCheckoutPage />} />
        <Route path="/purchase-status" element={<PurchaseStatusPage />} />
        <Route path="/pay" element={<PayWithUSDCPage />} />
        <Route path="/history" element={<TransactionHistoryPage />} />
        <Route path="/wallet" element={<WalletSettingsPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />

        {/* Merchant */}
        <Route path="/merchant" element={<MerchantDashboardPage />} />
        <Route path="/merchant/invoice/new" element={<CreateInvoicePage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
