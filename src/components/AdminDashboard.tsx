"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Payment {
  _id: string;
  title: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
  email: string;
}

interface Document {
  id: string;
  file_name: string;
  original_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user_email: string;
  feedback?: string;
}

interface Summary {
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  totalAmount: number;
}

export default function AdminDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalAmount: 0,
  });
  const [filter, setFilter] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [feedback, setFeedback] = useState("");
  const router = useRouter();
  

  const fetchPayments = useCallback(async () => {
    const response = await fetch("/api/payments/route");
    if (response.ok) {
      const data = await response.json();
      setPayments(data);
      updateSummary(data);
    } else {
      console.error("Error fetching payments:", await response.text());
    }
  }, []);

  // const fetchDocuments = useCallback(async () => {
  //   const { data, error } = await supabase
  //     .from("documents")
  //     .select("*")
  //     .order("created_at", { ascending: false });

  //   if (error) {
  //     console.error("Error fetching documents:", error);
  //   } else {
  //     setDocuments(data || []);
  //   }
  // }, []);

  const fetchDocuments = () =>{
    setDocuments([])
  }

  useEffect(() => {
    fetchPayments();
    // fetchDocuments();
  }, [fetchPayments]);

  const updateSummary = (payments: Payment[]) => {
    const summary = payments.reduce(
      (acc, payment) => {
        acc.totalPayments++;
        acc.totalAmount += payment.amount;
        if (payment.status === "pending") acc.pendingPayments++;
        if (payment.status === "completed") acc.completedPayments++;
        if (payment.status === "failed") acc.failedPayments++;
        return acc;
      },
      {
        totalPayments: 0,
        pendingPayments: 0,
        completedPayments: 0,
        failedPayments: 0,
        totalAmount: 0,
      }
    );
    setSummary(summary);
  };

  const handlePaymentStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/payments/update-status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update payment status");
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to update payment status");
    }
  };

  const handleDocumentStatus = async (docId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          status: newStatus,
          feedback: newStatus === "rejected" ? feedback : null 
        })
        .eq("id", docId);

      if (error) throw error;
      setFeedback("");
      fetchDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update document status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter.status && payment.status !== filter.status) return false;
    if (filter.startDate && new Date(payment.created_at) < new Date(filter.startDate)) return false;
    if (filter.endDate && new Date(payment.created_at) > new Date(filter.endDate)) return false;
    return true;
  });

  // console.log(filteredPayments);

  return (
    <div className="max-w-7xl mx-auto p-2">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Payments</h3>
          <p className="text-2xl font-bold">{summary.totalPayments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Pending</h3>
          <p className="text-2xl font-bold text-yellow-500">
            {summary.pendingPayments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Completed</h3>
          <p className="text-2xl font-bold text-green-500">
            {summary.completedPayments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Failed</h3>
          <p className="text-2xl font-bold text-red-500">
            {summary.failedPayments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Amount</h3>
          <p className="text-2xl font-bold">
            ${summary.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        {/* Payments Table */}
        <div className="bg-white p-2 rounded-lg shadow ">
          <h2 className="text-lg font-semibold mb-4">Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody key={filteredPayments.length}>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-t">
                    <td className="p-3">{payment.title}</td>
                    <td className="p-3">${payment.amount.toFixed(2)}</td>
                    <td className="p-3">{payment.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <select
                        value={payment.status}
                        onChange={(e) =>
                          handlePaymentStatus(payment?._id, e.target.value)
                        }
                        className="p-2 border rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Complete</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white p-2 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Verification Documents</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">File Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t">
                    <td className="p-3">{doc.original_name}</td>
                    <td className="p-3">{doc.user_email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        doc.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={doc.status}
                          onChange={(e) =>
                            handleDocumentStatus(doc.id, e.target.value)
                          }
                          className="p-2 border rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approve</option>
                          <option value="rejected">Reject</option>
                        </select>
                        {doc.status === "rejected" && (
                          <input
                            type="text"
                            placeholder="Rejection reason"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="p-2 border rounded"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
