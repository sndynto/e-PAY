// QRISCheckoutPage — redirects to BuyUSDCPage if accessed directly.
// The QRIS checkout UI is now embedded inline in BuyUSDCPage to maintain
// purchase intent state without URL-based navigation.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function QRISCheckoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    void navigate('/buy-usdc', { replace: true })
  }, [navigate])

  return null
}
