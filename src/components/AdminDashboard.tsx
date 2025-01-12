"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Payment {
  id: string;
  title: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  user_id: string;
}

interface Document {
  id: string;
  file_name: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  user_id: string;
}

interface Summary {
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalAmount: number;
}

export default function AdminDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalPayments: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalAmount: 0,
  });
  const [filter, setFilter] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const router = useRouter();

  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching payments:", error);
    else {
      setPayments(data);
      updateSummary(data);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching documents:", error);
    else setDocuments(data);
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchDocuments();
  }, [fetchDocuments, fetchPayments]);

  const updateSummary = (payments: Payment[]) => {
    const summary = payments.reduce(
      (acc, payment) => {
        acc.totalPayments++;
        acc.totalAmount += payment.amount;
        if (payment.status === "Pending") acc.pendingPayments++;
        if (payment.status === "Approved") acc.approvedPayments++;
        if (payment.status === "Rejected") acc.rejectedPayments++;
        return acc;
      },
      {
        totalPayments: 0,
        pendingPayments: 0,
        approvedPayments: 0,
        rejectedPayments: 0,
        totalAmount: 0,
      }
    );
    setSummary(summary);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "Pending" | "Approved" | "Rejected",
    type: "payment" | "document"
  ) => {
    const { error } = await supabase
      .from(type === "payment" ? "payments" : "documents")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) console.error(`Error updating ${type} status:`, error);
    else {
      if (type === "payment") fetchPayments();
      else fetchDocuments();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter.status && payment.status !== filter.status) return false;
    if (
      filter.startDate &&
      new Date(payment.created_at) < new Date(filter.startDate)
    )
      return false;
    if (
      filter.endDate &&
      new Date(payment.created_at) > new Date(filter.endDate)
    )
      return false;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Payments</p>
            <p className="text-2xl font-bold">{summary.totalPayments}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">
              {summary.pendingPayments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-500">
              {summary.approvedPayments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-red-500">
              {summary.rejectedPayments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold">
              ${summary.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) =>
              setFilter({ ...filter, startDate: e.target.value })
            }
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Payments</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Created At</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="border p-2">{payment.title}</td>
                <td className="border p-2">${payment.amount.toFixed(2)}</td>
                <td className="border p-2">{payment.status}</td>
                <td className="border p-2">
                  {new Date(payment.created_at).toLocaleString()}
                </td>
                <td className="border p-2">
                  <select
                    value={payment.status}
                    onChange={(e) =>
                      handleStatusChange(
                        payment.id,
                        e.target.value as "Pending" | "Approved" | "Rejected",
                        "payment"
                      )
                    }
                    className="p-1 border rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">File Name</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Uploaded At</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="border p-2">{doc.file_name}</td>
                <td className="border p-2">{doc.status}</td>
                <td className="border p-2">
                  {new Date(doc.created_at).toLocaleString()}
                </td>
                <td className="border p-2">
                  <select
                    value={doc.status}
                    onChange={(e) =>
                      handleStatusChange(
                        doc.id,
                        e.target.value as "Pending" | "Approved" | "Rejected",
                        "document"
                      )
                    }
                    className="p-1 border rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
