import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import ts from "typescript";
import path from "node:path";
await mkdir("apps-script", { recursive: true });
await build({
  entryPoints: ["src/lib/apps-script-domain.ts"],
  bundle: true,
  format: "iife",
  globalName: "ValoraDomain",
  platform: "neutral",
  target: "es2020",
  outfile: "apps-script/Domain.gs",
  legalComments: "inline",
});
// Export the event seed without executing server-side modules or requiring a TS runner.
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const mod = { exports: {} };
  modules.set(file, mod);
  const source = ts.transpileModule(ts.sys.readFile(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const requireLocal = (specifier) => {
    if (specifier.startsWith("@/"))
      return load("src/" + specifier.slice(2) + ".ts");
    if (specifier.startsWith("."))
      return load(path.resolve(path.dirname(file), specifier) + ".ts");
    throw Error("Unexpected seed dependency: " + specifier);
  };
  new Function("module", "exports", "require", source)(
    mod,
    mod.exports,
    requireLocal
  );
  return mod.exports;
}
const { events } = load("src/data/events.ts");
await writeFile(
  "apps-script/Config.gs",
  "// Generated from src/data/events.ts. Rebuild after event configuration changes.\nvar VALORA_EVENTS = " +
    JSON.stringify(events, null, 2) +
    ";\n"
);
console.log("Generated Apps Script domain bundle and event configuration.");
