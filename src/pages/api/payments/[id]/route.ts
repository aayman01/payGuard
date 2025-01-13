import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import clientPromise  from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import stripe from "@/lib/stripe";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = await req.json();
    const client = await clientPromise;
    const db = client.db("pay-guard");
    const paymentCollection = db.collection("payments");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.user_metadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payment = await paymentCollection.findOne({
      _id: new ObjectId(params.id),
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update Stripe PaymentIntent status
    if (status === "approved") {
      await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);
    } else if (status === "rejected") {
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    }

    // Update payment status in MongoDB
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Payment not updated" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Payment status updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
