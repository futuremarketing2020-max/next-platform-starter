import type { Context } from "@netlify/functions"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({ error: 'Webhook error' }), { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    console.log('✅ Purchase completed:', session.customer_details?.email)
    
    // TODO: Create customer account in Firebase
    // TODO: Send welcome email via Resend
    
    // For now, just log it
    console.log('Customer:', session.customer_details?.email)
    console.log('Amount:', session.amount_total)
  }

  return new Response(JSON.stringify({ received: true }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export const config = {
  path: "/api/webhooks/stripe"
}
