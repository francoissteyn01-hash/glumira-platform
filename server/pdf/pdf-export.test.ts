/**
 * GluMira™ PDF Export Engine — Test Suite
 * Version: 7.0.0
 *
 * Tests sanitiseHtml, injectPrintCss, and route validation logic.
 * Puppeteer is NOT invoked in tests (no headless browser required).
 */

import { describe, expect, it } from "vitest";
import { sanitiseHtml, injectPrintCss, PRINT_CSS } from "./pdf-export";

// ─── sanitiseHtml ─────────────────────────────────────────────

describe("sanitiseHtml", () => {
  it("removes <script> tags", () => {
    const input = '<div>Hello</div><script>alert("xss")</script>';
    expect(sanitiseHtml(input)).not.toContain("<script>");
    expect(sanitiseHtml(input)).not.toContain("alert");
  });

  it("removes inline event handlers", () => {
    const input = '<button onclick="evil()">Click</button>';
    expect(sanitiseHtml(input)).not.toContain("onclick");
  });

  it("removes javascript: URIs", () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    expect(sanitiseHtml(input)).not.toContain("javascript:");
  });

  it("removes <iframe> tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    expect(sanitiseHtml(input)).not.toContain("<iframe");
  });

  it("removes <object> tags", () => {
    const input = '<object data="evil.swf"></object>';
    expect(sanitiseHtml(input)).not.toContain("<object");
  });

  it("removes <embed> tags", () => {
    const input = '<embed src="evil.swf">';
    expect(sanitiseHtml(input)).not.toContain("<embed");
  });

  it("removes data:text/html URIs", () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">link</a>';
    expect(sanitiseHtml(input)).not.toContain("data:text/html");
  });

  it("preserves safe HTML content", () => {
    const input = "<h1>School Care Plan</h1><p>Patient: John</p><table><tr><td>Data</td></tr></table>";
    const result = sanitiseHtml(input);
    expect(result).toContain("<h1>");
    expect(result).toContain("<p>");
    expect(result).toContain("<table>");
  });

  it("preserves inline styles (needed for PDF rendering)", () => {
    const input = '<div style="color: red; font-size: 12pt;">Text</div>';
    const result = sanitiseHtml(input);
    expect(result).toContain("style=");
    expect(result).toContain("color: red");
  });

  it("handles empty string", () => {
    expect(sanitiseHtml("")).toBe("");
  });

  it("handles multiple XSS vectors in one string", () => {
    const input = '<script>x</script><iframe></iframe><a onclick="y">z</a>';
    const result = sanitiseHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("onclick");
  });
});

// ─── injectPrintCss ───────────────────────────────────────────

describe("injectPrintCss", () => {
  it("injects style before </head> when head exists", () => {
    const html = "<html><head><title>Test</title></head><body>Content</body></html>";
    const result = injectPrintCss(html);
    expect(result).toContain("<style>");
    expect(result).toContain(PRINT_CSS);
    // Style should be before </head>
    const styleIdx = result.indexOf("<style>");
    const headCloseIdx = result.indexOf("</head>");
    expect(styleIdx).toBeLessThan(headCloseIdx);
  });

  it("injects style after <head> when head tag exists without close", () => {
    const html = "<html><head><body>Content</body></html>";
    const result = injectPrintCss(html);
    expect(result).toContain("<style>");
  });

  it("wraps bare HTML in full document when no head tag", () => {
    const html = "<div>Hello World</div>";
    const result = injectPrintCss(html);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<html");
    expect(result).toContain("<head>");
    expect(result).toContain("<body>");
    expect(result).toContain("<div>Hello World</div>");
    expect(result).toContain("<style>");
  });

  it("includes @page rule in injected CSS", () => {
    const result = injectPrintCss("<div>test</div>");
    expect(result).toContain("@page");
  });

  it("includes print-color-adjust in injected CSS", () => {
    const result = injectPrintCss("<div>test</div>");
    expect(result).toContain("print-color-adjust");
  });

  it("includes GluMira blue colour in injected CSS", () => {
    const result = injectPrintCss("<div>test</div>");
    expect(result).toContain("#1A6DB5");
  });

  it("preserves existing content after injection", () => {
    const html = "<html><head></head><body><h1>School Care Plan</h1></body></html>";
    const result = injectPrintCss(html);
    expect(result).toContain("<h1>School Care Plan</h1>");
  });
});

// ─── PRINT_CSS constant ───────────────────────────────────────

describe("PRINT_CSS", () => {
  it("is a non-empty string", () => {
    expect(typeof PRINT_CSS).toBe("string");
    expect(PRINT_CSS.length).toBeGreaterThan(100);
  });

  it("contains A4 page size definition", () => {
    expect(PRINT_CSS).toContain("A4");
  });

  it("contains table styles", () => {
    expect(PRINT_CSS).toContain("border-collapse");
  });

  it("contains disclaimer class", () => {
    expect(PRINT_CSS).toContain(".disclaimer");
  });

  it("contains alert-box class", () => {
    expect(PRINT_CSS).toContain(".alert-box");
  });

  it("contains page-break class", () => {
    expect(PRINT_CSS).toContain(".page-break");
  });
});
