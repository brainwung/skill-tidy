const fs = require("fs");
const path = require("path");

const categoryOrder = [
  "设计系统 / 组件规范",
  "文档 / PPT / 白板",
  "视觉生成 / 审美方向",
  "前端实现 / 改版",
  "Figma / 设计文件工作流",
  "Notion / 文档协作",
  "Codex / 系统工具",
  "浏览器 / 桌面控制"
];

const selfSkillNames = new Set([
  "damo-color-check",
  "document-visualizer",
  "feed-cards",
  "good-deal-card",
  "product-skill"
]);

const conciseDescriptions = {
  "-21risk-automation": "通过 Rube MCP 自动化处理 21risk 相关任务。",
  "beautiful-feishu-whiteboard": "生成可编辑的飞书白板、信息图和视觉说明图。",
  "brandkit": "生成品牌视觉系统、Logo 方向和品牌展示图。",
  "computer-use": "通过点击、输入和滚动操作本地 Mac 应用。",
  "control-chrome": "控制用户 Chrome 浏览器，适合需要登录态的任务。",
  "control-in-app-browser": "控制 Codex 内置浏览器，做预览、点击和截图检查。",
  "damo-color-check": "检查 Figma 颜色是否绑定 DaMo 规范变量，并支持安全修复。",
  "design-taste-frontend": "用于落地页、作品集和改版的高质量前端审美指导。",
  "design-taste-frontend-v1": "旧版前端审美 skill，保留给兼容 v1 的任务。",
  "document-visualizer": "把文档、报告、笔记或结构图转成单页 HTML/SVG 视觉稿。",
  "documents": "创建、编辑和校验 Word / DOCX 文档。",
  "feed-cards": "App 信息流卡片规范，覆盖商品、原创和视频卡片。",
  "figma-code-connect": "维护 Figma 组件与代码组件的 Code Connect 映射。",
  "figma-create-new-file": "创建新的 Figma / FigJam / Slides 文件前置说明。",
  "figma-generate-design": "把应用页面或布局生成到 Figma 设计稿中。",
  "figma-generate-diagram": "在 FigJam / Figma 中生成流程图、架构图和时序图。",
  "figma-generate-library": "从代码或规范搭建设计系统、变量和组件库。",
  "figma-implement-motion": "把 Figma 动效转换成可落地的前端代码。",
  "figma-swiftui": "SwiftUI 与 Figma 的双向转换说明。",
  "figma-use": "Figma 写入和结构化读取操作的前置说明。",
  "figma-use-figjam": "FigJam 场景下的 Figma 操作说明。",
  "figma-use-motion": "读取或创建 Figma 动效、时间线和关键帧。",
  "figma-use-slides": "Figma Slides 场景下的操作说明。",
  "full-output-enforcement": "要求完整输出，避免省略、占位和截断。",
  "good-deal-card": "好价商品卡片规范，覆盖图文布局、标签、价格和来源信息。",
  "gpt-taste": "高级 UX/UI 与 GSAP 动效实现指导。",
  "guizang-ppt-skill": "生成横向翻页网页 PPT，包含多种视觉页面模板。",
  "hatch-pet": "创建、修复和打包 Codex 动态宠物素材。",
  "high-end-visual-design": "高端网页视觉指导，约束字体、间距、阴影和动效。",
  "image-to-code": "先分析设计图，再尽量还原成网页代码。",
  "imagegen": "生成或编辑照片、插画、贴图和 mockup 等位图资产。",
  "imagegen-frontend-mobile": "生成高质量移动端 App 界面概念图。",
  "imagegen-frontend-web": "为网站各区块生成独立横向设计参考图。",
  "industrial-brutalist-ui": "工业粗粝风 UI 指导，强调网格、字体层级和机械感。",
  "minimalist-ui": "极简编辑风 UI 指导，强调克制排版和低装饰感。",
  "notion-knowledge-capture": "把对话、决策和知识沉淀到 Notion 页面。",
  "notion-meeting-intelligence": "结合 Notion 上下文准备会议材料。",
  "notion-research-documentation": "从 Notion 资料中研究并整理结构化文档。",
  "notion-spec-to-implementation": "把 Notion 规格转成实现计划、任务和进度。",
  "openai-docs": "查询 OpenAI / Codex 官方文档和产品说明。",
  "pdf": "读取、创建、渲染和检查 PDF 文件。",
  "plugin-creator": "创建 Codex 插件目录和基础配置。",
  "Presentations": "创建或编辑 PowerPoint / Google Slides 演示文稿。",
  "redesign-existing-projects": "在不破坏功能的前提下升级已有网站或应用视觉。",
  "skill-creator": "创建或更新 Codex skill 的指导说明。",
  "skill-installer": "从 curated 列表或 GitHub 仓库安装 Codex skills。",
  "Spreadsheets": "创建、修改、分析和可视化电子表格。",
  "stitch-design-taste": "为 Google Stitch 生成高质量 DESIGN.md 设计规范。",
  "template-creator": "创建或更新可复用的 Codex artifact-template skill。"
};

