// import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { amount, payment_id, title } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata: {
        payment_id,
        title
      }
    });
    console.log(amount, payment_id, title)

    // return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
}
} 
