export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string
export const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string

export async function redirectToCheckout(userEmail: string) {
  const { loadStripe } = await import('@stripe/stripe-js')
  const stripe = await loadStripe(STRIPE_PUBLIC_KEY)
  if (!stripe) return

  await stripe.redirectToCheckout({
    lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    successUrl: window.location.origin + '?payment=success',
    cancelUrl: window.location.origin + '?payment=cancel',
    customerEmail: userEmail,
  })
}
