---
title: "我是如何修改她的 blog 的"
date: "2026-09-29 10:45:00"
description: "把一个为 Vercel 而写的 Next.js 博客，搬到我自己的 GitHub Pages 上——记录其中的取舍、踩过的坑，以及每一次判断的依据。"
cover: "/background.webp"
tags: ["Next.js", "GitHub Pages", "静态站点", "踩坑记录"]
---

## 缘起

在 GitHub 上翻到一个很喜欢的博客项目：[XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)。
毛玻璃的质感、会呼吸的渐变背景、能跟着歌词滚动的播放器——做得相当用心。

我想要一个一样的。但我只有 GitHub Pages。

于是就有了这个站，也有了这篇记录。

---

## 第一道坎：GitHub Pages 没有服务端

先把她的代码拉下来看。Next.js 16 的 App Router，结构很清爽。

但在 `next.config.ts` 里，我看到了一行被注释掉的配置：

```ts
// 🚨 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
// output: 'export',
```

这句话把所有事情都交代清楚了：**这个项目是给 Vercel 写的**。

Vercel 能给 Next.js 跑服务端，所以作者可以放心地用 `app/api/` 下的路由。
我数了一下，一共 5 个：

| 路由 | 用途 |
|---|---|
| `/api/chat` | AI 猫猫助理（调 Gemini） |
| `/api/music` | 网易云歌单代理 |
| `/api/weather` | 天气挂件 |
| `/api/github` | Gitalk 评论的 OAuth 代理 |
| `/api/test` | 开发用 |

而 GitHub Pages 只能托管**纯静态文件**。没有 Node 进程，没有环境变量，没有任何服务端逻辑。

我先把 `output: 'export'` 打开试了一下，构建直接报错，说的很直白：

```
Error: export const dynamic = "force-static"/export const revalidate not configured
       on route "/api/weather" with "output: export"
```

所以整件事的核心就变成一句话：**把「运行时的服务端逻辑」，翻译成「构建时的静态产物」，或者干脆砍掉。**

---

## 功能上的取舍

砍功能是最容易的，但也是最偷懒的。我尽量对每一个功能单独判断。

### AI 猫猫：砍掉，没有犹豫

它调用 Gemini，密钥必须存在服务端。

静态站想保留这个功能，只有一条路：把密钥打包进前端的 JS。
而前端 JS 是**公开**的——任何人打开开发者工具都能把密钥抠出来，然后拿去刷你的额度。

这不是"有点风险"，这是**必然泄露**。

所以直接移除组件。想要的话，正确做法是单独部署一个 Serverless 函数存密钥，
前端去调那个函数——但那又回到"需要服务端"了。

### 天气：发现它本来就是死代码

我准备动手改的时候先搜了一下引用，结果发现 `WeatherWidget` 和 `WeatherEffect`
**在整个项目里没有任何地方 import 它们**。

纯粹是遗留文件。删掉即可，零成本。

> 教训：动手之前先搜引用。有时候你以为要解决的问题，根本不存在。

### 歌单：从"运行时代理"改成"构建期烘焙"

这是我花时间最多的一块。

先看原来的 `/api/music` 做了什么——读完之后发现，它**不包含任何密钥**，
只是替浏览器去请求网易云的接口，再把结果转发回来。

换句话说，它存在的唯一理由是**绕开浏览器的跨域限制**。

静态站没有服务端，那能不能让浏览器直接请求网易云？不行，CORS 会拦。

那换个思路：**既然构建时是自由的，为什么不在构建时就把数据抓好？**

于是写了个脚本 `scripts/fetch-music.mjs`，在 `next build` 之前跑：

```
构建时：抓取歌单 → 写入 public/music-data.json
运行时：播放器只读这个静态 JSON
```

这样运行时零外部依赖，外部接口挂了也不影响已经构建好的站点。

#### 但是踩到了两个坑

**坑一：VIP 歌曲不会报错，而是返回一个"假页面"。**

网易云的免费外链 `song/media/outer/url?id=xxx.mp3`，遇到 VIP / 付费 / 已下架的歌曲时，
**不会返回 404**，而是返回一个 `200` + `text/html` 的"无法播放"提示页（约 107KB）。

如果不过滤，播放器里就会出现点进去没反应的坏歌。

