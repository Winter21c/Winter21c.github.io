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
    id: "proj_archlinux_raphael",
    name: "Arch Linux on Redmi K20 Pro",
    githubUrl: "https://github.com/Winter21c/archlinux-xiaomi-raphael",
    description:
      "为小米 Redmi K20 Pro / Mi 9T Pro（代号 raphael，SM8150）从零构建 Arch Linux ARM：U-Boot + systemd-boot + 定制内核 + KDE Plasma 6 / Plasma Mobile 完整镜像流水线，无需 root 即可构建，云端 CI 一键出刷机镜像",
    icon: "📱",
    tags: ["Arch Linux", "Plasma Mobile", "U-Boot", "SM8150", "Linux 手机"],
  },
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
