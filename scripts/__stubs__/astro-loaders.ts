// Stub for the `astro/loaders` virtual module. The emitter never runs the
// loader; it only reads `base` off it to resolve the collection's folder.
export function glob(opts: { pattern: string | string[]; base?: string }) {
  return { _stub: "glob" as const, ...opts };
}
