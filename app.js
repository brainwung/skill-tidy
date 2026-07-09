  // 从 fallback-skills.js 加载（避免把 40+ 条硬编码到主脚本里）
  let skills = window.__SKILL_TIDY_FALLBACK_SKILLS__ || [];


const sourceClass = {
  "自制": "self",
  "下载": "download",
  "内置": "builtin"
};

const platformClass = {
  "Codex": "codex",
  "Claude": "claude",
  "Claude Code": "claude-code",
  "Cursor": "cursor",
  "Windsurf": "windsurf",
  "Continue": "continue",
  "Gemini": "gemini",
  "OpenCode": "opencode"
};

const categoryLabels = {
  "设计系统 / 组件规范": "设计规范",
  "文档 / PPT / 白板": "文档演示",
  "视觉生成 / 审美方向": "视觉生成",
  "前端实现 / 改版": "前端实现",
  "Figma / 设计文件工作流": "Figma",
  "Notion / 文档协作": "Notion",
  "Codex / 系统工具": "系统工具",
  "浏览器 / 桌面控制": "浏览器"
};

let activeMode = "category";
let activeFilter = "all";
let scanState = "initial";
let scanProgress = 10;
let scanProgressTimer = null;
let settingsRoots = [];
let settingsLoaded = false;
let hasSkillData = false;
let trashSkills = [];
let trashLoaded = false;
const modesWithoutSkillList = new Set(["settings", "trash", "changelog"]);
const appUpdate = {
  currentVersion: "0.1.5",
  latestVersion: "0.1.5",
  available: false,
  releaseUrl: "https://github.com/brainwung/skill-tidy/releases/latest",
  apiUrl: "https://api.github.com/repos/brainwung/skill-tidy/releases/latest"
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function folderHref(path) {
  return encodeURI("file://" + path);
}

function folderIcon() {
  return `<img src="./icon/article-manage.svg" alt="">`;
}

function repoPathFromCommand(command) {
  const match = String(command || "").match(/^cd\s+(.+?)\s+&&/);
  return match ? match[1] : "";
}

function cleanRootPath(value) {
  const text = String(value || "").trim();
  return text.length > 1 ? text.replace(/\/+$/, "") : text;
}

function categoryLabel(category) {
  return categoryLabels[category] || category;
}

function platformLabel(platform) {
  return platform || "Codex";
}

function isSkillListMode(mode = activeMode) {
  return !modesWithoutSkillList.has(mode);
}

function canRenderFilters() {
  return isSkillListMode() && scanState === "ready";
}

function ensureLocalService(actionText) {
  if (location.protocol !== "file:") return true;
  showToast(`需要通过本地服务打开，才能${actionText}`);
  return false;
}

function categoryOptions(baseSkills = skills) {
  const seen = new Set();
  const options = [];
  baseSkills.forEach((item) => {
    if (!item.category || seen.has(item.category)) return;
    seen.add(item.category);
    options.push({
      value: item.category,
      label: categoryLabel(item.category)
    });
  });
  return options;
}

function platformOptions() {
  return Array.from(new Set(skills.map((item) => platformLabel(item.platform))))
    .map((platform) => ({ value: platform, label: platform }));
}

function sourceOptions() {
  const sourceOrder = ["内置", "下载", "自制"];
  const existing = new Set(skills.map((item) => item.source));
  return sourceOrder
    .filter((source) => existing.has(source))
    .map((source) => ({ value: source, label: source }));
}

function baseSkillsForMode() {
  if (!isSkillListMode()) return [];
  return activeMode === "mine"
    ? skills.filter((item) => item.source === "自制")
    : skills;
}

function filterOptions() {
  if (!canRenderFilters()) return [];
  if (activeMode === "platform") return platformOptions();
  if (activeMode === "source") return sourceOptions();
  return categoryOptions(baseSkillsForMode());
}

function syncActiveFilter() {
  const optionValues = filterOptions().map((item) => item.value);
  if (activeFilter !== "all" && !optionValues.includes(activeFilter)) {
    activeFilter = "all";
  }
}

function visibleSkills() {
  const items = baseSkillsForMode();
  if (activeFilter === "all") return items;

  if (activeMode === "platform") {
    return items.filter((item) => platformLabel(item.platform) === activeFilter);
  }

  if (activeMode === "source") {
    return items.filter((item) => item.source === activeFilter);
  }

  return items.filter((item) => item.category === activeFilter);
}

function renderModeNav() {
  document.querySelectorAll("#modeNav .mode-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.mode === activeMode);
  });
  document.getElementById("showChangelog")?.classList.toggle("is-active", activeMode === "changelog");
}

