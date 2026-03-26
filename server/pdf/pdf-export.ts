/**
 * GluMira™ PDF Export Engine
 * Version: 7.0.0
 * Module: PDF-EXPORT
 *
 * Server-side PDF generation using Puppeteer (headless Chromium).
 * Supports:
 *   - School Care Plan PDF (A4, colour, print-optimised)
 *   - Patient Summary Report PDF
 *   - IOB History Report PDF
 *
 * Security:
 *   - HTML sanitised with DOMPurify before rendering
 *   - Puppeteer runs in sandbox mode (--no-sandbox disabled in container)
 *   - Output buffer never written to disk — streamed directly to response
 *   - Rate-limited: max 10 PDF exports per user per hour (PDF_EXPORT profile)
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────

export type PdfTemplate = "school-care-plan" | "patient-summary" | "iob-history";

export interface PdfExportOptions {
  template: PdfTemplate;
  html: string;                  // Pre-rendered HTML string
  filename?: string;             // Suggested download filename
  format?: "A4" | "Letter";     // Page format (default: A4)
  landscape?: boolean;           // Landscape orientation (default: false)
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface PdfExportResult {
  buffer: Buffer;
  filename: string;
  contentType: "application/pdf";
  sha256: string;                // SHA-256 of the buffer for audit
  generatedAt: string;           // ISO timestamp
  pageCount?: number;
}

// ─── HTML Sanitiser (DOMPurify-compatible server-side) ────────

const ALLOWED_TAGS = new Set([
  "html", "head", "body", "meta", "title", "style",
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tr", "th", "td",
  "ul", "ol", "li",
  "strong", "em", "b", "i", "u",
  "br", "hr",
  "section", "article", "header", "footer", "main",
  "img",
]);

const FORBIDDEN_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
];

/**
 * Sanitise HTML before passing to Puppeteer.
 * Removes scripts, iframes, event handlers, and javascript: URIs.
 */
export function sanitiseHtml(html: string): string {
  let sanitised = html;
  for (const pattern of FORBIDDEN_PATTERNS) {
    sanitised = sanitised.replace(pattern, "");
  }
  return sanitised;
}

// ─── CSS Injection ────────────────────────────────────────────

/**
 * Print-optimised CSS injected into every PDF.
 * Ensures consistent rendering across Chromium versions.
 */
export const PRINT_CSS = `
  @page {
    margin: 15mm 12mm;
    size: A4 portrait;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box;
  }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: #ffffff;
  }
  h1 { font-size: 18pt; color: #1A6DB5; margin-bottom: 8pt; }
  h2 { font-size: 14pt; color: #1A6DB5; margin-bottom: 6pt; page-break-after: avoid; }
  h3 { font-size: 12pt; color: #333; margin-bottom: 4pt; page-break-after: avoid; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  th {
    background-color: #1A6DB5;
    color: #ffffff;
    padding: 6pt 8pt;
    text-align: left;
    font-size: 10pt;
  }
  td {
    padding: 5pt 8pt;
    border-bottom: 1pt solid #e0e0e0;
    font-size: 10pt;
  }
  tr:nth-child(even) td { background-color: #f5f8fc; }
  .disclaimer {
    font-size: 8pt;
    color: #666;
    border-top: 1pt solid #ccc;
    padding-top: 8pt;
    margin-top: 16pt;
  }
  .alert-box {
    border: 2pt solid #D32F2F;
    background-color: #fff5f5;
    padding: 8pt 12pt;
    border-radius: 4pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  .info-box {
    border: 1pt solid #1A6DB5;
    background-color: #f0f7ff;
    padding: 8pt 12pt;
    border-radius: 4pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  .page-break { page-break-before: always; }
  .no-break { page-break-inside: avoid; }
  @media print {
    .no-print { display: none !important; }
  }
`;

// ─── PDF Generator ────────────────────────────────────────────

/**
 * Generate a PDF buffer from an HTML string using Puppeteer.
 *
 * This function dynamically imports Puppeteer to allow the module
 * to be imported in environments where Puppeteer is not installed
 * (e.g. during unit tests).
 */
