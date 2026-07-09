const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile, fork } = require("child_process");

const storage = require("./server-lib/storage");
const { createGitService } = require("./server-lib/git");
const { createSkillsService } = require("./server-lib/skills");
const { createTrashService } = require("./server-lib/trash");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const {
  homeDir,
  trashRoot,
  readSkillsCache,
  writeSkillsCache,
  settingsPayload,
  saveSettings,
  expandHome,
  discoverSkillRoots
} = storage;

let skillsService;
const gitService = createGitService({
  rootForPath: (...args) => skillsService.rootForPath(...args)
});

skillsService = createSkillsService({
  homeDir,
  discoverSkillRoots,
  gitRootFor: gitService.gitRootFor,
  githubUrlForRepo: gitService.githubUrlForRepo,
  gitStatusFor: gitService.gitStatusFor,
  clearGitStatusCache: gitService.clearGitStatusCache,
  runGitSyncResult: gitService.runGitSyncResult
});

const trashService = createTrashService({
  trashRoot,
  discoverSkillRoots,
  rootForPath: skillsService.rootForPath,
  isDeletableSkillDir: skillsService.isDeletableSkillDir,
  readSkillMeta: skillsService.readSkillMeta,
  compactDescription: skillsService.compactDescription,
  sourceForSkill: skillsService.sourceForSkill,
  categoryForSkill: skillsService.categoryForSkill,
  folderLabel: skillsService.folderLabel,
  githubUrlForRepo: gitService.githubUrlForRepo,
  gitRootFor: gitService.gitRootFor,
  directChildOf: skillsService.directChildOf
});

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

let scanWorker = null;
let scanState = {
  status: "idle",
  progress: 0,
  startedAt: "",
  updatedAt: "",
  result: null,
  error: ""
};
let scanProgressTimer = null;

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), mime[".json"]);
}

