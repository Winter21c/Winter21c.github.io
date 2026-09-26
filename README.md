# Winter21c の 宝藏之地

个人博客 / 主页，基于 Next.js 静态导出，托管在 **GitHub Pages**。

🌐 线上地址：<https://winter21c.github.io>

---

## 🙏 来源与署名

本项目的视觉与功能设计来自开源项目 **[XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)**（作者：XingHuiSama），
采用 **[CC BY-NC 4.0](LICENSE)** 许可协议：允许学习、分享与二次修改，**二次发布需提及原作者，禁止任何商业用途**。

本仓库是在其基础上的 **GitHub Pages 适配改造版**，主要改动见下一节。
原项目是为 Vercel 设计的，请一并给原作者点个 Star ⭐。

---

## 🔧 相对原项目做了哪些改动

原项目面向 Vercel（有服务端，能跑 API 路由）。GitHub Pages 只能托管**纯静态文件**，
因此做了如下适配：

| # | 改动 | 原因 |
|---|------|------|
| 1 | 开启 `output: 'export'` + `trailingSlash: true` | 产出纯静态 `out/` 目录 |
| 2 | 删除全部 `app/api/*` 路由（chat / music / weather / github / test） | 静态托管无 Node 服务端 |
| 3 | 移除 AI 猫猫助理组件（`CyberCat`） | 它需要服务端保存 Gemini 密钥；改前端直连会**泄露密钥被他人盗用** |
| 4 | 移除天气挂件（`WeatherWidget` / `WeatherEffect`） | 原本就是无人引用的死代码，且依赖服务端代理 |
| 5 | **歌单改为构建期烘焙**（`scripts/fetch-music.mjs`） | 见下方「歌单」一节 |
| 6 | Gitalk 评论区：移除 `/api/github` 代理，未配置时自动隐藏 | 静态站无法做 OAuth 换 token |
| 7 | 清空原作者的 QQ / 微信 / ICP 备案号 / 图床链接 | 这些是原作者的个人信息，不能沿用 |
| 8 | 新增 GitHub Actions 自动部署工作流 | 推送即自动构建发布 |

---

## ✍️ 日常使用

### 写文章

Markdown 文件直接放进 `posts/` 目录，文件名就是 URL：

```
posts/我的第一篇文章.md   →   https://winter21c.github.io/posts/我的第一篇文章/
```

文件开头支持 front-matter：

```markdown
---
title: 文章标题
date: 2026-09-26
cover: 封面图链接（可选）
tags: [标签1, 标签2]
---

正文内容...
```

- `chatters/` 目录 → 「云端杂谈」板块
- `moments/` 目录 → 「说说 / 朋友圈」板块

### 发布

```bash
git add .
git commit -m "新文章"
git push
```

推送后 GitHub Actions 会自动构建并发布，约 1～2 分钟生效。
进度可在仓库的 **Actions** 标签页查看。

### 改站点信息

所有个人化配置集中在 **`siteConfig.ts`** 一个文件里，
搜索 `【请修改】` 即可找到所有需要替换的占位符（标题、昵称、简介、头像、社交链接等）。

---

## 🎵 歌单

网易云的歌曲外链**不支持浏览器跨域调用**，原项目是用服务端 API 代理解决的。
静态站没有服务端，所以改成了**构建期烘焙**：

```
构建时：scripts/fetch-music.mjs 抓取歌单 → 写入 public/music-data.json
运行时：播放器只读这个静态 JSON，零外部依赖
```

**换歌**：编辑 `siteConfig.ts` 里的 `cloudMusicIds`，填入网易云歌曲 ID
（网页版歌曲链接里那串数字，如 `https://music.163.com/song?id=`**`64106`**），然后 push 重新构建。

**⚠️ 关于 VIP 歌曲**：VIP / 付费 / 已下架歌曲的免费外链不会返回音频，
而是返回一个「无法播放」的提示页。脚本会**实测每首歌是否真的能播**，
放不了的自动跳过并在构建日志里说明，所以播放器里不会出现点了没反应的坏歌。

> 当前歌单中，《我爱你但是我要回家》与《恋人》的原唱版本均为 VIP，
> 因此换用了可免费播放的翻唱版本。想要原版需自行开通 VIP 并改用其它方案。

### ⚠️ 地域限制与「基线歌单」机制（重要）

网易云的外链接口**有地域限制**：GitHub Actions 的构建机在美国，
部分国内版权歌曲在那里拿不到音频，而在国内网络下构建则一切正常。

如果不管这件事，CI 构建会把你在本地烘焙好的可用歌单**覆盖成残缺版本**。
因此本项目采用「基线」机制：

- `public/music-data.json` **需要入库**，它就是基线歌单；
- 构建时优先实时抓取，**抓取失败的歌曲自动沿用基线里的数据**，不会被清空；
- 本地（国内网络）构建会产出最完整的歌单，提交后 CI 就能回退到它。

**换歌的正确姿势**：在**本地**改好 `cloudMusicIds` → 本地跑一次 `npm run build`
（或在项目根目录跑 `node scripts/fetch-music.mjs`）→ 把更新后的
`public/music-data.json` 一起提交。这样即使 CI 抓不到，线上也是完整的。

留空数组 `cloudMusicIds: []` 即可完全关闭播放器。

---

## 🚀 本地开发

```bash
npm install
npm run dev     # 会自动先抓一次歌单，然后启动 http://localhost:3000
```

构建静态产物：

```bash
npm run build   # 产物在 out/
npx serve out   # 本地预览静态产物
```

---

## ⚙️ 部署配置说明（首次已配置好，仅供排查参考）

仓库 **Settings → Pages → Source** 必须选择 **GitHub Actions**（而不是 "Deploy from a branch"）。
工作流文件：`.github/workflows/deploy.yml`。

---

## 🧩 已移除的功能及恢复方法

### AI 猫猫助理

**为什么移除**：它调用 Gemini API，密钥必须放在服务端。
静态站只能把密钥打包进前端 JS，**任何人查看网页源码都能提取并盗用你的额度**。

**想恢复的话**，可选方案：
1. 部署一个独立的 Serverless 函数（Vercel / Cloudflare Workers）存密钥，前端调用它；
2. 或者换成本地模型 / 不需要密钥的服务。

### 评论区

Gitalk 需要 OAuth 换 token 的服务端步骤，静态站上登录会失败，因此未配置时评论区自动隐藏。

**推荐改用 [giscus](https://giscus.app/zh-CN)**：基于 GitHub Discussions，
无需密钥、无需服务端，天然适配 GitHub Pages。接入只需在文章页组件里替换 `Comments.tsx`。

---

## 📄 许可

[CC BY-NC 4.0](LICENSE) — 禁止商业用途，二次发布需注明原作者
[XingHuiSama](https://github.com/heiehiehi/XinghuisamaBlogs)。
