// Skill Tidy — fallback skills data (首次打开无缓存时使用)
window.__SKILL_TIDY_FALLBACK_SKILLS__ = [
{
  category: "设计系统 / 组件规范",
  name: "damo-color-check",
  folder: "damo-color-check",
  source: "自制",
  status: "已是最新",
  desc: "检查 Figma 设计稿颜色是否绑定 DaMo 变量 / Color Style，并支持安全修复无歧义的裸色值。",
  path: "/Users/brainwung/.codex/skills/damo-color-check"
},
{
  category: "设计系统 / 组件规范",
  name: "feed-cards",
  folder: ".codex/skills/feed-cards",
  source: "自制",
  status: "本地副本",
  desc: "App 信息流卡片设计系统，覆盖商品卡片、原创卡片等类型，共用标签、字体、颜色和间距规则。",
  path: "/Users/brainwung/.codex/skills/feed-cards"
},
{
  category: "设计系统 / 组件规范",
  name: "feed-cards",
  folder: ".agents/skills/feed-cards",
  source: "自制",
  status: "可更新 8",
  command: "cd /Users/brainwung/.agents/skills/feed-cards && git pull --ff-only",
  desc: "新版信息流卡片 skill，除商品卡片和原创卡片外，还包含视频卡片封面播放按钮规则。",
  path: "/Users/brainwung/.agents/skills/feed-cards"
},
{
  category: "设计系统 / 组件规范",
  name: "feed-cards",
  folder: ".codex/skills/product-skill",
  source: "自制",
  status: "本地副本",
  desc: "另一份信息流卡片 skill 副本，内容与 feed-cards 接近，用于商品卡片和原创卡片规则。",
  path: "/Users/brainwung/.codex/skills/product-skill"
},
{
  category: "设计系统 / 组件规范",
  name: "good-deal-card",
  folder: ".agents/skills/product-skill",
  source: "自制",
  status: "可更新 23",
  command: "cd /Users/brainwung/.agents/skills/product-skill && git pull --ff-only",
  desc: "生成好价商品卡片基础组件，包含左图右文布局、标签、价格区和来源信息行规则。",
  path: "/Users/brainwung/.agents/skills/product-skill"
},
{
  category: "文档 / PPT / 白板",
  name: "document-visualizer",
  folder: "document-visualizer",
  source: "自制",
  status: "本地安装",
  desc: "把文档、笔记、报告、论文、Markdown 数据或结构图转成单页 HTML / SVG 可视化说明图。",
  path: "/Users/brainwung/.codex/skills/document-visualizer"
},
{
  category: "文档 / PPT / 白板",
  name: "beautiful-feishu-whiteboard",
  folder: "beautiful-feishu-whiteboard",
  source: "下载",
  status: "无远端",
  desc: "把 SVG、信息图、流程图或视觉解释内容生成可编辑的飞书 / Lark 白板，并可套用预设色彩风格。",
  path: "/Users/brainwung/.codex/skills/beautiful-feishu-whiteboard"
},
{
  category: "文档 / PPT / 白板",
  name: "guizang-ppt-skill",
  folder: "guizang-ppt-skill",
  source: "下载",
  status: "可更新 2，本地有改动",
  command: "cd /Users/brainwung/.agents/skills/guizang-ppt-skill && git status --short && git pull --ff-only",
  desc: "生成横向翻页网页 PPT，包含 WebGL 背景、章节幕封、数据大字报、图片网格等模板。",
  path: "/Users/brainwung/.agents/skills/guizang-ppt-skill"
},
{
  category: "文档 / PPT / 白板",
  name: "stitch-design-taste",
  folder: "_taste-skill-repo/skills/stitch-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "为 Google Stitch 生成 DESIGN.md，沉淀高级视觉约束、排版、色彩和动效规则。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/stitch-skill"
},
{
  category: "文档 / PPT / 白板",
  name: "documents",
  folder: "openai-primary-runtime/documents",
  source: "内置",
  status: "内置",
  desc: "创建、编辑、批注和校验 Word / DOCX 文档，支持渲染检查。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-primary-runtime/documents"
},
{
  category: "文档 / PPT / 白板",
  name: "pdf",
  folder: "openai-primary-runtime/pdf",
  source: "内置",
  status: "内置",
  desc: "读取、创建、检查、渲染和验证 PDF 文件。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-primary-runtime/pdf"
},
{
  category: "文档 / PPT / 白板",
  name: "Presentations",
  folder: "openai-primary-runtime/presentations",
  source: "内置",
  status: "内置",
  desc: "创建或编辑 PowerPoint / Google Slides 类演示文稿。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-primary-runtime/presentations"
},
{
  category: "文档 / PPT / 白板",
  name: "Spreadsheets",
  folder: "openai-primary-runtime/spreadsheets",
  source: "内置",
  status: "内置",
  desc: "创建、修改、分析和可视化电子表格文件。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-primary-runtime/spreadsheets"
},
{
  category: "视觉生成 / 审美方向",
  name: "hatch-pet",
  folder: "hatch-pet",
  source: "下载",
  status: "无远端",
  desc: "创建、修复、验证并打包 Codex 动态宠物或 spritesheet，包含视觉生成和接触表 QA。",
  path: "/Users/brainwung/.codex/skills/hatch-pet"
},
{
  category: "视觉生成 / 审美方向",
  name: "brandkit",
  folder: "_taste-skill-repo/skills/brandkit",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "生成高端品牌视觉系统、品牌指南板、Logo 方向、视觉世界和品牌展示图。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/brandkit"
},
{
  category: "视觉生成 / 审美方向",
  name: "industrial-brutalist-ui",
  folder: "_taste-skill-repo/skills/brutalist-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "工业粗粝风 UI 指导，强调机械感、瑞士网格、强字体层级和终端式视觉气质。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/brutalist-skill"
},
{
  category: "视觉生成 / 审美方向",
  name: "imagegen-frontend-mobile",
  folder: "_taste-skill-repo/skills/imagegen-frontend-mobile",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "生成高质量移动端 App 界面概念图，强调原生感、层级、统一风格和手机外框展示。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/imagegen-frontend-mobile"
},
{
  category: "视觉生成 / 审美方向",
  name: "imagegen-frontend-web",
  folder: "_taste-skill-repo/skills/imagegen-frontend-web",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "为网站每个区块生成独立横向设计参考图，适合落地页、产品页和营销页前期视觉探索。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/imagegen-frontend-web"
},
{
  category: "视觉生成 / 审美方向",
  name: "minimalist-ui",
  folder: "_taste-skill-repo/skills/minimalist-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "极简编辑风 UI 指导，偏暖中性色、清晰字体层级、扁平布局和低装饰感。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/minimalist-skill"
},
{
  category: "视觉生成 / 审美方向",
  name: "high-end-visual-design",
  folder: "_taste-skill-repo/skills/soft-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "高端网页视觉指导，约束字体、间距、阴影、卡片和动效，避免常见模板感。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/soft-skill"
},
{
  category: "视觉生成 / 审美方向",
  name: "imagegen",
  folder: ".system/imagegen",
  source: "内置",
  status: "内置",
  desc: "生成或编辑照片、插画、贴图、sprite、mockup 等位图资产。",
  path: "/Users/brainwung/.codex/skills/.system/imagegen"
},
{
  category: "前端实现 / 改版",
  name: "gpt-taste",
  folder: "_taste-skill-repo/skills/gpt-tasteskill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "偏高级 UX/UI 与 GSAP 动效实现，适合强调滚动、叙事节奏和编辑式页面表现的网页。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/gpt-tasteskill"
},
{
  category: "前端实现 / 改版",
  name: "image-to-code",
  folder: "_taste-skill-repo/skills/image-to-code-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "先生成或分析设计图，再尽量还原成网站代码，适合视觉还原要求高的页面任务。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/image-to-code-skill"
},
{
  category: "前端实现 / 改版",
  name: "redesign-existing-projects",
  folder: "_taste-skill-repo/skills/redesign-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "升级已有网站或应用视觉质量，在不破坏功能的前提下做前端界面重设计。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/redesign-skill"
},
{
  category: "前端实现 / 改版",
  name: "design-taste-frontend",
  folder: "_taste-skill-repo/skills/taste-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "面向落地页、作品集和改版的前端审美 skill，强调非模板化、真实设计系统和交付前检查。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/taste-skill"
},
{
  category: "前端实现 / 改版",
  name: "design-taste-frontend-v1",
  folder: "_taste-skill-repo/skills/taste-skill-v1",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "旧版 taste skill，保留给需要兼容 v1 行为的前端视觉任务。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/taste-skill-v1"
},
{
  category: "前端实现 / 改版",
  name: "full-output-enforcement",
  folder: "_taste-skill-repo/skills/output-skill",
  source: "下载",
  status: "可更新 36",
  command: "cd /Users/brainwung/.agents/skills/_taste-skill-repo && git pull --ff-only",
  desc: "要求完整输出代码或长内容，避免省略、占位和被截断，适合必须完整交付的任务。",
  path: "/Users/brainwung/.agents/skills/_taste-skill-repo/skills/output-skill"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-use",
  folder: "figma/figma-use",
  source: "内置",
  status: "内置",
  desc: "Figma 写入操作前置 skill，用于创建、编辑、删除节点和绑定变量等操作。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-use"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-generate-design",
  folder: "figma/figma-generate-design",
  source: "内置",
  status: "内置",
  desc: "把应用页面、弹窗、抽屉、面板等多区块界面生成或同步到 Figma。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-generate-design"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-generate-library",
  folder: "figma/figma-generate-library",
  source: "内置",
  status: "内置",
  desc: "从代码或规范构建设计系统、变量、tokens、组件和主题。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-generate-library"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-create-new-file",
  folder: "figma/figma-create-new-file",
  source: "内置",
  status: "内置",
  desc: "创建新的 Figma / FigJam / Slides 文件前必须加载的前置 skill。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-create-new-file"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-generate-diagram",
  folder: "figma/figma-generate-diagram",
  source: "内置",
  status: "内置",
  desc: "在 FigJam / Figma 中生成流程图、架构图、时序图、ERD、状态图等。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-generate-diagram"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-code-connect",
  folder: "figma/figma-code-connect",
  source: "内置",
  status: "内置",
  desc: "维护 Figma Code Connect 映射文件，把设计组件对应到代码组件。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-code-connect"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-implement-motion",
  folder: "figma/figma-implement-motion",
  source: "内置",
  status: "内置",
  desc: "把 Figma motion / animation 翻译成可落地的应用代码动效。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-implement-motion"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-use-motion",
  folder: "figma/figma-use-motion",
  source: "内置",
  status: "内置",
  desc: "配合 figma-use 读取或创建 Figma 动效、时间线和关键帧。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-use-motion"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-swiftui",
  folder: "figma/figma-swiftui",
  source: "内置",
  status: "内置",
  desc: "SwiftUI 与 Figma 双向转换，适合 iOS / iPadOS 设计和代码同步。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-swiftui"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-use-figjam",
  folder: "figma/figma-use-figjam",
  source: "内置",
  status: "内置",
  desc: "FigJam 场景下配合 use_figma 操作白板内容。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-use-figjam"
},
{
  category: "Figma / 设计文件工作流",
  name: "figma-use-slides",
  folder: "figma/figma-use-slides",
  source: "内置",
  status: "内置",
  desc: "Figma Slides 场景下配合 use_figma 操作演示文稿。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-api-curated/figma/3fdeeb49/skills/figma-use-slides"
},
{
  category: "Codex / 系统工具",
  name: "openai-docs",
  folder: ".system/openai-docs",
  source: "内置",
  status: "内置",
  desc: "查询 OpenAI / Codex 官方文档和产品使用说明。",
  path: "/Users/brainwung/.codex/skills/.system/openai-docs"
},
{
  category: "Codex / 系统工具",
  name: "skill-creator",
  folder: ".system/skill-creator",
  source: "内置",
  status: "内置",
  desc: "创建或更新 Codex skill 的指导 skill。",
  path: "/Users/brainwung/.codex/skills/.system/skill-creator"
},
{
  category: "Codex / 系统工具",
  name: "skill-installer",
  folder: ".system/skill-installer",
  source: "内置",
  status: "内置",
  desc: "从 curated 列表或 GitHub 仓库安装 Codex skills。",
  path: "/Users/brainwung/.codex/skills/.system/skill-installer"
},
{
  category: "Codex / 系统工具",
  name: "plugin-creator",
  folder: ".system/plugin-creator",
  source: "内置",
  status: "内置",
  desc: "创建和脚手架化 Codex plugin 目录与 manifest。",
  path: "/Users/brainwung/.codex/skills/.system/plugin-creator"
},
{
  category: "Codex / 系统工具",
  name: "template-creator",
  folder: "openai-primary-runtime/template-creator",
  source: "内置",
  status: "内置",
  desc: "创建或更新可复用的个人 Codex artifact-template skill。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-primary-runtime/template-creator"
},
{
  category: "浏览器 / 桌面控制",
  name: "control-in-app-browser",
  folder: "openai-bundled/browser",
  source: "内置",
  status: "内置",
  desc: "控制 Codex 内置浏览器，打开页面、点击、截图和验证本地预览。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-bundled/browser"
},
{
  category: "浏览器 / 桌面控制",
  name: "control-chrome",
  folder: "openai-bundled/chrome",
  source: "内置",
  status: "内置",
  desc: "控制用户 Chrome 浏览器，适合依赖登录态或现有标签页的任务。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-bundled/chrome"
},
{
  category: "浏览器 / 桌面控制",
  name: "computer-use",
  folder: "openai-bundled/computer-use",
  source: "内置",
  status: "内置",
  desc: "通过点击、输入、滚动等方式操作本地 Mac 应用界面。",
  path: "/Users/brainwung/.codex/plugins/cache/openai-bundled/computer-use"
}
];
