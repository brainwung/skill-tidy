const fs = require("fs");
const path = require("path");

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

function normalizeCachedPayload(value) {
  return {
    ok: true,
    hasCache: Array.isArray(value?.skills),
    skills: Array.isArray(value?.skills) ? value.skills : [],
    updatedAt: value?.updatedAt || ""
  };
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
      return normalizeCachedPayload(null);
    }

    return normalizeCachedPayload(JSON.parse(fs.readFileSync(skillsCachePath, "utf8")));
  } catch (error) {
    return normalizeCachedPayload(null);
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

module.exports = {
  homeDir,
  appSupportDir,
  skillTidyDataDir,
  trashRoot,
  configPath,
  skillsCachePath,
  defaultSkillRootCandidates,
  normalizeCachedPayload,
  readConfig,
  writeConfig,
  readSkillsCache,
  writeSkillsCache,
  expandHome,
  normalizeRoot,
  discoverSkillRoots,
  settingsPayload,
  saveSettings
};