function setMainPaneLayout(layout = "panel") {
  document.querySelector(".main-pane")?.setAttribute("data-layout", layout);
}

function renderAppUpdateStatus() {
  const versionText = document.getElementById("sidebarVersionText");
  const badge = document.getElementById("sidebarVersionBadge");
  if (versionText) versionText.textContent = `Version ${appUpdate.currentVersion}`;
  if (badge) badge.hidden = !appUpdate.available;
}

function normalizeVersion(value) {
  return String(value || "").trim().replace(/^v/i, "");
}

function compareVersions(a, b) {
  const left = normalizeVersion(a).split(".").map((part) => Number(part) || 0);
  const right = normalizeVersion(b).split(".").map((part) => Number(part) || 0);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function checkAppUpdate() {
  try {
    const response = await fetch(appUpdate.apiUrl, { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json();
    const latest = normalizeVersion(result.tag_name || result.name || "");
    if (!latest) return;
    if (compareVersions(latest, appUpdate.currentVersion) > 0) {
      appUpdate.latestVersion = latest;
      appUpdate.releaseUrl = result.html_url || appUpdate.releaseUrl;
      appUpdate.available = true;
    }
    renderAppUpdateStatus();
    if (activeMode === "changelog") renderChangelog();
  } catch (error) {
    // Offline or GitHub API failures should not affect local skill management.
  }
}

function renderFilterTabs() {
  const filterBar = document.querySelector(".filter-bar");
  const tabs = document.getElementById("filterTabs");
  if (filterBar) {
    filterBar.classList.toggle("is-hidden", !canRenderFilters());
  }

  if (!canRenderFilters()) {
    tabs.innerHTML = "";
    return;
  }
  syncActiveFilter();
  const options = [{ value: "all", label: "全部" }, ...filterOptions()];
  const html = options.map((item) => {
    const activeClass = item.value === activeFilter ? " is-active" : "";
    const label = escapeHtml(item.label);
    return `<button class="filter-tab${activeClass}" type="button" data-filter="${escapeHtml(item.value)}" data-label="${label}"><span>${label}</span></button>`;
  }).join("");
  tabs.innerHTML = html;
  keepActiveTabVisible("nearest");
}

function keepActiveTabVisible(inline = "center") {
  window.requestAnimationFrame(() => {
    const activeTab = document.querySelector("#filterTabs .filter-tab.is-active");
    if (!activeTab) return;
    activeTab.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline
    });
  });
}

function updateGlobalActions() {
  const updateAllButton = document.getElementById("updateAll");
  const refreshButton = document.getElementById("refreshList");
  if (!updateAllButton || !refreshButton) return;

  const isTrashMode = activeMode === "trash";

  if (isTrashMode) {
    updateAllButton.hidden = true;
    refreshButton.textContent = "一键清空";
    refreshButton.disabled = !trashSkills || trashSkills.length === 0;
    return;
  }

  const updatableCount = skills.filter((item) => {
    const status = String(item.status || "");
    return status.startsWith("可更新") && !status.includes("本地有改动") && item.command;
  }).length;
  updateAllButton.hidden = false;
  updateAllButton.disabled = scanState !== "ready" || updatableCount === 0;
  updateAllButton.textContent = "一键更新";
  refreshButton.textContent = "刷新";
  refreshButton.disabled = scanState === "scanning";
}

function startScanProgress() {
  stopScanProgress();
  scanProgress = 10;
  scanProgressTimer = window.setInterval(() => {
    if (scanState !== "scanning") {
      stopScanProgress();
      return;
    }
    scanProgress = Math.min(scanProgress + 7, 92);
    const text = document.getElementById("scanProgressText");
    if (text) text.textContent = `扫描中 ${scanProgress}%`;
  }, 520);
}

function stopScanProgress() {
  if (scanProgressTimer) {
    window.clearInterval(scanProgressTimer);
    scanProgressTimer = null;
  }
}

function statePanelMarkup(kind) {
  if (kind === "scanning") {
    return `
      <section class="state-panel" aria-label="扫描中">
        <div class="state-content">
          <div class="state-copy">
            <div class="radar-scan" aria-hidden="true">
              <span class="radar-dot is-large one"></span>
              <span class="radar-dot medium two"></span>
              <span class="radar-dot three"></span>
            </div>
            <p class="state-text" id="scanProgressText">扫描中 ${scanProgress}%</p>
          </div>
        </div>
      </section>
    `;
  }

  if (kind === "empty") {
    return `
      <section class="state-panel" aria-label="空状态">
        <div class="state-content">
          <div class="state-copy">
            <img class="state-illustration" src="./icon/空状态.png" alt="">
            <p class="state-text">您的电脑中尚未安装任何skill</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="state-panel" aria-label="初始状态">
      <div class="state-content">
        <div class="state-copy">
          <img class="state-illustration" src="./icon/初始状态.png" alt="">
          <p class="state-text">skill tidy帮您轻松管理Agent skill</p>
        </div>
        <button class="scan-primary-btn" type="button" id="startScan">一键扫描</button>
      </div>
    </section>
  `;
}

function renderStatePanel(kind = scanState) {
  setMainPaneLayout("panel");
  renderModeNav();
  renderFilterTabs();
  document.getElementById("sections").innerHTML = statePanelMarkup(kind);
  renderStats();
  updateGlobalActions();
}

function renderTrash() {
  setMainPaneLayout(trashLoaded && trashSkills.length ? "list" : "panel");
  renderModeNav();
  renderFilterTabs();

  if (!trashLoaded) {
    document.getElementById("sections").innerHTML = `
      <section class="trash-panel" aria-label="回收站">
        <div class="state-content">
          <div class="state-copy">
            <p class="state-text">正在读取回收站</p>
          </div>
        </div>
      </section>
    `;
    renderStats();
    updateGlobalActions();
    return;
  }

  const html = trashSkills.length
    ? `<div class="skill-grid">${trashSkills.map(trashCardMarkup).join("")}</div>`
    : `
      <section class="trash-panel" aria-label="回收站">
        <div class="state-content">
          <div class="state-copy">
            <img class="state-illustration" src="./icon/空状态.png" alt="">
            <p class="state-text">回收站暂无内容</p>
          </div>
        </div>
      </section>
    `;

  document.getElementById("sections").innerHTML = html;
  renderStats();
  updateGlobalActions();
}

function renderChangelog() {
  setMainPaneLayout("panel");
  renderModeNav();
  renderFilterTabs();
  document.getElementById("sections").innerHTML = `
    <section class="changelog-panel" aria-label="更新日志">
      <div class="changelog-content">
        <h2 class="changelog-title">更新日志</h2>
        <p class="changelog-subtitle">Skill Tidy 的主要功能调整记录。</p>
        <div class="changelog-list">
          <article class="changelog-item">
            <div class="changelog-version">
              <strong>Version ${escapeHtml(appUpdate.currentVersion)}</strong>
              <span>${appUpdate.available ? `发现新版本 ${escapeHtml(appUpdate.latestVersion)}` : "当前版本"}</span>
              ${appUpdate.available ? `<button class="changelog-update-btn" type="button" id="appUpdateNow">立即更新</button>` : ""}
            </div>
            <ul class="changelog-points">
              <li>首次使用由用户手动扫描，之后打开会优先读取上次缓存。</li>
              <li>全量扫描只在点击“一键扫描 / 刷新”时执行，更新和删除不再自动扫描。</li>
              <li>新增回收站与恢复能力，删除的 skill 可自动装回原目录。</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  `;
  renderStats();
  updateGlobalActions();
}

function renderSettingsLoading() {
  setMainPaneLayout("panel");
  document.getElementById("sections").innerHTML = `
    <section class="settings-panel">
      <div class="settings-card">
        <h2 class="settings-title">正在读取目录设置</h2>
        <p class="settings-desc">请稍候。</p>
      </div>
    </section>
  `;
}

function renderSettings() {
  setMainPaneLayout("panel");
  renderModeNav();
  renderFilterTabs();

  const rows = settingsRoots.map((item, index) => `
    <div class="settings-row" data-settings-index="${index}">
      <div>
        <div class="settings-path" title="${escapeHtml(item.path)}">${escapeHtml(item.path)}</div>
        <div class="settings-meta">
          <span class="settings-tag">${escapeHtml(item.platform || "自定义")}</span>
          <span class="settings-tag">${escapeHtml(item.source || "自定义")}</span>
          ${item.pending ? `<span class="settings-tag">待保存</span>` : item.exists ? "" : `<span class="settings-tag warn">不存在</span>`}
          ${item.builtin ? `<span class="settings-tag">内置</span>` : ""}
        </div>
      </div>
      <div class="settings-actions">
        <input class="settings-toggle" type="checkbox" ${item.enabled ? "checked" : ""} aria-label="启用目录">
        ${item.source === "自定义"
          ? `<button class="settings-btn" type="button" data-remove-root="${index}">移除</button>`
          : ""}
      </div>
    </div>
  `).join("");

  document.getElementById("sections").innerHTML = `
    <section class="settings-panel">
      <div class="settings-card">
        <div class="settings-head">
          <div>
            <h2 class="settings-title">Skill 扫描目录</h2>
            <p class="settings-desc">管理本机各 agent 的 skill 根目录，保存后可点击刷新更新列表。</p>
          </div>
          <button class="settings-btn primary" type="button" id="saveSettings">保存</button>
        </div>
        <div class="settings-form">
          <input class="settings-input" id="newRootPath" type="text" placeholder="新增目录路径，例如 ~/.custom/skills">
          <select class="settings-select" id="newRootPlatform">
            <option>Codex</option>
            <option>Claude</option>
            <option>Claude Code</option>
            <option>Cursor</option>
            <option>Windsurf</option>
            <option>Continue</option>
            <option>Gemini</option>
            <option>OpenCode</option>
            <option>自定义</option>
          </select>
          <button class="settings-btn" type="button" id="addRoot">添加</button>
        </div>
        <div class="settings-list">
          ${rows || `<p class="settings-desc">暂无目录。</p>`}
        </div>
      </div>
    </section>
  `;
  renderStats();
  updateGlobalActions();
}

function renderStats() {
  if (!document.getElementById("statSelf")) return;
  const items = visibleSkills();
  const selfCount = items.filter((item) => item.source === "自制").length;
  const downloadCount = items.filter((item) => item.source === "下载").length;
  const updateCount = items.filter((item) => String(item.status).startsWith("可更新")).length;

  document.getElementById("statSelf").textContent = selfCount;
  document.getElementById("statDownload").textContent = downloadCount;
  document.getElementById("statUpdate").textContent = updateCount;
}

function renderUpdatedAt(value) {
  if (!value) return;
  const date = new Date(value);
  const text = Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
  document.getElementById("updatedAt").textContent = "更新时间：" + text;
}

function renderLoading() {
  renderStatePanel("scanning");
}

function cardMarkup(item) {
  const hasUpdate = item.status.startsWith("可更新");
  const blockedByLocalChanges = hasUpdate && item.status.includes("本地有改动");
  const statusTag = item.status === item.source
    ? ""
    : `<span class="status ${hasUpdate ? "update" : "clean"}">${escapeHtml(item.status)}</span>`;
  const repoPath = repoPathFromCommand(item.command);
  const githubUrl = item.githubUrl || "";
  const cardClass = githubUrl ? "skill-card has-github" : "skill-card";
  const cardAttrs = githubUrl
    ? ` data-github-url="${escapeHtml(githubUrl)}" title="打开 GitHub 仓库"`
    : "";
  const action = blockedByLocalChanges
    ? `<button class="update-btn" disabled title="请先处理本地改动">更新</button>`
    : hasUpdate
    ? `<button class="update-btn" data-command="${escapeHtml(item.command)}" data-repo="${escapeHtml(repoPath)}">更新</button>`
    : `<button class="update-btn" disabled>更新</button>`;
  const deleteAction = item.deletable
    ? `<button class="delete-btn" data-path="${escapeHtml(item.path)}" data-name="${escapeHtml(item.name)}">删除</button>`
    : "";

  return `
    <article class="${cardClass}"${cardAttrs}>
      <div class="skill-title">
        <span class="skill-name">${escapeHtml(item.name)}</span>
        <a class="folder-link" href="${folderHref(item.path)}" target="_blank" data-path="${escapeHtml(item.path)}" title="打开所在文件夹：${escapeHtml(item.path)}">${folderIcon()}</a>
      </div>
      <div class="tag-row">
        <span class="platform ${platformClass[item.platform || "Codex"] || ""}">${escapeHtml(item.platform || "Codex")}</span>
        <span class="pill ${sourceClass[item.source]}">${escapeHtml(item.source)}</span>
        ${statusTag}
      </div>
      <p class="desc">${escapeHtml(item.desc)}</p>
      <div class="card-actions">
        ${action}
        ${deleteAction}
      </div>
    </article>
  `;
}

function trashCardMarkup(item) {
  const statusTag = `<span class="status clean">${escapeHtml(item.status || "已删除")}</span>`;
  const restoreAction = item.restorable
    ? `<button class="update-btn restore-btn" data-restore-path="${escapeHtml(item.path)}">恢复</button>`
    : `<button class="update-btn" disabled>恢复</button>`;
  const permanentDeleteAction = `<button class="delete-btn trash-delete-btn" data-trash-delete-path="${escapeHtml(item.path)}" data-name="${escapeHtml(item.name)}">彻底删除</button>`;

  return `
    <article class="skill-card">
      <div class="skill-title">
        <span class="skill-name">${escapeHtml(item.name)}</span>
        <a class="folder-link" href="${folderHref(item.path)}" target="_blank" data-path="${escapeHtml(item.path)}" title="打开备份文件夹：${escapeHtml(item.path)}">${folderIcon()}</a>
      </div>
      <div class="tag-row">
        <span class="platform ${platformClass[item.platform || "Codex"] || ""}">${escapeHtml(item.platform || "Codex")}</span>
        <span class="pill ${sourceClass[item.source] || ""}">${escapeHtml(item.source || "自制")}</span>
        ${statusTag}
      </div>
      <p class="desc">${escapeHtml(item.desc)}</p>
      <div class="card-actions">
        ${restoreAction}
        ${permanentDeleteAction}
      </div>
    </article>
  `;
}

function render() {
  if (activeMode === "changelog") {
    renderChangelog();
    return;
  }

  if (activeMode === "trash") {
    renderTrash();
    return;
  }

  if (activeMode === "settings") {
    renderSettings();
    return;
  }

  if (scanState !== "ready") {
    renderStatePanel(scanState);
    return;
  }

  setMainPaneLayout("list");
  renderModeNav();
  renderFilterTabs();

  const items = visibleSkills();
  const html = items.length
    ? `<div class="skill-grid">${items.map(cardMarkup).join("")}</div>`
    : `
      <div class="skill-grid">
        <article class="skill-card">
          <div class="skill-title">
            <span class="skill-name">暂无内容</span>
          </div>
          <div class="tag-row">
            <span class="status clean">0 个</span>
          </div>
          <p class="desc">当前筛选条件下没有找到对应的 skill。</p>
        </article>
      </div>
    `;

  document.getElementById("sections").innerHTML = html;
  renderStats();
  updateGlobalActions();
}

function scrollCardsToTop() {
  const scroller = document.getElementById("cardScroll");
  if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function loadCachedSkills() {
  try {
    if (location.protocol === "file:") {
      return false;
    }

    const response = await fetch("/api/skills-cache", { cache: "no-store" });
    const cached = await response.json();
    if (!response.ok || !cached.ok || !cached.hasCache || !Array.isArray(cached.skills)) return false;
    skills = cached.skills;
    hasSkillData = true;
    scanState = skills.length ? "ready" : "empty";
    if (cached.updatedAt) renderUpdatedAt(cached.updatedAt);
    return true;
  } catch (error) {
    return false;
  }
}

async function cacheSkills(result) {
  try {
    if (location.protocol === "file:") return;
    await fetch("/api/skills-cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skills: result.skills || [],
        updatedAt: result.updatedAt || new Date().toISOString()
      })
    });
  } catch (error) {
    // Ignore cache failures; the app can still render from the live scan.
  }
}

