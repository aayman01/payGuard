"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface DocumentUploadProps {
  userEmail: string;
}

interface Document {
  id: string;
  file_name: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  feedback?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export default function DocumentUpload({ userEmail }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
    } else {
      setDocuments(data || []);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a PDF, JPG, or PNG file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit.";
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        e.target.value = ""; // Reset input
      } else {
        setError(null);
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userEmail}_${Date.now()}.${fileExt}`;
      const filePath = `${userEmail}/${fileName}`;

      // Check if bucket exists and create if needed
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === "verification-documents");
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket("verification-documents", {
          public: false,
          fileSizeLimit: MAX_FILE_SIZE
        });
        
        if (createError) {
          console.error("Bucket creation error:", createError);
          throw new Error("Failed to create storage bucket");
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        console.error("Storage error:", uploadError);
        throw new Error("Failed to upload file to storage");
      }

      if (!data?.path) {
        throw new Error("No file path returned from storage");
      }

      // Create document record
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          file_name: fileName,
          file_path: data.path,
          status: "pending",
          user_email: userEmail,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size
        });

      if (insertError) {
        console.error("Database error:", insertError);
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from("verification-documents")
          .remove([data.path]);
        throw new Error("Failed to create document record");
      }

      setFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      fetchDocuments();
      alert("Document uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Error uploading document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700">
            Upload Verification Document
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Accepted formats: PDF, JPG, PNG (Max size: 5MB)
          </p>
          <input
            type="file"
            id="document"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </form>

      {documents.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Documents</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <li key={doc.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${doc.status === "approved" ? "bg-green-100 text-green-800" :
                          doc.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"}`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  {doc.feedback && (
                    <p className="mt-2 text-sm text-gray-500">
                      Feedback: {doc.feedback}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
