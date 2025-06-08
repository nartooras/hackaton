'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type InvoiceData = {
  amount: number;
  description: string;
  category: string;
  date: string;
  fileUrl: string;
};

export function QRCodeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);

      // Get upload URL
      const response = await fetch('/api/upload-url');
      const { url, fields } = await response.json();

      // Create form data
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      // Upload to S3
      await fetch(url, {
        method: 'POST',
        body: formData,
      });

      // Get the file URL
      const fileUrl = `${url}/${fields.key}`;

      // Get parsed invoice data
      const invoiceResponse = await fetch('/api/expenses/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to parse invoice');
      }

      const invoiceData = await invoiceResponse.json();
      setPreviewData({
        amount: invoiceData.amount,
        description: invoiceData.description,
        category: invoiceData.category,
        date: invoiceData.date,
        fileUrl,
      });

      toast.success('File uploaded successfully. Please review the details.');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData) return;

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      toast.success('Expense created successfully');
      router.refresh();
      setPreviewData(null);
      setFile(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create expense');
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setFile(null);
  };

  if (previewData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Invoice Details</CardTitle>
          <CardDescription>
            Please review and edit the invoice details before submitting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={previewData.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setPreviewData({ ...previewData, amount: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={previewData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setPreviewData({ ...previewData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={previewData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setPreviewData({ ...previewData, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={previewData.date.split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setPreviewData({ ...previewData, date: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Submit
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Invoice</CardTitle>
        <CardDescription>
          Upload an invoice to automatically create an expense
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select Invoice Image</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Invoice'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 