async function persistCurrentSkills() {
  await cacheSkills({
    skills,
    updatedAt: new Date().toISOString()
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readJsonResponse(response, fallbackMessage = "请求失败") {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    const message = text.trim() || fallbackMessage;
    const parseError = new Error(message);
    parseError.parseFailure = true;
    parseError.responseStatus = response.status;
    throw parseError;
  }
}

async function readScanStatus() {
  const response = await fetch("/api/scan-status", { cache: "no-store" });
  const result = await readJsonResponse(response, "读取扫描状态失败");
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "读取扫描状态失败");
  }
  return result;
}

async function waitForScanResult(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await readScanStatus();
    if (result.status === "ready") return result;
    if (result.status === "error") {
      throw new Error(result.message || "扫描失败");
    }
    await sleep(450);
  }

  throw new Error("扫描超时，请稍后重试");
}

async function fetchLegacySkills() {
  const response = await fetch("/api/skills", { cache: "no-store" });
  const result = await readJsonResponse(response, "刷新失败");
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "刷新失败");
  }
  return result;
}

function markRepoUpdated(repo) {
  let changed = false;
  skills = skills.map((item) => {
    const itemRepo = repoPathFromCommand(item.command);
    if (itemRepo !== repo) return item;
    changed = true;
    return {
      ...item,
      status: "已是最新",
      command: undefined
    };
  });
  return changed;
}

