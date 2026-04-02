/**
 * GluMira™ V7 — Email template loader
 * Reads branded HTML templates and injects variables.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const TEMPLATE_DIR = __dirname;

function loadTemplate(name: string): string {
  return readFileSync(resolve(TEMPLATE_DIR, `${name}.html`), "utf-8");
}

/** Replace {{ .Key }} placeholders with values from the data object. */
function render(template: string, data: Record<string, string>): string {
  return Object.entries(data).reduce(
    (html, [key, value]) =>
      html.replace(new RegExp(`\\{\\{\\s*\\.${key}\\s*\\}\\}`, "g"), value),
    template
  );
}

export function renderInvite(data: {
  Name: string;
  InviterName: string;
  ConfirmationURL: string;
}): string {
  return render(loadTemplate("invite"), data);
}

export function renderConfirm(data: { ConfirmationURL: string }): string {
  return render(loadTemplate("confirm"), data);
}

export function renderReset(data: { ConfirmationURL: string }): string {
  return render(loadTemplate("reset"), data);
}

/** Raw template strings for Supabase dashboard email config. */
export const templates = {
  invite: loadTemplate("invite"),
  confirm: loadTemplate("confirm"),
  reset: loadTemplate("reset"),
};
