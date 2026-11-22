# Typos 品牌图标 · 初版

2026-11-21 按用户确认的粗笔画圆角字母方向制作。主轮廓是原创 T，宽横画和厚竖画以圆角连接，右上方保留一个浅切口。参考 Astryx 的块面与圆角气质，路径独立绘制。

## 主文件

独立 T 图标以 `typos-mark.svg` 为编辑源：64×64 画布、单个闭合路径，无字体、外部链接、滤镜和脚本。图标的其他格式从主路径生成。

完整 TYPOS 定制字标以 `typos-lettering.svg` 为编辑源：五个独立字母路径，其中 T 复用主图标轮廓，Y/P/O/S 采用统一粗笔画圆角结构。字标无需安装字体，`glyph-t` 至 `glyph-s` 可分别编辑。完整字标素材包位于用户图片目录的 `typos-wordmark`。

颜色：炭黑 `#171717`，反白 `#F6F4EE`，应用图标底色 `#141717`。

| 文件 | 用途 |
| --- | --- |
| `typos-mark.svg` | 浅色背景的透明底矢量主图形 |
| `typos-mark-inverse.svg` | 深色背景的透明底反白图形 |
| `typos-lettering.svg` | 完整 TYPOS 定制矢量字标，透明底黑字 |
| `typos-mark.png` / `typos-mark-inverse.png` | 对应 1024×1024 透明 PNG |
| `typos-app-icon.svg` / `typos-app-icon.png` | 深色圆角方形应用图标，PNG 为 512×512 |
| `favicon.svg` | 透明 SVG favicon，随系统明暗主题切换填色 |
| `favicon.ico` | 内含 16、32、48px 的多尺寸图标 |
| `favicon-16.png` / `favicon-24.png` / `favicon-32.png` / `favicon-48.png` | 深底反白的小尺寸图标；图形比例比大应用图标略大 |
| `apple-touch-icon.png` | 180×180 全底色 PNG，由系统裁切外轮廓 |
| `preview.png` | 1440×960 深浅主题、原尺寸与应用图标展示板 |

## 使用

- 矢量和透明 PNG 自带留白，直接等比缩放。
- 导航及头像可使用独立 T；正文排版无需依赖图标。
- 小尺寸使用已导出的 favicon 文件，16px 已进行视觉核对。
- 本套素材入口为 `/brand/typos/`。`BrandMark` 组件直接引用 `typos-mark.svg`，用于导航、移动菜单、相册页、Dock 和后台侧栏；颜色随页面明暗主题切换。
- `BrandWordmark` 直接引用 `typos-lettering.svg`，用于导航中的品牌文字、手机顶栏/菜单、相册品牌名、展开的后台侧栏及页脚。首页 `Typos Blog` 按用户要求保留原文字与 Shuffle 动画。
- 根 layout 的 metadata 引用此目录的 SVG/PNG favicon 与 180px Apple touch icon；`src/app/favicon.ico` 及 `public/favicon*` 兼容入口由本套导出更新。修改主图形后同步这些派生文件。

对应说明及验收见 `docs/histories/2026-11/20261121-typos-brand-icon.md`。