function confirmDialog(title, description) {
  const dialog = document.getElementById("deleteDialog");
  const titleEl = document.getElementById("deleteDialogTitle");
  const descEl = document.getElementById("deleteDialogDesc");
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = description || "";
  dialog.classList.add("is-open");
  dialog.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    const close = (value) => {
      dialog.classList.remove("is-open");
      dialog.setAttribute("aria-hidden", "true");
      dialog.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeydown);
      resolve(value);
    };

    const onClick = (event) => {
      if (event.target === dialog || event.target.closest("[data-delete-dialog-cancel]")) {
        close(false);
        return;
      }
      if (event.target.closest("[data-delete-dialog-confirm]")) {
        close(true);
      }
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    dialog.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
  });
}

function confirmDelete(name) {
  return confirmDialog(`确认删除 ${name}?`, "会先将该skill移动到备份目录，不会直接永久删除。");
}

async function clearAllTrash() {
  if (!ensureLocalService("清空回收站")) return;

  const confirmed = await confirmDialog(
    "确认清空回收站?",
    "操作不可恢复，回收站里的 skill 会被永久删除。"
  );
  if (!confirmed) return;

  const button = document.getElementById("refreshList");
  if (button) {
    button.classList.add("is-loading");
    button.disabled = true;
    button.textContent = "清空中";

    try {
      const response = await fetch("/api/trash-clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "清空失败");
      }
      showToast(result.message || "已清空回收站");
      trashSkills = [];
      trashLoaded = true;
      renderTrash();
    } catch (error) {
      showToast(error.message || "清空失败");
    } finally {
      if (button) {
        button.classList.remove("is-loading");
      }
    }
  }
}

