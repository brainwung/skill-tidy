const fs = require("fs");
const path = require("path");

function createTrashService({
  trashRoot,
  discoverSkillRoots,
  rootForPath,
  isDeletableSkillDir,
  readSkillMeta,
  compactDescription,
  sourceForSkill,
  categoryForSkill,
  folderLabel,
  githubUrlForRepo,
  gitRootFor,
  directChildOf
}) {
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

  function isTrashDir(skillDir) {
    const normalized = path.resolve(skillDir || "");
    if (!normalized || !fs.existsSync(normalized)) return false;
    const parent = path.dirname(normalized);
    if (parent !== trashRoot) return false;
    return fs.existsSync(path.join(normalized, ".skill-tidy-trash.json"));
  }

  function permanentlyDeleteTrashItem(skillDir) {
    if (!isTrashDir(skillDir)) {
      return {
        ok: false,
        message: "这个目录不在回收站里，无法彻底删除"
      };
    }

    try {
      fs.rmSync(skillDir, { recursive: true, force: true });
      return { ok: true, message: "已彻底删除" };
    } catch (error) {
      return {
        ok: false,
        message: error.message || "彻底删除失败"
      };
    }
  }

  function clearTrash() {
    if (!fs.existsSync(trashRoot)) {
      return { ok: true, removed: 0, message: "回收站本来就是空的" };
    }

    const entries = fs.readdirSync(trashRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(trashRoot, entry.name))
      .filter(isTrashDir);

    let removed = 0;
    let lastError = null;
    for (const dir of entries) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        removed += 1;
      } catch (error) {
        lastError = error;
      }
    }

    if (removed === entries.length || !lastError) {
      return { ok: true, removed, message: `已彻底清空 ${removed} 个 skill` };
    }
    return {
      ok: false,
      removed,
      message: `清理时出错，已成功 ${removed}/${entries.length}：${lastError.message || lastError}`
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

  return {
    moveToTrash,
    listTrashSkills,
    permanentlyDeleteTrashItem,
    clearTrash,
    restoreFromTrash
  };
}

module.exports = {
  createTrashService
};