我的做法是：构建时先用 Range 请求只取开头两个字节，
检查 `content-type` 是不是 `audio/*`——是才收进歌单。

```js
// 只取 2 字节，不用为一个 4MB 的 mp3 白下载一遍
headers: { Range: 'bytes=0-1' }
const type = res.headers.get('content-type') || '';
if (!type.startsWith('audio/')) return { ok: false, reason: '通常是 VIP/下架歌曲' };
```

顺带说，这里还写错过一次：我原本用 `content-length` 兜底判断文件大小，
但 Range 请求下它只返回 `2`，会被误判成"文件太小"。
必须用 `content-range` 里的总长度，没有就跳过这个检查。

**坑二：地域限制——这个最隐蔽。**

本地构建一切正常，三首歌全都抓到了。推到 GitHub 之后，线上却只剩一首。

我去看 CI 的构建日志，发现另外两首返回的是 `text/html`。

原因是：**GitHub Actions 的构建机在美国**，而网易云的外链接口有地域限制，
部分国内版权歌曲在境外 IP 下拿不到音频。

这不是代码问题，是物理距离问题。

解决办法是加一层「基线」：

- `public/music-data.json` 提交进仓库，它记录着**我在国内网络下抓到的完整歌单**
- 构建时优先实时抓取，**抓取失败的曲目自动回退到基线数据**，而不是被丢弃

```js
const cached = baseline.get(String(r.id));
if (cached) {
  console.log(`♻️ ${r.id} 实时抓取失败，沿用基线数据：${cached.name}`);
  return cached;
}
```

这样即使 CI 抓不到，线上依然是完整的。**换歌的正确姿势也变成了：在本地抓好，
把 json 一起提交。**

### 评论区：留着，但让它安静地隐藏

Gitalk 需要走 GitHub OAuth 换 token，而 GitHub 的 token 端点不发 CORS 头，
必须有个服务端代理——正是被删掉的那个 `/api/github`。

静态站上这一步走不通，登录一定会失败。

我没有删组件，而是加了一道判断：**配置为空时整块隐藏**。
这样不会在页面上留一个点不动、还会报错的评论框。

