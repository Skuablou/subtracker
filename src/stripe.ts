export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string
export const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string

export async function redirectToCheckout(userEmail: string) {
  const url = `https://buy.stripe.com/28EbJ3gB28dT2ZL9PxgA800?prefilled_email=${encodeURIComponent(userEmail)}`
  window.location.href = url
}
