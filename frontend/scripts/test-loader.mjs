import fs from "node:fs";
import * as nodeModule from "node:module";

if (import.meta.url) {
  try {
    if (typeof nodeModule.registerHooks === "function") {
      nodeModule.registerHooks(import.meta.url);
    } else if (typeof nodeModule.register === "function") {
      nodeModule.register(import.meta.url);
    }
  } catch {
    // already registered
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".")) {
    const parent = context.parentURL ? new URL(context.parentURL) : null;
    if (parent) {
      const candidates = [
        specifier,
        `${specifier}.ts`,
        `${specifier}.tsx`,
        `${specifier}.js`,
        `${specifier}/index.ts`,
        `${specifier}/index.js`,
      ];
      for (const candidate of candidates) {
        try {
          const candidateUrl = new URL(candidate, parent);
          if (candidateUrl.protocol === "file:" && fs.existsSync(candidateUrl)) {
            return nextResolve(candidateUrl.href, context);
          }
        } catch {
          // ignore
        }
      }
    }
  }
  return nextResolve(specifier, context);
}
