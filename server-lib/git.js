const fs = require("fs");
const path = require("path");
const { execFile, execFileSync } = require("child_process");

function createGitService({ rootForPath }) {
  const gitStatusCache = new Map();

  function bufferToString(value) {
    if (typeof value === "string") return value;
    if (Buffer.isBuffer(value)) return value.toString("utf8");
    return "";
  }

  function runGitSyncResult(args, cwd, timeout = 60000) {
    try {
      const stdout = execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        timeout,
        stdio: ["ignore", "pipe", "pipe"]
      });

      return {
        ok: true,
        stdout,
        stderr: "",
        output: String(stdout || "").trim(),
        code: 0
      };
    } catch (error) {
      const stdout = bufferToString(error.stdout);
      const stderr = bufferToString(error.stderr);
      return {
        ok: false,
        stdout,
        stderr,
        output: `${stdout || ""}${stderr || ""}`.trim(),
        code: typeof error.status === "number" ? error.status : null,
        message: error.message || "git 命令执行失败"
      };
    }
  }

  function runGit(repo) {
    return new Promise((resolve) => {
      const dirtyResult = runGitSyncResult(["status", "--short"], repo, 10000);
      if (!dirtyResult.ok) {
        resolve({
          ok: false,
          message: dirtyResult.output || "无法检查本地改动，请稍后重试。"
        });
        return;
      }

      if (dirtyResult.output) {
        const changedFiles = dirtyResult.output
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

  function gitRootFor(skillDir) {
    const rootResult = runGitSyncResult(["rev-parse", "--show-toplevel"], skillDir, 10000);
    const rootPath = rootResult.ok ? rootResult.output : "";
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
    const remoteResult = runGitSyncResult(["remote", "get-url", "origin"], repo, 10000);
    return remoteResult.ok ? normalizeGithubUrl(remoteResult.output) : "";
  }

  function gitStatusFor(repo) {
    if (!repo) return null;
    if (gitStatusCache.has(repo)) return gitStatusCache.get(repo);

    const remoteResult = runGitSyncResult(["remote"], repo, 10000);
    if (!remoteResult.ok) {
      const result = { status: "检查失败", command: "" };
      gitStatusCache.set(repo, result);
      return result;
    }

    if (!remoteResult.output) {
      const result = { status: "无远端", command: "" };
      gitStatusCache.set(repo, result);
      return result;
    }

    const fetchResult = runGitSyncResult(["fetch", "--quiet", "--all", "--prune"], repo, 60000);
    if (!fetchResult.ok) {
      const result = { status: "检查失败", command: "" };
      gitStatusCache.set(repo, result);
      return result;
    }

    const countsResult = runGitSyncResult(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], repo, 10000);
    if (!countsResult.ok) {
      const failureText = countsResult.output || countsResult.message || "";
      const status = /no upstream configured|no upstream branch|@\{upstream\}/i.test(failureText)
        ? "未配置上游"
        : "检查失败";
      const result = { status, command: "" };
      gitStatusCache.set(repo, result);
      return result;
    }

    const statusResult = runGitSyncResult(["status", "--short"], repo, 10000);
    if (!statusResult.ok) {
      const result = { status: "检查失败", command: "" };
      gitStatusCache.set(repo, result);
      return result;
    }

    const [, behindText] = countsResult.output.split(/\s+/);
    const behind = Number(behindText || 0);
    const dirty = statusResult.output;

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

  function isAllowedRepo(repo) {
    const normalized = path.resolve(repo || "");
    const rootInfo = rootForPath(normalized, (item) => !item.builtin);
    if (!rootInfo) return false;
    if (!fs.existsSync(normalized)) return false;
    const remoteResult = runGitSyncResult(["remote"], normalized, 10000);
    return remoteResult.ok && Boolean(remoteResult.output);
  }

  function clearGitStatusCache() {
    gitStatusCache.clear();
  }

  return {
    runGit,
    runGitSyncResult,
    gitRootFor,
    githubUrlForRepo,
    gitStatusFor,
    isAllowedRepo,
    clearGitStatusCache
  };
}

module.exports = {
  createGitService
};
