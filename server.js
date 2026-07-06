const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile, execFileSync } = require("child_process");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const homeDir = process.env.HOME || "/Users/brainwung";
const appSupportDir = path.join(homeDir, "Library", "Application Support");
const skillTidyDataDir = path.join(appSupportDir, "skill-tidy");
const trashRoot = process.env.SKILL_TIDY_TRASH ||
  path.join(skillTidyDataDir, "skill-tidy-trash");
const configPath = process.env.SKILL_TIDY_CONFIG ||
  path.join(skillTidyDataDir, "skill-tidy.config.json");
const skillsCachePath = process.env.SKILL_TIDY_CACHE ||
  path.join(skillTidyDataDir, "skills-cache.json");

const defaultSkillRootCandidates = [
  { path: path.join(homeDir, ".codex", "skills"), platform: "Codex", deletable: true },
  { path: path.join(homeDir, ".agents", "skills"), platform: "Codex", deletable: true },
  { path: path.join(homeDir, ".codex", "plugins", "cache", "openai-api-curated"), platform: "Codex", builtin: true },
  { path: path.join(homeDir, ".codex", "plugins", "cache", "openai-primary-runtime"), platform: "Codex", builtin: true },
  { path: path.join(homeDir, ".codex", "plugins", "cache", "openai-bundled"), platform: "Codex", builtin: true },
  { path: path.join(homeDir, ".claude", "skills"), platform: "Claude", deletable: true },
  { path: path.join(homeDir, ".cc-switch", "skills"), platform: "Claude Code", deletable: true },
  { path: path.join(homeDir, ".cursor", "skills"), platform: "Cursor", deletable: true },
  { path: path.join(appSupportDir, "Cursor", "skills"), platform: "Cursor", deletable: true },
  { path: path.join(homeDir, ".windsurf", "skills"), platform: "Windsurf", deletable: true },
  { path: path.join(appSupportDir, "Windsurf", "skills"), platform: "Windsurf", deletable: true },
  { path: path.join(homeDir, ".continue", "skills"), platform: "Continue", deletable: true },
  { path: path.join(homeDir, ".gemini", "skills"), platform: "Gemini", deletable: true },
  { path: path.join(homeDir, ".opencode", "skills"), platform: "OpenCode", deletable: true }
];

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

const gitStatusCache = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function readSkillsCache() {
  try {
    if (!fs.existsSync(skillsCachePath)) {
      return {
        ok: true,
        hasCache: false,
        skills: [],
        updatedAt: ""
      };
    }

    const cached = JSON.parse(fs.readFileSync(skillsCachePath, "utf8"));
    return {
      ok: true,
      hasCache: Array.isArray(cached.skills),
      skills: Array.isArray(cached.skills) ? cached.skills : [],
      updatedAt: cached.updatedAt || ""
    };
  } catch (error) {
    return {
      ok: true,
      hasCache: false,
      skills: [],
      updatedAt: ""
    };
  }
}

function writeSkillsCache(payload) {
  fs.mkdirSync(path.dirname(skillsCachePath), { recursive: true });
  fs.writeFileSync(skillsCachePath, `${JSON.stringify({
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    updatedAt: payload.updatedAt || new Date().toISOString()
  }, null, 2)}\n`);
}

function expandHome(value) {
  const text = String(value || "");
  return text.startsWith("~/") ? path.join(homeDir, text.slice(2)) : text;
}

function normalizeRoot(rootItem) {
  if (!rootItem) return null;
  if (typeof rootItem === "string") {
    return {
      path: path.resolve(expandHome(rootItem)),
      platform: "自定义",
      deletable: false
    };
  }

  return {
    path: path.resolve(expandHome(rootItem.path)),
    platform: rootItem.platform || "自定义",
    builtin: Boolean(rootItem.builtin),
    deletable: Boolean(rootItem.deletable)
  };
}

function discoverSkillRoots() {
  const config = readConfig();
  const extraRoots = Array.isArray(config.extraSkillRoots) ? config.extraSkillRoots : [];
  const excludeRoots = new Set((Array.isArray(config.excludeRoots) ? config.excludeRoots : [])
    .map((item) => path.resolve(expandHome(item))));
  const roots = new Map();

  [...defaultSkillRootCandidates, ...extraRoots].forEach((item) => {
    const normalized = normalizeRoot(item);
    if (!normalized || !normalized.path || excludeRoots.has(normalized.path)) return;
    if (!fs.existsSync(normalized.path)) return;
    if (!fs.statSync(normalized.path).isDirectory()) return;

    const existing = roots.get(normalized.path);
    if (!existing) {
      roots.set(normalized.path, normalized);
      return;
    }

    roots.set(normalized.path, {
      ...existing,
      platform: existing.platform || normalized.platform,
      builtin: existing.builtin || normalized.builtin,
      deletable: existing.deletable || normalized.deletable
    });
  });

  return Array.from(roots.values());
}

