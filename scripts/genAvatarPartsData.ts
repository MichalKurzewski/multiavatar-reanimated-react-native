import * as fs from "fs";
import * as path from "path";

const PKG = path.resolve(__dirname, "..");
const SRC = path.join(PKG, "scripts/multiavatar.ts");
const OUT = path.join(PKG, "src/avatarPartsData.generated.ts");

const src = fs.readFileSync(SRC, "utf8");
const lines = src.split("\n");

function readAssignment(lhsRegex: RegExp): { startIdx: number; expr: string } | null {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(lhsRegex);
    if (!m) continue;
    let expr = m[m.length - 1];
    let j = i;
    while (!expr.trimEnd().endsWith(";")) {
      j++;
      expr += "\n" + lines[j];
    }
    expr = expr.trimEnd();
    if (expr.endsWith(";")) expr = expr.slice(0, -1);
    return { startIdx: i, expr };
  }
  return null;
}

const envR = readAssignment(/^\s*const env\s*=\s*(.*)$/)!;
const headR = readAssignment(/^\s*const head\s*=\s*(.*)$/)!;
const strokeStyleR = readAssignment(/^\s*const strokeStyle\s*=\s*(.*)$/)!;

const env = new Function(`return (${envR.expr});`)() as string;
const head = new Function(`return (${headR.expr});`)() as string;
const strokeStyle = new Function(`return (${strokeStyleR.expr});`)() as string;

// Extract svgParts[XX].{clo,top,eyes,mouth}
const partRe = /^\s*svgParts\["(\d{2})"\]\.(env|clo|head|mouth|eyes|top)\s*=\s*(.*)$/;
const rawParts: Record<string, Record<string, string>> = {};
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(partRe);
  if (!m) continue;
  const [, theme, part] = m;
  let expr = m[3];
  while (!expr.trimEnd().endsWith(";")) {
    i++;
    expr += "\n" + lines[i];
  }
  expr = expr.trimEnd();
  if (expr.endsWith(";")) expr = expr.slice(0, -1);
  if (!rawParts[theme]) rawParts[theme] = {};
  const fn = new Function("env", "head", "strokeStyle", `return (${expr});`);
  rawParts[theme][part] = fn(env, head, strokeStyle) as string;
}

// Extract themes table as one big literal. Find `const themes = {` and consume balanced braces.
const themesStartIdx = src.indexOf("const themes = {");
if (themesStartIdx < 0) throw new Error("themes literal not found");
let i = src.indexOf("{", themesStartIdx);
let depth = 0;
let start = i;
for (; i < src.length; i++) {
  const c = src[i];
  if (c === "{") depth++;
  else if (c === "}") {
    depth--;
    if (depth === 0) {
      i++;
      break;
    }
  }
}
const themesLiteral = src.slice(start, i);
// strip /* */ and // line comments to be safe (some commented-out alternates inside)
const stripped = themesLiteral
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/[^\n]*/g, "");
const themes = new Function(`return (${stripped});`)() as Record<
  string,
  Record<"A" | "B" | "C", Record<"env" | "clo" | "head" | "mouth" | "eyes" | "top", string[]>>
>;

// Sanity: every theme key 00..15 present
for (let n = 0; n < 16; n++) {
  const k = n.toString().padStart(2, "0");
  if (!themes[k]) throw new Error(`themes missing ${k}`);
  if (!rawParts[k]) throw new Error(`rawParts missing ${k}`);
}

// Map theme number "00".."15" to shape name (matches rive enum names: "Female" not "Normie Female")
const SHAPE_NAMES: Record<string, string> = {
  "00": "Robo",
  "01": "Girl",
  "02": "Blonde",
  "03": "Guy",
  "04": "Country",
  "05": "Geeknot",
  "06": "Asian",
  "07": "Punk",
  "08": "Afrohair",
  "09": "Female",
  "10": "Older",
  "11": "Firehair",
  "12": "Blond",
  "13": "Ateam",
  "14": "Rasta",
  "15": "Meta",
};

type EditablePart = "clo" | "top" | "eyes" | "mouth";
const EDITABLE_PARTS: EditablePart[] = ["clo", "top", "eyes", "mouth"];

// Build output structures keyed by Shape name
const rawByShape: Record<string, Record<EditablePart, string>> = {};
const colorsAByShape: Record<string, Record<EditablePart, string[]>> = {};

for (const [num, shape] of Object.entries(SHAPE_NAMES)) {
  rawByShape[shape] = {} as Record<EditablePart, string>;
  colorsAByShape[shape] = {} as Record<EditablePart, string[]>;
  for (const p of EDITABLE_PARTS) {
    rawByShape[shape][p] = rawParts[num][p];
    colorsAByShape[shape][p] = themes[num].A[p];
  }
}

// Trim or pad color arrays to match placeholder count (multiavatar's runtime
// loop iterates by placeholder count; extra entries are dead).
for (const shape of Object.values(SHAPE_NAMES)) {
  for (const p of EDITABLE_PARTS) {
    const placeholders = (rawByShape[shape][p].match(/#(.*?);/g) ?? []).length;
    const arr = colorsAByShape[shape][p];
    if (arr.length > placeholders) {
      colorsAByShape[shape][p] = arr.slice(0, placeholders);
    } else if (arr.length < placeholders) {
      const padded = arr.slice();
      while (padded.length < placeholders) padded.push("#000");
      colorsAByShape[shape][p] = padded;
      console.warn(
        `padded ${shape}.${p}: had ${arr.length} colors, ${placeholders} placeholders`
      );
    }
  }
}

// Emit file
const lines2: string[] = [];
lines2.push("// AUTO-GENERATED — do not edit by hand.");
lines2.push("// Source: src/components/molecules/avatar/multiavatar.ts");
lines2.push("// Regenerate: bun run scripts/genAvatarPartsData.ts");
lines2.push("");
lines2.push('import type { AvatarShape, EditablePart } from "./avatarConstants";');
lines2.push("");
lines2.push("export const SHARED_HEAD_SVG = " + JSON.stringify(head) + ";");
lines2.push("export const SHARED_ENV_SVG = " + JSON.stringify(env) + ";");
lines2.push("");
lines2.push(
  "export const RAW_PART_SVG: Record<AvatarShape, Record<EditablePart, string>> = {"
);
for (const shape of Object.values(SHAPE_NAMES)) {
  lines2.push(`  ${shape}: {`);
  for (const p of EDITABLE_PARTS) {
    lines2.push(`    ${p}: ${JSON.stringify(rawByShape[shape][p])},`);
  }
  lines2.push("  },");
}
lines2.push("};");
lines2.push("");
lines2.push(
  "export const DEFAULT_PART_COLORS: Record<AvatarShape, Record<EditablePart, readonly string[]>> = {"
);
for (const shape of Object.values(SHAPE_NAMES)) {
  lines2.push(`  ${shape}: {`);
  for (const p of EDITABLE_PARTS) {
    const arr = colorsAByShape[shape][p];
    lines2.push(`    ${p}: ${JSON.stringify(arr)},`);
  }
  lines2.push("  },");
}
lines2.push("};");
lines2.push("");

fs.writeFileSync(OUT, lines2.join("\n"));
console.log(`wrote ${OUT}`);
