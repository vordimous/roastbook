// Preload that registers the astro virtual-module resolve hook.
// Used via `tsx --import ./scripts/register-astro-stubs.mjs ...`.
// (`--import` runs a module for side effects; it does not auto-register hooks,
// so we must call module.register ourselves.)
import { register } from "node:module";

register("./astro-virtual-loader.mjs", import.meta.url);
