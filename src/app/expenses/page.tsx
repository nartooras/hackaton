'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useDropzone } from 'react-dropzone'

interface ExpenseFile {
  id: string
  file: File
  preview: string
}

interface UploadedFile {
  filename: string
  originalName: string
  size: number
  type: string
  uploadedAt: string
}

export default function ExpensesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<ExpenseFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const qrCodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUploadUrl(`${window.location.origin}/expenses/upload`)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  })

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file.file)
      })

      const response = await fetch('/api/expenses/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadedFiles(prev => [...prev, ...data.files])
      setFiles([])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview))
    }
  }, [files])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-blue-900 dark:text-blue-200 tracking-tight drop-shadow-sm animate-fade-in mb-8">
          Claim Your Expenses
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Submitted Expenses */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">Submitted Expenses</h2>
            <div className="space-y-4">
              {uploadedFiles.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No expenses submitted yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={`/uploads/${file.filename}`}
                            alt={file.originalName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">PDF</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - QR Code and File Upload */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up">
            <div className="flex flex-col items-center justify-center space-y-6">
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200">Submit New Expense</h2>
              
              {/* QR Code Section */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Scan QR code with your phone to upload expense documents
                </p>
                <div className="bg-white p-4 rounded-lg shadow-md inline-block" ref={qrCodeRef}>
                  {uploadUrl && <QRCodeSVG value={uploadUrl} size={200} />}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="w-full">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-400'
                    }`}
                >
                  <input {...getInputProps()} />
                  <p className="text-gray-600 dark:text-gray-400">
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop files here, or click to select files'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Supported formats: JPG, PNG, PDF
                  </p>
                </div>

                {/* Preview of uploaded files */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Files to Upload:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {files.map(file => (
                        <div key={file.id} className="relative group">
                          {file.file.type.startsWith('image/') ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400">PDF</span>
                            </div>
                          )}
                          <button
                            onClick={() => setFiles(files.filter(f => f.id !== file.id))}
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
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      'Submit Expenses'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 