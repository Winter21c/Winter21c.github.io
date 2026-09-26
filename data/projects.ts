// 项目矩阵数据源
// 新增项目时照着下面的结构追加一条即可。

export type Project = {
  id: string;
  name: string;
  description: string;
  icon: string;
  githubUrl: string;
  tags: string[];
};

export const projectsData: Project[] = [
  {
    id: "proj_immortalwrt_fusion",
    name: "ImmortalWrt Fusion",
    githubUrl: "https://github.com/Winter21c/immortalwrt-fusion",
    description:
      "以 ImmortalWrt 为底座，在 GitHub Actions 上按需并入 FanchmWrt 与/或 iStoreOS 特性的 x86_64 固件构建器",
    icon: "🧩",
    tags: ["ImmortalWrt", "x86_64", "GitHub Actions", "固件构建"],
  },
  {
    id: "proj_fanchmwrt_istoreos",
    name: "FanchmWrt × iStoreOS",
    githubUrl: "https://github.com/Winter21c/fanchmwrt-istoreos",
    description:
      "FanchmWrt × iStoreOS 融合固件 —— 以 FanchmWrt 为底座，移植 iStoreOS 的首页面板 / Docker / iStore 应用商店，面向 x86_64 软路由",
    icon: "📦",
    tags: ["OpenWrt", "iStoreOS", "Docker", "软路由", "NAS"],
  },
];
