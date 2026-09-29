# 不完美笔记

个人博客 / 主页，基于 Next.js 静态导出，托管在 **GitHub Pages**。

🌐 线上地址：<https://winter21c.github.io>

---

## 🙏 特别致谢

**这个站点能跑起来，首先要感谢原项目作者 [XingHuiSama](https://github.com/heiehiehi)。**

本项目的全部视觉设计与功能实现——毛玻璃（Glassmorphism）风格、动态背景、
音乐播放器、时间线、照片墙、3D 结晶工坊等等——都出自 TA 的开源项目
**[XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)**。

我只是把它从 Vercel 搬到了 GitHub Pages 上（原项目依赖服务端，静态托管跑不起来），
做了一些静态化适配和清理工作。**真正的创意和绝大部分代码都是原作者的功劳。**

如果你也喜欢这个风格，请务必去原仓库点一个 ⭐ Star 支持 TA：

👉 <https://github.com/heiehiehi/XinghuisamaBlogs>

原项目采用 **[CC BY-NC 4.0](LICENSE)** 许可协议：
允许学习、分享与二次修改，**二次发布需提及原作者，禁止任何商业用途**。

> 本仓库中原作者的个人内容（文章、关于页、相册、友链、备案号、联系方式、
> 图床直链等）均已移除或替换，仅保留框架与设计。

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

### 写一篇文章（推荐用脚本）

项目根目录有两个脚本，把整个流程简化成两条命令：

```bash
./new-post.sh "我的第一篇文章"    # 生成 posts/我的第一篇文章.md 并打开编辑器
./publish.sh "新增一篇文章"       # 提交 + 推送，自动部署
```

- 不带参数运行 `./new-post.sh` 会提示你输入标题
- 不想用脚本也行，手动在 `posts/` 里建 `.md` 文件，效果一样

### 文件名 = 网址

```
posts/我的第一篇文章.md   →   https://winter21c.github.io/posts/我的第一篇文章/
```

中文文件名完全可以，空格和大部分符号也行。

### 文章头部（front-matter）支持这些字段

```markdown
---
title: "文章标题"                    # 必填，显示在列表和页面标题
date: "2026-09-29 10:00:00"          # 必填，排序和归档按它来
description: "一句话摘要"             # 可选，显示在首页/杂谈列表
cover: "/background.webp"            # 可选，留空则用 siteConfig.defaultPostCover
tags: ["标签一", "标签二"]            # 可选，归档页按标签筛选
---

正文从这里开始，支持标准 Markdown：
**加粗**、*斜体*、`代码`、列表、表格、引用、代码高亮，
以及数学公式 —— 行内 $E = mc^2$，块级 $$ \int_0^1 x^2 dx $$。
```

### 三个板块

| 目录 | 板块 | 说明 |
|---|---|---|
| `posts/` | 文章 | 正式长文，会出现在首页轮播和「归档」 |
| `chatters/` | 杂谈 | 随笔碎碎念，字段格式与文章相同 |
| `moments/` | 说说 | 朋友圈式短内容 |

> ⚠️ `posts/` 和 `chatters/` **各自至少要保留一篇文章**。
> 本站是静态导出，动态路由必须至少产出一个页面，目录为空会导致构建失败。

### 本地预览（可选）

发布前想先看效果：

```bash
npm run dev      # 打开 http://localhost:3000
```

### 发布

```bash
./publish.sh "这次改了什么"      # 或者手动 git add . && git commit -m "..." && git push
```

推送后 GitHub Actions 会自动构建并发布，约 1～2 分钟生效。
进度可在仓库的 **Actions** 标签页查看。

### 改站点信息

所有个人化配置集中在 **`siteConfig.ts`** 一个文件里，
搜索 `【请修改】` 即可找到所有需要替换的地方。

其中「个人名言」对应 `motto` 字段，会显示在**首页个人卡片**和**关于页**的简介下方：

```ts
motto: "把这句话换成你的个人名言。",   // 留空 "" 则不显示
```

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
