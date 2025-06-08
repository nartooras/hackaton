'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MobileUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verify token on page load
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid upload link')
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/expenses/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error('Invalid token')
        }

        setIsAuthenticated(true)
      } catch (error) {
        setError('Invalid or expired upload link')
        console.error('Token verification error:', error)
      }
    }

    verifyToken()
  }, [searchParams])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/jpeg')
      })

      // Create file from blob
      const file = new File([blob], `expense-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setFiles(prev => [...prev, file])

      // Cleanup
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setError('Failed to access camera')
      console.error('Camera error:', err)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('token', searchParams.get('token') || '')

      const response = await fetch('/api/expenses/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Clear files after successful upload
      setFiles([])
      router.push('/expenses')
    } catch (err) {
      setError('Failed to upload files')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-xl font-semibold text-blue-800 animate-pulse">Verifying...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">
          Upload Expense Documents
        </h1>

        {/* Upload Methods */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handleCapture}
            className="w-full py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Take Photo
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg shadow-md hover:bg-blue-50 transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="font-semibold text-gray-700 mb-2">Selected Files:</h2>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-600 truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-3 rounded-lg shadow-md transition-colors ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </main>
  )
} 