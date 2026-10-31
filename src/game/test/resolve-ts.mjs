// Lets `node --test` load the game modules, which import siblings without a ".ts" extension (Vite style).
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) specifier = new URL(`../../${specifier.slice(2)}`, import.meta.url).href;
    try {
      return next(specifier, context);
    } catch (error) {
      if ((specifier.startsWith(".") || specifier.startsWith("file:")) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
        return next(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
