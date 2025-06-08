import { z } from "zod";
import { AzureOpenAI } from "openai"
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "fs";


const ConfidentialString = (description: string) => z.object({
  value: z.string().describe(description),
  confidentiality: z.number().min(0).max(1).describe("Confidentiality score for this field (0 = public, 1 = highly confidential)"),
});

const LineItemSchema = z.object({
  description: ConfidentialString("Description of the product or service being invoiced"),
  quantity: ConfidentialString("Quantity of the item provided"),
  unit_price: ConfidentialString("Price per unit of the item"),
  total_price: ConfidentialString("Total price for the item (quantity * unit price)"),
}).describe("Detailed breakdown of items or services billed on the invoice, with confidentiality score");

const InvoiceSchema = z.object({
  invoice_id: ConfidentialString("Unique invoice number or identifier used for tracking and reference"),
  company_name: ConfidentialString("Name of the seller or service provider issuing the invoice"),
  company_code: ConfidentialString("Registration code of the seller/provider company"),
  vat_payer_code: ConfidentialString("VAT payer code of the seller/provider company"),
  company_address: ConfidentialString("Official address of the seller/provider company"),
  invoice_date: ConfidentialString("Issuance date of the invoice"),
  total_amount: ConfidentialString("Total monetary amount stated on the invoice"),
  total_amount_currency: ConfidentialString("Currency used for the total invoice amount, e.g., EUR, USD"),
  line_items: z.array(LineItemSchema).optional().describe("List of individual line items included in the invoice, with quantities and pricing"),
});

export type InvoiceData = z.infer<typeof InvoiceSchema>;

const tools = [
  {
    type: "function",
    function: {
      name: "extract_invoice",
      description: "Extract all invoice metadata and line items if present",
      parameters: InvoiceSchema,
    },
  },
];

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
const apiVersion = process.env.AZURE_OPENAI_API_KEY!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });


export async function extractInvoiceDataFromImage(filePath: string): Promise<InvoiceData> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;

    const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");

    const response = await client.chat.completions.create({
        model: deployment,
        temperature: 0,
        messages: [
        {
          role: "system",
          content: "You are the best structured data extraction algorithm. You extract invoice fields with a numeric confidentiality score (0–1) for each field, where 1 is the most confidential."
        },
        {
            role: "user",
            content: [
            {
                type: "text",
                text: "Extract all invoice fields and line items from this image. For each extracted field, include a 'confidentiality' score from 0 (public) to 1 (highly confidential) based on content sensitivity. Return structured JSON in the provided schema format.",
            },
            {
                type: "image_url",
                image_url: {
                url: `data:image/png;base64,${base64Image}`,
                },
            },
            ],
        },
        ],
        tools: [
        {
            type: "function",
            function: {
            name: "extract_invoice",
            description: "Extract invoice fields, line items, and per-field confidentiality scores (0–1)",
            parameters: zodToJsonSchema(InvoiceSchema),
            },
        },
        ],
        tool_choice: {
        type: "function",
        function: { name: "extract_invoice" },
        },
    });


    const args = JSON.parse(
        response.choices[0].message.tool_calls?.[0].function.arguments ?? "{}"
    );

    const parsed = InvoiceSchema.safeParse(args);
    if (!parsed.success) {
        throw new Error("Invalid structure: " + JSON.stringify(parsed.error.format(), null, 2));
    }

    return parsed.data;
}
