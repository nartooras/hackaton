import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InvoiceData } from '@/app/services/invoiceExtractor';
import { toast } from 'sonner';

interface InvoicePreviewFormProps {
  extractedData: InvoiceData;
  fileUrl: string;
  onCancel: () => void;
  onSubmit: (data: InvoiceData) => Promise<void>;
}

export function InvoicePreviewForm({
  extractedData,
  onCancel,
  onSubmit,
}: InvoicePreviewFormProps) {
  const [formData, setFormData] = useState<InvoiceData>(extractedData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Invoice submitted successfully');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Invoice Details</CardTitle>
        <CardDescription>
          Please review and edit the extracted invoice information before submitting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_id">Invoice Number</Label>
              <Input
                id="invoice_id"
                value={formData.invoice_id.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoice_id: { value: e.target.value, confidentiality: formData.invoice_id.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoice_date: { value: e.target.value, confidentiality: formData.invoice_date.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_name: { value: e.target.value, confidentiality: formData.company_name.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_code">Company Code</Label>
              <Input
                id="company_code"
                value={formData.company_code.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_code: { value: e.target.value, confidentiality: formData.company_code.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_payer_code">VAT Payer Code</Label>
              <Input
                id="vat_payer_code"
                value={formData.vat_payer_code.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vat_payer_code: { value: e.target.value, confidentiality: formData.vat_payer_code.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Input
                id="company_address"
                value={formData.company_address.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company_address: { value: e.target.value, confidentiality: formData.company_address.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_amount: { value: e.target.value, confidentiality: formData.total_amount.confidentiality },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount_curr">Currency</Label>
              <Input
                id="total_amount_curr"
                value={formData.total_amount_curr.value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_amount_curr: { value: e.target.value, confidentiality: formData.total_amount_curr.confidentiality },
                  })
                }
              />
            </div>
          </div>

          {formData.line_items && formData.line_items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Line Items</h3>
              {formData.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description.value}
                      onChange={(e) => {
                        const newItems = [...formData.line_items!];
                        newItems[index] = {
                          ...item,
                          description: { value: e.target.value, confidentiality: item.description.confidentiality },
                        };
                        setFormData({ ...formData, line_items: newItems });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity.value}
                      onChange={(e) => {
                        const newItems = [...formData.line_items!];
                        newItems[index] = {
                          ...item,
                          quantity: { value: e.target.value, confidentiality: item.quantity.confidentiality },
                        };
                        setFormData({ ...formData, line_items: newItems });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price.value}
                      onChange={(e) => {
                        const newItems = [...formData.line_items!];
                        newItems[index] = {
                          ...item,
                          unit_price: { value: e.target.value, confidentiality: item.unit_price.confidentiality },
                        };
                        setFormData({ ...formData, line_items: newItems });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.total_price.value}
                      onChange={(e) => {
                        const newItems = [...formData.line_items!];
                        newItems[index] = {
                          ...item,
                          total_price: { value: e.target.value, confidentiality: item.total_price.confidentiality },
                        };
                        setFormData({ ...formData, line_items: newItems });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Invoice'}
            </Button>
            <Button type="button" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 