function skillIdentityKey(item) {
  return item.path || `${item.platform || ""}|${item.name || ""}|${item.folder || ""}`;
}

async function refreshSkills(options = {}) {
  const button = document.getElementById("refreshList");
  const useButtonState = !options.background;
  const showScanPanel = Boolean(options.showScanPanel);
  const previousKeys = new Set(skills.map(skillIdentityKey));
  if (!ensureLocalService("重新扫描 skill 目录")) return;

  if (showScanPanel) {
    scanState = "scanning";
    scanProgress = 10;
    render();
    startScanProgress();
  }

  if (useButtonState) {
    button.classList.add("is-loading");
    button.disabled = true;
    button.textContent = showScanPanel ? "扫描中" : "刷新中";
  }

  try {
    const startResponse = await fetch("/api/scan-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    let result;

    try {
      const startResult = await readJsonResponse(startResponse, "刷新失败");
      if (!startResponse.ok || !startResult.ok) {
        throw new Error(startResult.message || "刷新失败");
      }
      result = await waitForScanResult();
    } catch (error) {
      if (error.parseFailure && startResponse.status === 405) {
        result = await fetchLegacySkills();
      } else {
        throw error;
      }
    }
    const nextSkills = result.skills || [];
    const addedCount = nextSkills.filter((item) => !previousKeys.has(skillIdentityKey(item))).length;
    skills = nextSkills;
    hasSkillData = true;
    scanState = skills.length ? "ready" : "empty";
    await cacheSkills(result);
    render();
    renderUpdatedAt(result.updatedAt);
    if (!options.silent) {
      showToast(showScanPanel
        ? `扫描完成，共 ${skills.length} 条数据`
        : `已刷新，新增 ${addedCount} 条数据`);
    }
  } catch (error) {
    scanState = hasSkillData ? (skills.length ? "ready" : "empty") : "initial";
    if (!options.silent) {
      showToast(error.message || "刷新失败");
    }
    render();
  } finally {
    stopScanProgress();
    if (useButtonState) {
      button.classList.remove("is-loading");
      button.disabled = false;
      button.textContent = "刷新";
    }
    updateGlobalActions();
  }
}

async function updateAllSkills() {
  const button = document.getElementById("updateAll");
  const targets = skills
    .filter((item) => {
      const status = String(item.status || "");
      return status.startsWith("可更新") && !status.includes("本地有改动") && item.command;
    })
    .map((item) => ({ name: item.name, repo: repoPathFromCommand(item.command) }))
    .filter((item) => item.repo);

  if (!targets.length) {
    showToast("当前没有可更新的 skill");
    updateGlobalActions();
    return;
  }

  if (!ensureLocalService("一键更新")) return;

  button.disabled = true;
  button.classList.add("is-loading");

  try {
    for (let index = 0; index < targets.length; index += 1) {
      button.textContent = `更新中 ${index + 1}/${targets.length}`;
      const response = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: targets[index].repo })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(`${targets[index].name} 更新失败：${result.message || "未知错误"}`);
      }
      markRepoUpdated(targets[index].repo);
    }
    await persistCurrentSkills();
    render();
    showToast("可更新的 skill 已处理完成，可点击刷新重新检查");
  } catch (error) {
    showToast(error.message || "一键更新失败");
  } finally {
    button.classList.remove("is-loading");
    updateGlobalActions();
  }
}

