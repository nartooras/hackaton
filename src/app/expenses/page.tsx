"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useDropzone } from "react-dropzone";
import { SubmittedExpenses } from "@/components/SubmittedExpenses";
import { InvoicePreviewForm } from "@/components/InvoicePreviewForm";
import { InvoiceData } from "@/app/services/invoiceExtractor";

interface ExpenseFile {
  id: string;
  file: File;
  preview: string;
}

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  extracted?: InvoiceData;
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  category: {
    name: string;
  };
  attachments: {
    filename: string;
    url: string;
  }[];
}

export default function ExpensesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<ExpenseFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadToken, setUploadToken] = useState('');
  const [previewData, setPreviewData] = useState<{
    invoiceData: InvoiceData;
    fileUrl: string;
  } | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) {
          throw new Error('Failed to fetch expenses');
        }
        const data = await response.json();
        setExpenses(data.expenses);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    };

    if (status === 'authenticated') {
      fetchExpenses();
    }
  }, [status]);

  // Generate upload token and URL
  useEffect(() => {
    const generateUploadToken = async () => {
      try {
        const response = await fetch('/api/expenses/upload-token', {
          method: 'POST',
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate upload token')
        }

        const data = await response.json()
        setUploadToken(data.token)
        setUploadUrl(`${window.location.origin}/expenses/upload?token=${data.token}`)
      } catch (error) {
        console.error('Error generating upload token:', error)
      }
    }

    if (status === 'authenticated') {
      generateUploadToken()
    }
  }, [status])

  // Refresh token every 14 minutes (before the 15-minute expiry)
  useEffect(() => {
    if (!uploadToken) return

    const interval = setInterval(() => {
      const generateUploadToken = async () => {
        try {
          const response = await fetch('/api/expenses/upload-token', {
            method: 'POST',
          })
          
          if (!response.ok) {
            throw new Error('Failed to generate upload token')
          }

          const data = await response.json()
          setUploadToken(data.token)
          setUploadUrl(`${window.location.origin}/expenses/upload?token=${data.token}`);
        } catch (error) {
          console.error('Error generating upload token:', error)
        }
      }

      generateUploadToken()
    }, 14 * 60 * 1000) // 14 minutes

    return () => clearInterval(interval)
  }, [uploadToken]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file.file);
      });

      const response = await fetch("/api/expenses/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      // If we have extracted data, show the preview form
      if (data.files[0]?.extracted) {
        setPreviewData({
          invoiceData: data.files[0].extracted,
          fileUrl: `/uploads/${data.files[0].filename}`,
        });
      } else {
        setUploadedFiles((prev) => [...prev, ...data.files]);
      }
      
      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (invoiceData: InvoiceData) => {
    if (!previewData) return;

    try {
      const response = await fetch('/api/expenses/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData,
          fileUrl: previewData.fileUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit invoice');
      }

      await response.json(); // Just consume the response
      setUploadedFiles((prev) => [...prev, {
        filename: previewData.fileUrl.split('/').pop() || '',
        originalName: previewData.fileUrl.split('/').pop() || '',
        size: 0,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      }]);
      setPreviewData(null);
      router.refresh();
    } catch (error) {
      console.error('Submit error:', error);
      throw error;
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </main>
    );
  }

  if (previewData) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-4xl mx-auto">
          <InvoicePreviewForm
            extractedData={previewData.invoiceData}
            fileUrl={previewData.fileUrl}
            onCancel={() => setPreviewData(null)}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <SubmittedExpenses 
              expenses={expenses} 
              onDelete={handleDeleteExpense}
            />
          </div>
          <div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up">
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">
                Upload New Expense
              </h2>
              <div className="space-y-6">
                {/* QR Code for Mobile Upload */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Upload
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Scan this QR code with your mobile device to upload expenses
                  </p>
                  <div ref={qrCodeRef} className="flex justify-center">
                    <QRCodeSVG value={uploadUrl} size={200} />
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="w-full">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                      ${
                        isDragActive
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-400"
                      }`}
                  >
                    <input {...getInputProps()} />
                    <p className="text-gray-600 dark:text-gray-400">
                      {isDragActive
                        ? "Drop the files here..."
                        : "Drag & drop files here, or click to select files"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Supported formats: JPG, PNG, PDF
                    </p>
                  </div>

                  {/* Preview of uploaded files */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Files to Upload:
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {files.map((file) => (
                          <div key={file.id} className="relative group">
                            {file.file.type.startsWith("image/") ? (
                              <img
                                src={file.preview}
                                alt={file.file.name}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400">
                                  PDF
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setFiles(files.filter((f) => f.id !== file.id))
                              }
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {files.length > 0 && (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className={`w-full mt-4 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 ${
                        isUploading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        "Submit Expenses"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