想真正用评论的话，应该换 [giscus](https://giscus.app/zh-CN)——
基于 GitHub Discussions，不需要密钥也不需要服务端，天生适配静态站。

---

## 三个更隐蔽的坑

前面那些是"看得见"的问题。下面这三个，是只有真正构建、部署之后才会暴露的。

### 坑一：字体让构建变成了一场赌博

项目用了 `next/font/google` 加载 Google 字体。

问题是：**`next/font` 会在构建期把字体文件全部下载下来。**

而 `Noto Serif SC` 这类中文字体，为了做 unicode-range 分包，
被切成了**上百个 woff2 分片**——构建时要一个一个全部拉下来。

网络稍有波动，就会出现：

```
Error while requesting resource
There was an issue requesting https://fonts.gstatic.com/s/notoserifsc/v35/....woff2
Error: Turbopack build failed with 9 errors
```

我遇到的情况是：同一个项目，有时构建成功，有时失败。**构建结果取决于网络运气**，这不能接受。

而且我顺手查了一下，项目里定义的 `--font-geist-sans` / `--font-geist-mono` 两个变量
**从未被任何组件使用过**——纯属白下载。

改法是把字体从"构建期"挪到"运行时"：

```tsx
// 不再用 next/font，改成在 <head> 里直接 <link>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&display=swap" />
```

配合一份完整的系统字体栈兜底：

```css
--font-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif;
```

效果：

- **构建不再依赖任何外部网络**，永远不会因此失败
- 能连上 Google 的访客看到 Noto Serif SC
- 连不上的访客自动回落到系统宋体，不会白屏

顺带修掉一个 bug：原来的字体栈写的是 `--font-serif: var(--font-serif), ...`，
**自己引用自己**——CSS 判定为循环引用，整条声明直接失效。

### 坑二：中文文件名会让构建崩溃

我建了一篇测试文章，文件名用了中文。构建直接失败：

```
Error: ENOENT: no such file or directory,
open '.../posts/%E6%B5%8B%E8%AF%95%E6%96%87%E7%AB%A0%EF%BC%9A...md'
```

看得出来，路径里的中文被 **URL 编码**了。

原因是：Next.js 把动态路由的参数 `params.slug` 以 URL 编码形式传进来，
而代码直接拿它去拼文件路径：

```ts
const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`);
//                                               ^^^^ 这里是 %E6%B5%8B...
```

对一个中文博客来说这是致命的——**等于强制你只能用英文文件名**。

修法是解码后再用（英文文件名解码后不变，所以对已有文章没有影响）：

```ts
let slug = resolvedParams.slug;
try { slug = decodeURIComponent(slug); } catch { /* 保底 */ }
```

### 坑三：关于页的正文根本不在 HTML 里

这个最隐蔽，因为它**不影响使用**——页面看起来完全正常。

我是在做最终检查时，想确认名言有没有正确渲染，顺手 grep 了一下关于页的静态 HTML，
结果发现整个正文区只有 46 个字符：

```
不完美笔记 不完美笔记 首页 项目 归档 照片墙 音乐 说说 杂谈 关于 正在载入档案...
```

**「Hello World, I'm ...」那一行、自我介绍、名言，全都不在。**

原因是 `AboutClient` 用了 `useSearchParams()` 来读取当前是哪个 tab。
而 Next.js 遇到 `useSearchParams()` 时会**放弃预渲染整个页面**，
只留下一个 Suspense 占位符。

后果：

- 搜索引擎抓到的关于页，内容只有"正在载入档案..."——**SEO 等于零**
- 禁用 JS 的访客看到一片空白

改成挂载后从 URL 里读，页面就能正常预渲染了：

```tsx
const [activeTab, setActiveTab] = useState('intro');
useEffect(() => {
  const syncFromUrl = () => {
    setActiveTab(new URLSearchParams(window.location.search).get('tab') || 'intro');
  };
  syncFromUrl();
  window.addEventListener('popstate', syncFromUrl);
  return () => window.removeEventListener('popstate', syncFromUrl);
}, []);
```

关于页的静态正文从 **46 字符变成 365 字符**，而 tab 的切换交互完全没变
（深链接 `?tab=activity` 也验证过，正常）。

---

## 复盘：几次判断的依据

回头看，真正决定成败的不是写代码，而是几个判断：

**1. 先跑起来，再谈优化。**

我没有一开始就逐个分析 API 路由。而是先把 `output: 'export'` 打开、直接构建，
让编译器告诉我哪里不行。**报错信息比通读代码快得多。**

**2. 区分「必须服务端」和「只是恰好写了服务端」。**

同样是 API 路由，性质完全不同：

- AI 猫猫是**本质上**需要服务端（要藏密钥）
- 歌单代理只是**恰好**用了服务端（它没有任何秘密，只是绕 CORS）

前者只能砍，后者可以搬到构建期。这个区分决定了能保留多少功能。

**3. 构建产物要和构建环境解耦。**

字体和歌单这两个坑本质上是同一类问题：
**让构建过程依赖了外部的、不可控的东西。**

判断标准很简单：如果同一个 commit 在不同网络下构建结果不同，那这个设计就是错的。

**4. 边界条件要真的去试。**

VIP 歌曲不报 404 而是返回假页面、中文文件名会崩、空目录会让构建失败——
这些没有一个能从读代码看出来，全是撞上去的。

**5. 看不见的地方也要查。**

关于页那个问题，页面表现完全正常，只有去 grep 静态产物才会发现。
如果我只在浏览器里点一遍就收工，它会一直留在那里。

---

## 最后

这个站能跑起来，绝大部分功劳是她的。

毛玻璃的视觉、背景粒子的动效、跟着歌词滚动的播放器、时间线、照片墙——
**这些东西我一样都没做**，我只是把它们从 Vercel 搬到了 GitHub Pages 上，
然后处理搬运过程中撞到的墙。

原项目在这里，如果你也喜欢这个风格，请去给她点个 Star：

👉 <https://github.com/heiehiehi/XinghuisamaBlogs>

> 原项目采用 CC BY-NC 4.0 协议：允许学习和二次修改，二次发布需注明原作者，禁止商业用途。

至于我改的这一版——所有代码都在
[Winter21c/Winter21c.github.io](https://github.com/Winter21c/Winter21c.github.io)，
改动清单写在 README 里。

就这样。开始写第二篇。