function settingsPayload() {
  const config = readConfig();
  const extraRoots = Array.isArray(config.extraSkillRoots) ? config.extraSkillRoots : [];
  const excludeRoots = new Set((Array.isArray(config.excludeRoots) ? config.excludeRoots : [])
    .map((item) => path.resolve(expandHome(item))));
  const items = [];
  const seen = new Set();

  function pushRoot(item, source) {
    const normalized = normalizeRoot(item);
    if (!normalized || !normalized.path || seen.has(normalized.path)) return;
    seen.add(normalized.path);
    const exists = fs.existsSync(normalized.path) && fs.statSync(normalized.path).isDirectory();
    items.push({
      path: normalized.path,
      platform: normalized.platform,
      builtin: Boolean(normalized.builtin),
      deletable: Boolean(normalized.deletable),
      enabled: !excludeRoots.has(normalized.path),
      exists,
      source
    });
  }

  defaultSkillRootCandidates.forEach((item) => pushRoot(item, "默认"));
  extraRoots.forEach((item) => pushRoot(item, "自定义"));

  return {
    ok: true,
    configPath,
    roots: items
  };
}

function saveSettings(payload) {
  const roots = Array.isArray(payload.roots) ? payload.roots : [];
  const extraSkillRoots = [];
  const excludeRoots = [];

  roots.forEach((item) => {
    const normalized = normalizeRoot(item);
    if (!normalized || !normalized.path) return;
    const source = item.source === "自定义" ? "自定义" : "默认";

    if (source === "自定义") {
      extraSkillRoots.push({
        path: normalized.path,
        platform: normalized.platform || "自定义",
        builtin: Boolean(normalized.builtin),
        deletable: Boolean(normalized.deletable)
      });
    }

    if (item.enabled === false) {
      excludeRoots.push(normalized.path);
    }
  });

  const config = {
    ...readConfig(),
    extraSkillRoots,
    excludeRoots
  };
  writeConfig(config);
  return settingsPayload();
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("请求过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function runGit(repo) {
  return new Promise((resolve) => {
    const dirty = runGitSync(["status", "--short"], repo, 10000);
    if (dirty) {
      const changedFiles = dirty
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(0, 5)
        .map((line) => line.replace(/^\s*[AMDRCU?!]{1,2}\s+/, ""))
        .join("、");

      resolve({
        ok: false,
        message: `这个 skill 仓库有本地改动，为避免覆盖已停止更新。请先处理本地改动后再更新${changedFiles ? `：${changedFiles}` : "。"}`
      });
      return;
    }

    execFile("git", ["pull", "--ff-only"], { cwd: repo, timeout: 120000 }, (error, stdout, stderr) => {
      const output = `${stdout || ""}${stderr || ""}`.trim();
      if (error) {
        if (/local changes.*would be overwritten|Please commit your changes or stash/i.test(output)) {
          resolve({
            ok: false,
            message: "这个 skill 仓库有本地改动，为避免覆盖已停止更新。请先处理本地改动后再更新。"
          });
          return;
        }

        resolve({
          ok: false,
          message: output || error.message
        });
        return;
      }
      resolve({
        ok: true,
        message: output || "已是最新"
      });
    });
  });
}

function runGitSync(args, cwd, timeout = 60000) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    return "";
  }
}

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
  const remote = repo ? runGitSync(["remote", "get-url", "origin"], repo, 10000) : "";
  if (remote.includes("brainwung")) return "自制";

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

function gitRootFor(skillDir) {
  const rootPath = runGitSync(["rev-parse", "--show-toplevel"], skillDir, 10000);
  return rootPath && fs.existsSync(rootPath) ? rootPath : "";
}

function normalizeGithubUrl(remoteUrl) {
  const value = String(remoteUrl || "").trim();
  if (!value) return "";

  const sshMatch = value.match(/^git@github\.com:(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1].replace(/\.git$/, "")}`;
  }

  const httpsMatch = value.match(/^https:\/\/github\.com\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1].replace(/\.git$/, "")}`;
  }

  return "";
}

function githubUrlForRepo(repo) {
  if (!repo) return "";
  return normalizeGithubUrl(runGitSync(["remote", "get-url", "origin"], repo, 10000));
}

