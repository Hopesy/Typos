import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// 代码块双主题：浅色主题随站点浅色模式、深色主题随深色模式。
// 名称需与下方 themes 中加载的主题文件一致。
export const CODE_THEMES = { light: "one-light", dark: "one-dark-pro" } as const;

// 使用 Shiki 的 JavaScript 正则引擎（Oniguruma-To-ES 转译），完全不依赖 WASM，
// 因此可在 Cloudflare Workers 与 Next/Turbopack 服务端 worker 中稳定运行。
// 采用细粒度打包：只引入下列语言，控制 Worker 体积。如需更多语言在此追加即可。
let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      themes: [
        import("shiki/themes/one-dark-pro.mjs"),
        import("shiki/themes/one-light.mjs"),
      ],
      langs: [
        import("shiki/langs/javascript.mjs"),
        import("shiki/langs/typescript.mjs"),
        import("shiki/langs/jsx.mjs"),
        import("shiki/langs/tsx.mjs"),
        import("shiki/langs/python.mjs"),
        import("shiki/langs/bash.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/yaml.mjs"),
        import("shiki/langs/markdown.mjs"),
        import("shiki/langs/css.mjs"),
        import("shiki/langs/html.mjs"),
        import("shiki/langs/diff.mjs"),
      ],
    });
  }
  return highlighterPromise;
}