function createSkillsService({
  homeDir,
  discoverSkillRoots,
  gitRootFor,
  githubUrlForRepo,
  gitStatusFor,
  clearGitStatusCache,
  runGitSyncResult
}) {
  function findSkillFiles(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules" || entry.name.startsWith("plugin-backup-")) return;
        findSkillFiles(fullPath, files);
        return;
      }
      if (entry.isFile() && entry.name === "SKILL.md") {
        files.push(fullPath);
      }
    });

    return files;
  }

  function unquoteYaml(value) {
    const trimmed = String(value || "").trim();
    if (
      (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).replace(/\\"/g, "\"");
    }
    return trimmed;
  }

  function readSkillMeta(skillFile) {
    const content = fs.readFileSync(skillFile, "utf8");
    const lines = content.split(/\r?\n/);
    const meta = {};

    if (lines[0] === "---") {
      for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (line === "---") break;
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (match) {
          const key = match[1];
          const value = match[2];
          if (/^[>|]/.test(value.trim())) {
            const block = [];
            index += 1;
            while (index < lines.length && lines[index] !== "---") {
              const blockLine = lines[index];
              if (/^[A-Za-z0-9_-]+:\s*/.test(blockLine)) {
                index -= 1;
                break;
              }
              block.push(blockLine.replace(/^\s{2,}/, ""));
              index += 1;
            }
            meta[key] = block.join(value.trim().startsWith("|") ? "\n" : " ").trim();
          } else {
            meta[key] = unquoteYaml(value);
          }
        }
      }
    }

    if (!meta.name) {
      const heading = lines.find((line) => line.startsWith("# "));
      meta.name = heading ? heading.replace(/^#\s+/, "").trim() : path.basename(path.dirname(skillFile));
    }
    if (!meta.description) {
      const paragraph = lines.find((line) => line.trim() && !line.startsWith("#") && line !== "---");
      meta.description = paragraph || "本地安装的 Codex skill。";
    }

    return meta;
  }

  function compactDescription(value, name) {
    if (conciseDescriptions[name]) {
      return conciseDescriptions[name];
    }

    const text = String(value || "")
      .replace(/\s+/g, " ")
      .trim();

    const cleaned = text
      .replace(/\s*当用户提到.*$/u, "")
      .replace(/\s+Triggers?:.*$/iu, "")
      .replace(/^Use when\s+/iu, "")
      .replace(/\s+Use when.*$/iu, "")
      .replace(/\s+Do not use.*$/iu, "");

    if (cleaned.length <= 54) return cleaned;
    return `${cleaned.slice(0, 54)}...`;
  }

  function isBuiltInPath(skillDir, rootInfo = null) {
    return Boolean(rootInfo && rootInfo.builtin) ||
      skillDir.includes(path.join(homeDir, ".codex", "skills", ".system")) ||
      skillDir.includes(path.join(homeDir, ".codex", "plugins", "cache"));
  }

  function sourceForSkill(skillDir, name, rootInfo = null) {
    if (isBuiltInPath(skillDir, rootInfo)) return "内置";
    if (selfSkillNames.has(name) || selfSkillNames.has(path.basename(skillDir))) return "自制";

    const repo = gitRootFor(skillDir);
    const remoteResult = repo ? runGitSyncResult(["remote", "get-url", "origin"], repo, 10000) : null;
    if (remoteResult?.ok && remoteResult.output.includes("brainwung")) return "自制";

    return "下载";
  }

  function categoryForSkill(skillDir, name, description) {
    const text = `${skillDir} ${name} ${description}`.toLowerCase();

    if (text.includes("figma")) return "Figma / 设计文件工作流";
    if (text.includes("notion")) return "Notion / 文档协作";
    if (text.includes("browser") || text.includes("chrome") || text.includes("computer-use")) return "浏览器 / 桌面控制";
    if (text.includes("openai-docs") || text.includes("skill-") || text.includes("plugin-") || text.includes("template-creator")) return "Codex / 系统工具";
    if (text.includes("document") || text.includes("pdf") || text.includes("ppt") || text.includes("presentation") || text.includes("spreadsheet") || text.includes("whiteboard") || text.includes("stitch")) return "文档 / PPT / 白板";
    if (text.includes("damo") || text.includes("color") || text.includes("card") || text.includes("component") || text.includes("design system") || text.includes("组件") || text.includes("规范")) return "设计系统 / 组件规范";
    if (text.includes("brand") || text.includes("imagegen") || text.includes("visual") || text.includes("minimalist") || text.includes("brutalist") || text.includes("pet")) return "视觉生成 / 审美方向";
    if (text.includes("frontend") || text.includes("ui") || text.includes("code") || text.includes("redesign") || text.includes("gsap") || text.includes("taste")) return "前端实现 / 改版";

    return "Codex / 系统工具";
  }

  function folderLabel(skillDir, rootInfo = null) {
    if (skillDir.includes("/openai-api-curated/figma/")) {
      return `figma/${path.basename(skillDir)}`;
    }
    if (skillDir.includes("/openai-api-curated/notion/")) {
      return `notion/${path.basename(skillDir)}`;
    }
    if (skillDir.includes("/openai-primary-runtime/")) {
      return `openai-primary-runtime/${path.basename(skillDir)}`;
    }
    if (skillDir.includes("/openai-bundled/")) {
      return `openai-bundled/${path.basename(skillDir)}`;
    }
    if (rootInfo && rootInfo.path) {
      const relative = path.relative(rootInfo.path, skillDir);
      if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
        return relative;
      }
    }

    return path.basename(skillDir);
  }

  function statusForSkill(skillDir, source, rootInfo = null) {
    if (isBuiltInPath(skillDir, rootInfo)) return { status: "内置", command: "" };

    const repo = gitRootFor(skillDir);
    const gitStatus = repo ? gitStatusFor(repo) : null;
    if (gitStatus) return gitStatus;

    return {
      status: source === "自制" ? "本地安装" : "无远端",
      command: ""
    };
  }

  function directChildOf(child, parent) {
    const relative = path.relative(parent, child);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative) && !relative.includes(path.sep);
  }

  function insideRoot(child, parent) {
    const relative = path.relative(parent, child);
    return !relative || (!relative.startsWith("..") && !path.isAbsolute(relative));
  }

  function rootForPath(targetPath, predicate = () => true) {
    const normalized = path.resolve(targetPath || "");
    return discoverSkillRoots().find((item) => predicate(item) && insideRoot(normalized, item.path));
  }

  function isDeletableSkillDir(skillDir) {
    const normalized = path.resolve(skillDir || "");
    const rootInfo = rootForPath(normalized, (item) => item.deletable && !item.builtin);

    if (!fs.existsSync(path.join(normalized, "SKILL.md"))) return false;
    if (!rootInfo) return false;

    return true;
  }

  function duplicateScore(item) {
    let score = 0;
    if (item.command) score += 50;
    if (String(item.status).startsWith("可更新")) score += 30;
    if (gitRootFor(item.path)) score += 20;
    if (!item.folder.includes("/")) score += 12;
    if (path.basename(item.path).toLowerCase() === item.name.toLowerCase()) score += 10;
    if (item.path.includes("/.agents/skills/") || item.path.includes("/.claude/skills/")) score += 6;
    if (item.path.includes("/.codex/skills/")) score += 3;
    if (item.desc) score += 2;
    return score;
  }

  function dedupeSkills(items) {
    const selected = new Map();

    items.forEach((item) => {
      const key = `${item.platform}|${item.name.toLowerCase()}`;
      const current = selected.get(key);
      if (!current || duplicateScore(item) > duplicateScore(current)) {
        selected.set(key, item);
      }
    });

    return Array.from(selected.values());
  }

  function scanSkills() {
    clearGitStatusCache();
    const skillRoots = discoverSkillRoots();
    const files = skillRoots.flatMap((skillRoot) =>
      findSkillFiles(skillRoot.path).map((skillFile) => ({
        skillFile,
        platform: skillRoot.platform,
        rootInfo: skillRoot
      }))
    );
    const seen = new Set();
    const skills = dedupeSkills(files
      .map(({ skillFile, platform, rootInfo }) => {
        const skillDir = path.dirname(skillFile);
        if (seen.has(skillDir)) return null;
        seen.add(skillDir);

        const meta = readSkillMeta(skillFile);
        const name = meta.name || path.basename(skillDir);
        const desc = compactDescription(meta.description, name) || "本地安装的 skill。";
        const source = sourceForSkill(skillDir, name, rootInfo);
        const repo = gitRootFor(skillDir);
        const status = statusForSkill(skillDir, source, rootInfo);
        const githubUrl = githubUrlForRepo(repo);

        return {
          category: categoryForSkill(skillDir, name, desc),
          name,
          folder: folderLabel(skillDir, rootInfo),
          platform,
          source,
          status: status.status,
          command: status.command || undefined,
          githubUrl: githubUrl || undefined,
          deletable: isDeletableSkillDir(skillDir),
          desc,
          path: skillDir
        };
      })
      .filter(Boolean))
      .sort((a, b) => {
        const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        const sourceDiff = ["自制", "下载", "内置"].indexOf(a.source) - ["自制", "下载", "内置"].indexOf(b.source);
        if (sourceDiff !== 0) return sourceDiff;
        return a.name.localeCompare(b.name, "zh-CN");
      });

    return {
      ok: true,
      updatedAt: new Date().toISOString(),
      skills
    };
  }

  return {
    readSkillMeta,
    compactDescription,
    sourceForSkill,
    categoryForSkill,
    folderLabel,
    directChildOf,
    rootForPath,
    isDeletableSkillDir,
    scanSkills
  };
}

module.exports = {
  categoryOrder,
  createSkillsService
};
