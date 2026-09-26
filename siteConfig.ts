// siteConfig.ts —— 你的全站「控制中心」
// ---------------------------------------------------------------------------
// 这是你日常唯一需要修改的文件。带【请修改】标记的地方换成你自己的即可。
// 改完后提交推送，GitHub Actions 会自动重新构建并发布。

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "不完美笔记", // 【请修改】浏览器标签页标题
  faviconUrl: "https://github.com/Winter21c.png", // 【请修改】站点图标
  authorName: "Winter21c", // 【请修改】你的昵称
  bio: "这里写一句自我介绍。", // 【请修改】首页个人简介

  navTitle: "不完美笔记", // 【请修改】导航栏左侧显示的短名

  // 导航栏标题的拼装方式：navTitle + navSuffix + navAfter
  // 留空则对应部分不显示（例如现在整条只显示「不完美笔记」）。
  // 想恢复成 "A の B" 这种样式，就把 navSuffix 设为 "の"、navAfter 设为后半段。
  navSuffix: "",
  navAfter: "",

  // 2. 头像设置（支持网络链接；也可把图片放进 public/ 后用 "/me.jpg"）
  avatarUrl: "https://github.com/Winter21c.png", // 【请修改】

  // 3. 网站背景设置
  // useGradient: true  → 使用 themeColors 的呼吸流动渐变（零外部依赖）
  // useGradient: false → 使用 bgImages 里的图片轮播
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  // 自定义壁纸：把图片放进 public/ 后写 "/文件名"。
  // 当前这张由你本机的 PNG 转成 WebP（1920x1080，2.0MB → 149KB）。
  // 放多张会每 10 秒自动轮播切换。
  bgImages: [
    "/background.webp",
  ],

  // 4. 文章默认封面图（Markdown 没写 cover 时显示）【请修改】
  defaultPostCover: "https://github.com/Winter21c.png",

  // 5. 首页照片墙预览图【请修改】
  photoWallImage: "https://github.com/Winter21c.png",

  // 6. 网易云音乐歌单：填歌曲 ID（网易云网页版链接里那串数字）
  //    构建时会自动抓取歌名/歌手/封面/歌词，并「实测能否播放」后烘焙成静态 JSON。
  //    ⚠️ VIP / 付费 / 下架歌曲会被自动跳过（它们的免费外链只返回一个提示页）。
  //    留空数组 [] 则完全关闭播放器。
  cloudMusicIds: [
    "64106",      // 吟游诗人 — 陈奕迅
    "2741911836", // 我爱你但是我要回家 — JaylenC（原版 ET/Happer 是 VIP，放不了）
    "2111476579", // 恋人 — 刘嘉星（李荣浩版是 VIP，放不了）
  ],

  // 7. 社交联系方式：**留空即不显示该图标**（首页与文章页均生效）
  //    目前只保留 GitHub，其余已按要求清空。
  social: {
    github: "https://github.com/Winter21c",
    gitee: "",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },
  counts: {
    photos: 128, // 照片墙数量，可手动写死
  },
  chatterTitle: "云端杂谈", // 杂谈板块的名字
  chatterDescription: "碎片记录", // 【请修改】

  // 8. 全局背景弹幕【请修改】
  danmakuList: [
    "你好呀~",
    "欢迎来到我的小站",
    "今天也要加油",
    "在写代码",
    "摸鱼中",
    "记得多喝水",
    "这里是我的数字花园",
  ],

  // 9. 评论系统 Gitalk
  //    ⚠️ GitHub Pages 是纯静态托管，Gitalk 的 OAuth 换 token 步骤会被浏览器
  //    CORS 拦截，登录大概率失败。这里保持留空 → 评论区整块自动隐藏。
  //    想要能用的评论，推荐改用 giscus（见 README）。
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "Winter21c",
    admin: ["Winter21c"],
  },

  buildDate: "2026-09-26T00:00:00", // 【请修改】建站日期，用于计算运行天数

  footerBadges: [
    {"name": "Next.js", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"},
    {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"},
    {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"},
  ],

  // 10. ICP 备案信息：留空则不显示。⚠️ 请勿填写他人的备案号。
  icpConfig: {
    name: "",
    link: "",
  },

  // 11. AI 猫猫助理配置
  //     ⚠️ 该功能依赖服务端调用 Gemini（避免密钥泄露），GitHub Pages 无法运行，
  //     因此本仓库已移除 CyberCat 组件。此段配置保留仅作参考，改了不会有任何效果。
  //     如需恢复，请参考 README「已移除的功能」一节。
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。",
    maxOutputTokens: 150,
    temperature: 0.85,
  },

  friendLinkApplyFormat:
    "名称：Winter21c の 宝藏之地\n简介：这里写一句简介\n链接：https://winter21c.github.io\n头像：https://github.com/Winter21c.png",

  enableLevelSystem: true, // 等级系统，可在设置里关闭
};
