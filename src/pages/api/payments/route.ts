import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("pay-guard");
    const paymentsCollection = db.collection("payments");

    if (req.method === "POST") {
      const payment = {
        ...req.body,
        _id: new ObjectId()
      };
      
      const result = await paymentsCollection.insertOne(payment);
      
      return res.status(201).json({ 
        success: true, 
        id: result.insertedId.toString(),
        message: "Payment created successfully" 
      });
    } 
    
    else if (req.method === "GET") {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      const payments = await paymentsCollection
        .find({ email })
        .sort({ created_at: -1 })
        .toArray();

      return res.status(200).json(payments);
    }
    
    return res.status(405).json({ 
      success: false, 
      message: "Method Not Allowed" 
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

