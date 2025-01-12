"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DocumentUpload from"./DocumentUpload";
import { User } from "@supabase/supabase-js";

interface Payment {
  id: string;
  title: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
}

export default function UserDashboard({ user }: { user: User }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching payments:", error);
    else setPayments(data);
  }, [user.id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {  error } = await supabase
      .from("payments")
      .insert([
        {
          title,
          amount: parseFloat(amount),
          status: "Pending",
          user_id: user.id,
        },
      ]);
    if (error) console.error("Error creating payment:", error);
    else {
      setTitle("");
      setAmount("");
      fetchPayments();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Payment Request</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Payment Title"
            required
            className="flex-grow p-2 border rounded"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            required
            className="w-32 p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>
      </form>
      <h2 className="text-xl font-semibold mb-4">Your Payments</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Title</th>
            <th className="border p-2 text-left">Amount</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="border p-2">{payment.title}</td>
              <td className="border p-2">${payment.amount.toFixed(2)}</td>
              <td className="border p-2">{payment.status}</td>
              <td className="border p-2">
                {new Date(payment.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Upload Verification Document
        </h2>
        <DocumentUpload userId={user.id} />
      </div>
    </div>
  );
}
