import { NextResponse } from "next/server";
import clientPromise  from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import { NextApiResponse } from "next";
import { NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest, res: NextApiResponse
) {
  
  try {
    const { status } = req.body;
    // console.log('in payments update-status',status, req.query.id);
    const client = await clientPromise;
    const db = client.db("pay-guard");
    const paymentCollection = db.collection("payments");

    
    const payment = await paymentCollection.findOne({
      _id: new ObjectId(req.query.id as string),
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment status in MongoDB
    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(req.query.id as string) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.json(
        { error: "Payment not updated" },
      );
    }

    return res.json({ message: "Payment status updated" });
  } catch (error) {
    console.error(error);
    return res.json({ error: "Internal Server Error" });
  }
}