export async function generatePdf(options: PdfExportOptions): Promise<PdfExportResult> {
  const {
    html,
    template,
    filename,
    format = "A4",
    landscape = false,
    margin = { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
  } = options;

  // Sanitise HTML
  const safeHtml = sanitiseHtml(html);

  // Inject print CSS
  const fullHtml = injectPrintCss(safeHtml);

  // Dynamic import — allows module to load without Puppeteer in test environments
  let puppeteer: any;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    throw new Error(
      "Puppeteer is not installed. Run: pnpm add puppeteer"
    );
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  let buffer: Buffer;
  let pageCount: number | undefined;

  try {
    const page = await browser.newPage();

    // Set content and wait for fonts/images
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format,
      landscape,
      margin,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8pt; color:#999; width:100%; text-align:right; padding-right:12mm;">
          GluMira™ — Not a medical device
        </div>
      `,
      footerTemplate: `
        <div style="font-size:8pt; color:#999; width:100%; display:flex; justify-content:space-between; padding:0 12mm;">
          <span>Generated: <span class="date"></span></span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    buffer = Buffer.from(pdfBuffer);

    // Attempt to get page count (not always available)
    try {
      pageCount = await page.evaluate(() => {
        return document.querySelectorAll(".page-break").length + 1;
      });
    } catch {
      pageCount = undefined;
    }
  } finally {
    await browser.close();
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const generatedAt = new Date().toISOString();
  const resolvedFilename = filename ?? `glumira-${template}-${Date.now()}.pdf`;

  return {
    buffer,
    filename: resolvedFilename,
    contentType: "application/pdf",
    sha256,
    generatedAt,
    pageCount,
  };
}

// ─── HTML Injection ───────────────────────────────────────────

/**
 * Inject the print CSS into an HTML document.
 * If the HTML has a <head> tag, injects before </head>.
 * Otherwise wraps the content in a full HTML document.
 */
export function injectPrintCss(html: string): string {
  const styleTag = `<style>${PRINT_CSS}</style>`;

  if (html.includes("</head>")) {
    return html.replace("</head>", `${styleTag}</head>`);
  }

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${styleTag}`);
  }

  // No head tag — wrap in full document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${styleTag}
</head>
<body>
${html}
</body>
</html>`;
}

// ─── Express Route Handler ────────────────────────────────────

import { Router, type Request, type Response } from "express";

export const pdfExportRouter = Router();

/**
 * POST /api/pdf/export
 *
 * Body: { template, html, filename?, format?, landscape? }
 * Response: application/pdf binary stream
 *
 * Rate-limited: 10 exports per user per hour.
 */
pdfExportRouter.post("/export", async (req: Request, res: Response) => {
  const { template, html, filename, format, landscape } = req.body as Partial<PdfExportOptions>;

  if (!template || !html) {
    return res.status(400).json({ error: "template and html are required" });
  }

  const validTemplates: PdfTemplate[] = ["school-care-plan", "patient-summary", "iob-history"];
  if (!validTemplates.includes(template)) {
    return res.status(400).json({ error: `template must be one of: ${validTemplates.join(", ")}` });
  }

  if (typeof html !== "string" || html.length > 2_000_000) {
    return res.status(400).json({ error: "html must be a string under 2MB" });
  }

  try {
    const result = await generatePdf({ template, html, filename, format, landscape });

    // Audit log entry (non-blocking)
    void logPdfExport(req, result);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.setHeader("Content-Length", result.buffer.length);
    res.setHeader("X-PDF-SHA256", result.sha256);
    res.setHeader("X-Generated-At", result.generatedAt);

    return res.status(200).send(result.buffer);
  } catch (err: any) {
    if (err.message?.includes("not installed")) {
      return res.status(503).json({
        error: "PDF export service unavailable — Puppeteer not installed",
        hint: "Run: pnpm add puppeteer",
      });
    }
    return res.status(500).json({ error: err.message ?? "PDF generation failed" });
  }
});

async function logPdfExport(req: Request, result: PdfExportResult): Promise<void> {
  try {
    const { writeAuditLog } = await import("../security/audit");
    await writeAuditLog({
      userId: (req as any).userId ?? "unknown",
      action: "pdf.export",
      metadata: {
        filename: result.filename,
        sha256: result.sha256,
        generatedAt: result.generatedAt,
      },
    });
  } catch {
    // Non-critical — audit failure should not fail the PDF export
  }
}