async function loadTrash() {
  if (!ensureLocalService("读取回收站")) {
    trashLoaded = true;
    trashSkills = [];
    renderTrash();
    return;
  }

  trashLoaded = false;
  renderTrash();
  try {
    const response = await fetch("/api/trash", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "读取回收站失败");
    }
    trashSkills = result.skills || [];
    trashLoaded = true;
    renderTrash();
  } catch (error) {
    showToast(error.message || "读取回收站失败");
    trashSkills = [];
    trashLoaded = true;
    renderTrash();
  }
}

async function loadSettings() {
  if (!ensureLocalService("读取设置")) return;

  renderSettingsLoading();
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "读取设置失败");
    }
    settingsRoots = result.roots || [];
    settingsLoaded = true;
    renderSettings();
  } catch (error) {
    showToast(error.message || "读取设置失败");
    settingsLoaded = true;
    settingsRoots = [];
    renderSettings();
  }
}

async function saveSettings() {
  if (location.protocol === "file:") {
    showToast("需要通过本地服务打开，才能保存设置");
    return;
  }

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roots: settingsRoots })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "保存失败");
    }
    settingsRoots = result.roots || [];
    activeMode = "settings";
    renderSettings();
    showToast("目录设置已保存，需要更新列表时请点击刷新");
  } catch (error) {
    showToast(error.message || "保存失败");
  }
}

