# Skill Tidy

一个本地 Agent Skill 管理工具，用来整理和查看 Mac 上已安装的 Codex、Claude 等 Agent Skills。

## 功能

- 扫描本机常见 Agent 的 Skill 目录
- 按技能类型、安装平台、安装来源筛选
- 查看 Skill 简介、状态和所在文件夹
- 对有 GitHub 远程地址的 Skill 执行更新
- 删除本地 Skill 时先移动到备份目录
- 在设置页管理扫描目录

## 安装

前往 GitHub Releases 下载最新的 `Skill Tidy-0.1.0-arm64.dmg`，打开后将应用拖入 Applications。

> 当前版本未做 Apple 签名，首次打开时 macOS 可能会提示安全风险。可以在系统设置中允许打开。

## 本地运行

```bash
npm install
npm start
```

## 打包

```bash
npm run dist
```

打包产物会生成在 `dist/` 目录。