function gitStatusFor(repo) {
  if (!repo) return null;
  if (gitStatusCache.has(repo)) return gitStatusCache.get(repo);

  const remote = runGitSync(["remote"], repo, 10000);
  if (!remote) {
    const result = { status: "无远端", command: "" };
    gitStatusCache.set(repo, result);
    return result;
  }

  runGitSync(["fetch", "--quiet", "--all", "--prune"], repo, 60000);
  const counts = runGitSync(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], repo, 10000);
  const [aheadText, behindText] = counts.split(/\s+/);
  const behind = Number(behindText || 0);
  const dirty = runGitSync(["status", "--short"], repo, 10000);

  const result = {
    status: behind > 0
      ? `可更新 ${behind}${dirty ? "，本地有改动" : ""}`
      : `已是最新${dirty ? "，本地有改动" : ""}`,
    command: behind > 0
      ? `cd ${repo} && ${dirty ? "git status --short && " : ""}git pull --ff-only`
      : ""
  };

  gitStatusCache.set(repo, result);
  return result;
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

function uniqueTrashPath(skillDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `${stamp}-${path.basename(skillDir)}`;
  let target = path.join(trashRoot, base);
  let index = 2;

  while (fs.existsSync(target)) {
    target = path.join(trashRoot, `${base}-${index}`);
    index += 1;
  }

  return target;
}

function moveToTrash(skillDir) {
  const normalized = path.resolve(skillDir || "");
  if (!isDeletableSkillDir(normalized)) {
    return {
      ok: false,
      message: "这个 skill 不允许删除"
    };
  }

  fs.mkdirSync(trashRoot, { recursive: true });
  const target = uniqueTrashPath(normalized);
  const rootInfo = rootForPath(normalized);
  const meta = readSkillMeta(path.join(normalized, "SKILL.md"));
  const name = meta.name || path.basename(normalized);
  const desc = compactDescription(meta.description, name) || "本地安装的 skill。";
  const trashMeta = {
    originalPath: normalized,
    platform: rootInfo?.platform || "Codex",
    source: sourceForSkill(normalized, name, rootInfo),
    category: categoryForSkill(normalized, name, desc),
    folder: folderLabel(normalized, rootInfo),
    name,
    desc,
    deletedAt: new Date().toISOString()
  };

  try {
    fs.renameSync(normalized, target);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    fs.cpSync(normalized, target, { recursive: true });
    fs.rmSync(normalized, { recursive: true, force: true });
  }

  fs.writeFileSync(path.join(target, ".skill-tidy-trash.json"), `${JSON.stringify(trashMeta, null, 2)}\n`);

  return {
    ok: true,
    message: `已移到备份目录：${target}`,
    trashPath: target
  };
}

function readTrashMeta(trashDir) {
  try {
    const metaPath = path.join(trashDir, ".skill-tidy-trash.json");
    if (!fs.existsSync(metaPath)) return {};
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (error) {
    return {};
  }
}

function fallbackRestorePath(trashDir, name) {
  const rootInfo = discoverSkillRoots().find((item) => item.deletable && !item.builtin);
  return rootInfo ? path.join(rootInfo.path, name || path.basename(trashDir)) : "";
}

function trashItemForDir(trashDir) {
  const skillFile = path.join(trashDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) return null;

  const meta = readTrashMeta(trashDir);
  const skillMeta = readSkillMeta(skillFile);
  const name = meta.name || skillMeta.name || path.basename(trashDir).replace(/^\d{4}-\d{2}-\d{2}T.+?-/, "");
  const desc = meta.desc || compactDescription(skillMeta.description, name) || "已移入回收站的 skill。";
  const originalPath = meta.originalPath || fallbackRestorePath(trashDir, name);

  return {
    category: meta.category || categoryForSkill(originalPath || trashDir, name, desc),
    name,
    folder: meta.folder || path.basename(originalPath || trashDir),
    platform: meta.platform || "Codex",
    source: meta.source || "自制",
    status: "已删除",
    desc,
    path: trashDir,
    originalPath,
    deletedAt: meta.deletedAt || "",
    restorable: Boolean(originalPath)
  };
}

function listTrashSkills() {
  if (!fs.existsSync(trashRoot)) {
    return {
      ok: true,
      updatedAt: new Date().toISOString(),
      skills: []
    };
  }

  const skills = fs.readdirSync(trashRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => trashItemForDir(path.join(trashRoot, entry.name)))
    .filter(Boolean)
    .sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    skills
  };
}

