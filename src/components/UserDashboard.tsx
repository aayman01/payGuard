"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DocumentUpload from "@/components/DocumentUpload";
import { User } from "@supabase/supabase-js";

interface Payment {
  id: string;
  title: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  user_id: string;
  created_at: string;
}

export default function UserDashboard({ user }: { user: User }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const router = useRouter();
  // console.log(user?.user_metadata?.email)

  const fetchPayments = useCallback(async () => {
    const response = await fetch(`/api/payments/route?email=${user?.user_metadata?.email}`);
    if (response.ok) {
      const data = await response.json();
      setPayments(data);
    }
  }, [user?.user_metadata?.email]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First create payment record
      const paymentResponse = await fetch("/api/payments/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          status: "pending",
          email: user?.user_metadata?.email,
          created_at: new Date().toISOString(),
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to create payment record");
      }

      const { id } = await paymentResponse.json();
      // console.log(i

      // Then create Stripe payment intent
      const stripeResponse = await fetch("/api/create-payment-intent/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_id: id,
          title: title
        }),
      });

      if (!stripeResponse.ok) {
        throw new Error("Failed to create Stripe payment");
      }

      const { clientSecret } = await stripeResponse.json();
      router.push(`/payment?client_secret=${clientSecret}&payment_id=${id}`);
    } catch (error) {
      console.error("Payment error:", error);
      alert(error instanceof Error ? error.message : "Payment failed");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Payment</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Payment Title"
            required
            className="flex-1 p-2 border rounded min-w-[200px]"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            required
            min="0.01"
            step="0.01"
            className="flex-1 p-2 border rounded min-w-[200px]"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Proceed to Payment
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody key={user?.user_metadata?.email}>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="p-3">{payment.title}</td>
                    <td className="p-3">${payment.amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`capitalize ${
                          payment.status === "completed"
                            ? "text-green-500"
                            : payment.status === "failed"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Upload Verification Document
          </h2>
          <DocumentUpload userEmail={user?.user_metadata?.email} />
        </div>
      </div>
    </div>
  );
}
