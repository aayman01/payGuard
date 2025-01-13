import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("pay-guard");
    const userCollection = db.collection("users");

    if (req.method === "POST") {
      const user = req.body;
      await userCollection.insertOne(user);
      return res
        .status(201)
        .json({ success: true, message: "successfully inserted!" });
    } else {
      return res
        .status(405)
        .json({ success: false, message: "Method Not Allowed" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