function restoredSkillPayload(skillDir) {
  const rootInfo = rootForPath(skillDir);
  const skillFile = path.join(skillDir, "SKILL.md");
  const meta = readSkillMeta(skillFile);
  const name = meta.name || path.basename(skillDir);
  const desc = compactDescription(meta.description, name) || "本地安装的 skill。";
  const source = sourceForSkill(skillDir, name, rootInfo);

  return {
    category: categoryForSkill(skillDir, name, desc),
    name,
    folder: folderLabel(skillDir, rootInfo),
    platform: rootInfo?.platform || "Codex",
    source,
    status: source === "自制" ? "本地安装" : "无远端",
    githubUrl: githubUrlForRepo(gitRootFor(skillDir)) || undefined,
    deletable: isDeletableSkillDir(skillDir),
    desc,
    path: skillDir
  };
}

function restoreFromTrash(trashPath) {
  const normalized = path.resolve(trashPath || "");
  if (!directChildOf(normalized, trashRoot) || !fs.existsSync(path.join(normalized, "SKILL.md"))) {
    return {
      ok: false,
      message: "回收站中没有找到这个 skill"
    };
  }

  const trashItem = trashItemForDir(normalized);
  const target = path.resolve(trashItem?.originalPath || "");
  if (!target) {
    return {
      ok: false,
      message: "缺少原安装路径，无法恢复"
    };
  }
  if (fs.existsSync(target)) {
    return {
      ok: false,
      message: "原路径已存在同名 skill，无法自动恢复"
    };
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    fs.renameSync(normalized, target);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    fs.cpSync(normalized, target, { recursive: true });
    fs.rmSync(normalized, { recursive: true, force: true });
  }

  return {
    ok: true,
    message: "已恢复到原安装目录",
    skill: restoredSkillPayload(target)
  };
}

function openLocalPath(targetPath) {
  const normalized = path.resolve(expandHome(targetPath || ""));
  if (!normalized || !fs.existsSync(normalized)) {
    return {
      ok: false,
      message: "目录不存在"
    };
  }

  execFile("open", [normalized], (error) => {
    if (error) {
      // The response has already been sent; failures here are intentionally non-fatal.
    }
  });

  return {
    ok: true,
    message: "已打开目录"
  };
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

function isAllowedRepo(repo) {
  const normalized = path.resolve(repo || "");
  const rootInfo = rootForPath(normalized, (item) => !item.builtin);
  if (!rootInfo) return false;
  if (!fs.existsSync(normalized)) return false;
  return Boolean(runGitSync(["remote"], normalized, 10000));
}

function scanSkills() {
  gitStatusCache.clear();
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

function createServer() {
  return http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/skills") {
    try {
      const result = scanSkills();
      writeSkillsCache(result);
      send(res, 200, JSON.stringify(result), mime[".json"]);
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/skills-cache") {
    send(res, 200, JSON.stringify(readSkillsCache()), mime[".json"]);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/skills-cache") {
    try {
      const body = await readJson(req);
      writeSkillsCache(body);
      send(res, 200, JSON.stringify({ ok: true }), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    try {
      send(res, 200, JSON.stringify(settingsPayload()), mime[".json"]);
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/settings") {
    try {
      const body = await readJson(req);
      send(res, 200, JSON.stringify(saveSettings(body)), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/update") {
    try {
      const body = await readJson(req);
      const repo = body.repo;
      if (!isAllowedRepo(repo)) {
        send(res, 403, JSON.stringify({ ok: false, message: "这个目录不在允许更新列表里" }), mime[".json"]);
        return;
      }
      const result = await runGit(repo);
      send(res, result.ok ? 200 : 500, JSON.stringify(result), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/delete") {
    try {
      const body = await readJson(req);
      const result = moveToTrash(body.path);
      send(res, result.ok ? 200 : 403, JSON.stringify(result), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/trash") {
    try {
      send(res, 200, JSON.stringify(listTrashSkills()), mime[".json"]);
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/restore") {
    try {
      const body = await readJson(req);
      const result = restoreFromTrash(body.path);
      send(res, result.ok ? 200 : 400, JSON.stringify(result), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/open-path") {
    try {
      const body = await readJson(req);
      const result = openLocalPath(body.path);
      send(res, result.ok ? 200 : 404, JSON.stringify(result), mime[".json"]);
    } catch (error) {
      send(res, 400, JSON.stringify({ ok: false, message: error.message }), mime[".json"]);
    }
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(root, requestPath));
  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not Found");
      return;
    }
    send(res, 200, data, mime[path.extname(filePath)] || "application/octet-stream");
  });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`skill-tidy running at http://localhost:${port}`);
  });
}

module.exports = {
  createServer,
  scanSkills
};