document.getElementById("refreshList").addEventListener("click", async () => {
  if (activeMode === "trash") {
    await clearAllTrash();
    return;
  }
  refreshSkills();
});
document.getElementById("updateAll").addEventListener("click", () => updateAllSkills());
document.querySelector(".window-controls").addEventListener("click", (event) => {
  const button = event.target.closest("[data-window-control]");
  if (!button) return;
  window.skillTidyWindow?.control(button.dataset.windowControl);
});
document.getElementById("showChangelog").addEventListener("click", () => {
  activeMode = "changelog";
  activeFilter = "all";
  render();
  scrollCardsToTop();
});

document.getElementById("modeNav").addEventListener("click", (event) => {
  const button = event.target.closest(".mode-item[data-mode]");
  if (!button) return;
  activeMode = button.dataset.mode || "category";
  activeFilter = "all";
  if (activeMode === "settings" && !settingsLoaded) {
    renderModeNav();
    renderFilterTabs();
    loadSettings();
    scrollCardsToTop();
    return;
  }
  if (activeMode === "trash") {
    loadTrash();
    scrollCardsToTop();
    return;
  }
  render();
  scrollCardsToTop();
});

document.getElementById("filterTabs").addEventListener("click", (event) => {
  const button = event.target.closest(".filter-tab[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter || "all";
  render();
  keepActiveTabVisible("center");
  scrollCardsToTop();
});

document.getElementById("filterTabs").addEventListener("wheel", (event) => {
  const tabs = event.currentTarget;
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  if (tabs.scrollWidth <= tabs.clientWidth) return;
  event.preventDefault();
  tabs.scrollLeft += event.deltaY;
}, { passive: false });

document.addEventListener("click", async (event) => {
  const folderLink = event.target.closest(".folder-link[data-path]");
  if (folderLink && location.protocol !== "file:") {
    event.preventDefault();
    event.stopPropagation();

    try {
      const response = await fetch("/api/open-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderLink.dataset.path })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "打开失败");
      }
    } catch (error) {
      showToast(error.message || "打开失败");
    }
    return;
  }

  const startScanButton = event.target.closest("#startScan");
  if (startScanButton) {
    refreshSkills({ showScanPanel: true });
    return;
  }

  const appUpdateButton = event.target.closest("#appUpdateNow");
  if (appUpdateButton) {
    if (appUpdate.available) {
      window.open(appUpdate.releaseUrl, "_blank", "noopener");
    }
    return;
  }

  const addRootButton = event.target.closest("#addRoot");
  if (addRootButton) {
    const input = document.getElementById("newRootPath");
    const platform = document.getElementById("newRootPlatform").value || "自定义";
    const rootPath = cleanRootPath(input.value);
    if (!rootPath) {
      showToast("请先填写目录路径");
      input.focus();
      return;
    }

    const exists = settingsRoots.some((item) => cleanRootPath(item.path) === rootPath);
    if (exists) {
      showToast("这个目录已经在列表里了");
      input.focus();
      return;
    }

    settingsRoots.push({
      path: rootPath,
      platform,
      source: "自定义",
      builtin: false,
      deletable: true,
      enabled: true,
      pending: true
    });
    input.value = "";
    renderSettings();
    return;
  }

  const removeRootButton = event.target.closest("[data-remove-root]");
  if (removeRootButton) {
    const index = Number(removeRootButton.dataset.removeRoot);
    if (!Number.isNaN(index)) {
      settingsRoots.splice(index, 1);
      renderSettings();
    }
    return;
  }

  const saveSettingsButton = event.target.closest("#saveSettings");
  if (saveSettingsButton) {
    saveSettingsButton.disabled = true;
    saveSettingsButton.textContent = "保存中";
    try {
      await saveSettings();
    } finally {
      const currentButton = document.getElementById("saveSettings");
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = "保存";
      }
    }
    return;
  }

  const trashDeleteButton = event.target.closest(".trash-delete-btn[data-trash-delete-path]");
  if (trashDeleteButton) {
    const name = trashDeleteButton.dataset.name || "这个 skill";
    const confirmed = await confirmDialog(`确认彻底删除 ${name}?`, "操作不可恢复，该 skill 会被永久删除。");
    if (!confirmed) return;

    if (!ensureLocalService("彻底删除 skill")) return;

    trashDeleteButton.classList.add("is-loading");
    trashDeleteButton.disabled = true;
    trashDeleteButton.textContent = "删除中";

    try {
      const response = await fetch("/api/trash-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: trashDeleteButton.dataset.trashDeletePath })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "彻底删除失败");
      }
      trashSkills = trashSkills.filter((item) => item.path !== trashDeleteButton.dataset.trashDeletePath);
      showToast("已彻底删除");
      renderTrash();
    } catch (error) {
      showToast(error.message || "彻底删除失败");
      trashDeleteButton.disabled = false;
      trashDeleteButton.textContent = "彻底删除";
    } finally {
      trashDeleteButton.classList.remove("is-loading");
    }
    return;
  }

  const restoreButton = event.target.closest(".restore-btn[data-restore-path]");
  if (restoreButton) {
    if (!ensureLocalService("恢复 skill")) return;

    restoreButton.classList.add("is-loading");
    restoreButton.disabled = true;
    restoreButton.textContent = "恢复中";

    try {
      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: restoreButton.dataset.restorePath })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "恢复失败");
      }

      trashSkills = trashSkills.filter((item) => item.path !== restoreButton.dataset.restorePath);
      if (result.skill) {
        skills = [
          ...skills.filter((item) => item.path !== result.skill.path),
          result.skill
        ];
        hasSkillData = true;
        scanState = "ready";
        await persistCurrentSkills();
      }
      showToast("已恢复到原安装目录");
      renderTrash();
    } catch (error) {
      showToast(error.message || "恢复失败");
      restoreButton.disabled = false;
      restoreButton.textContent = "恢复";
    } finally {
      restoreButton.classList.remove("is-loading");
    }
    return;
  }

  const card = event.target.closest(".skill-card[data-github-url]");
  if (card && !event.target.closest("a, button")) {
    window.open(card.dataset.githubUrl, "_blank", "noopener");
    return;
  }

  const deleteButton = event.target.closest(".delete-btn[data-path]");
  if (deleteButton) {
    const name = deleteButton.dataset.name || "这个 skill";
    const confirmed = await confirmDelete(name);
    if (!confirmed) return;

    if (!ensureLocalService("删除 skill")) return;

    deleteButton.classList.add("is-loading");
    deleteButton.disabled = true;
    deleteButton.textContent = "删除中";

    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: deleteButton.dataset.path })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "删除失败");
      }
      showToast("已删除并移动到备份目录");
      skills = skills.filter((item) => item.path !== deleteButton.dataset.path);
      trashLoaded = false;
      scanState = skills.length ? "ready" : "empty";
      await persistCurrentSkills();
      render();
    } catch (error) {
      showToast(error.message || "删除失败");
      deleteButton.disabled = false;
      deleteButton.textContent = "删除";
    } finally {
      deleteButton.classList.remove("is-loading");
    }
    return;
  }

  const button = event.target.closest(".update-btn[data-command]");
  if (!button) return;
  const command = button.dataset.command;
  const repo = button.dataset.repo;

  if (location.protocol === "file:") {
    try {
      await navigator.clipboard.writeText(command);
      showToast("静态打开不能直接更新，已复制命令：" + command);
    } catch (error) {
      showToast(command);
    }
    return;
  }

  button.classList.add("is-loading");
  button.disabled = true;
  button.textContent = "更新中";

  try {
    const response = await fetch("/api/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "更新失败");
    }
    showToast(result.message || "更新完成");
    markRepoUpdated(repo);
    await persistCurrentSkills();
    render();
  } catch (error) {
    showToast(error.message || "更新失败");
    button.disabled = false;
    button.textContent = "更新";
  } finally {
    button.classList.remove("is-loading");
  }
});

document.addEventListener("change", (event) => {
  const toggle = event.target.closest(".settings-toggle");
  if (!toggle) return;
  const row = toggle.closest("[data-settings-index]");
  const index = Number(row?.dataset.settingsIndex);
  if (Number.isNaN(index) || !settingsRoots[index]) return;
  settingsRoots[index].enabled = toggle.checked;
});

renderAppUpdateStatus();
loadCachedSkills().then((loaded) => {
  if (!loaded) {
    scanState = "initial";
  }
  render();
});
checkAppUpdate();