function sendError(res, status, message) {
  sendJson(res, status, { ok: false, message });
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

function openLocalPath(targetPath) {
  const normalized = path.resolve(expandHome(targetPath || ""));
  if (!normalized || !fs.existsSync(normalized)) {
    return {
      ok: false,
      message: "目录不存在"
    };
  }

  execFile("open", [normalized], () => {
    // The response has already been sent; failures here are intentionally non-fatal.
  });

  return {
    ok: true,
    message: "已打开目录"
  };
}

function clearScanProgressTimer() {
  if (!scanProgressTimer) return;
  clearInterval(scanProgressTimer);
  scanProgressTimer = null;
}

function beginScanProgress() {
  clearScanProgressTimer();
  scanProgressTimer = setInterval(() => {
    if (scanState.status !== "running") {
      clearScanProgressTimer();
      return;
    }
    scanState.progress = Math.min(scanState.progress + 6, 94);
  }, 400);
}

function completeScanSuccess(result) {
  clearScanProgressTimer();
  writeSkillsCache(result);
  scanState = {
    status: "ready",
    progress: 100,
    startedAt: scanState.startedAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
    result,
    error: ""
  };
  scanWorker = null;
}

function completeScanFailure(message) {
  clearScanProgressTimer();
  scanState = {
    status: "error",
    progress: 0,
    startedAt: scanState.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
    error: message || "扫描失败"
  };
  scanWorker = null;
}

function scanStatusPayload() {
  const cached = readSkillsCache();
  const result = scanState.result || null;

  return {
    ok: true,
    status: scanState.status,
    progress: scanState.progress,
    startedAt: scanState.startedAt,
    updatedAt: result?.updatedAt || scanState.updatedAt || cached.updatedAt || "",
    hasCache: cached.hasCache,
    skills: result?.skills || [],
    message: scanState.status === "error" ? scanState.error : ""
  };
}

function latestSkillsPayload() {
  if (scanState.status === "ready" && scanState.result) {
    return scanState.result;
  }

  const cached = readSkillsCache();
  return {
    ok: true,
    updatedAt: cached.updatedAt,
    skills: cached.skills,
    stale: scanState.status === "running"
  };
}

function startScan() {
  if (scanState.status === "running" && scanWorker) {
    return scanStatusPayload();
  }

  scanState = {
    status: "running",
    progress: 5,
    startedAt: new Date().toISOString(),
    updatedAt: "",
    result: null,
    error: ""
  };
  beginScanProgress();

  scanWorker = fork(__filename, [], {
    env: {
      ...process.env,
      SKILL_TIDY_SCAN_WORKER: "1"
    },
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });

  scanWorker.once("message", (message) => {
    if (message?.type === "scan:result" && message.result) {
      completeScanSuccess(message.result);
      return;
    }

    if (message?.type === "scan:error") {
      completeScanFailure(message.message);
    }
  });

  scanWorker.once("error", (error) => {
    completeScanFailure(error.message || "扫描进程启动失败");
  });

  scanWorker.once("exit", (code, signal) => {
    if (scanState.status !== "running") return;
    if (!signal && code === 0) {
      return;
    }
    completeScanFailure(
      signal
        ? `扫描进程异常退出：${signal}`
        : `扫描进程异常退出，退出码 ${code ?? 0}`
    );
  });

  return scanStatusPayload();
}

const apiRoutes = new Map();

apiRoutes.set("GET /api/skills", async (req, res) => {
  try {
    sendJson(res, 200, latestSkillsPayload());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

apiRoutes.set("POST /api/scan-start", async (req, res) => {
  try {
    sendJson(res, 200, startScan());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

apiRoutes.set("GET /api/scan-status", (req, res) => {
  try {
    sendJson(res, 200, scanStatusPayload());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

apiRoutes.set("GET /api/skills-cache", (req, res) => {
  sendJson(res, 200, readSkillsCache());
});

apiRoutes.set("POST /api/skills-cache", async (req, res) => {
  try {
    writeSkillsCache(await readJson(req));
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("GET /api/settings", (req, res) => {
  try {
    sendJson(res, 200, settingsPayload());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

apiRoutes.set("POST /api/settings", async (req, res) => {
  try {
    sendJson(res, 200, saveSettings(await readJson(req)));
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("POST /api/update", async (req, res) => {
  try {
    const body = await readJson(req);
    if (!gitService.isAllowedRepo(body.repo)) {
      sendError(res, 403, "这个目录不在允许更新列表里");
      return;
    }
    const result = await gitService.runGit(body.repo);
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("POST /api/delete", async (req, res) => {
  try {
    const result = trashService.moveToTrash((await readJson(req)).path);
    sendJson(res, result.ok ? 200 : 403, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("GET /api/trash", (req, res) => {
  try {
    sendJson(res, 200, trashService.listTrashSkills());
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

apiRoutes.set("POST /api/trash-delete", async (req, res) => {
  try {
    const result = trashService.permanentlyDeleteTrashItem((await readJson(req)).path);
    sendJson(res, result.ok ? 200 : 403, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("POST /api/trash-clear", async (req, res) => {
  try {
    const result = trashService.clearTrash();
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("POST /api/restore", async (req, res) => {
  try {
    const result = trashService.restoreFromTrash((await readJson(req)).path);
    sendJson(res, result.ok ? 200 : 400, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

apiRoutes.set("POST /api/open-path", async (req, res) => {
  try {
    const result = openLocalPath((await readJson(req)).path);
    sendJson(res, result.ok ? 200 : 404, result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
});

function serveStatic(req, res, url) {
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
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const key = `${req.method} ${url.pathname}`;
    const handler = apiRoutes.get(key);

    if (handler) {
      handler(req, res);
      return;
    }

    serveStatic(req, res, url);
  });
}

if (process.env.SKILL_TIDY_SCAN_WORKER === "1") {
  try {
    const result = skillsService.scanSkills();
    if (process.send) {
      process.send(
        {
          type: "scan:result",
          result
        },
        () => process.disconnect?.()
      );
    } else {
      process.exit(0);
    }
  } catch (error) {
    if (process.send) {
      process.send(
        {
          type: "scan:error",
          message: error.message || "扫描失败"
        },
        () => process.disconnect?.()
      );
    } else {
      process.exit(1);
    }
  }
} else if (require.main === module) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`skill-tidy running at http://localhost:${port}`);
  });
}

module.exports = {
  createServer,
  scanSkills: skillsService.scanSkills
};
