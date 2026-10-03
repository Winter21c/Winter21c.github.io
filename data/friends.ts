// 友链数据源
// 新增一条照着下面的结构追加即可。themeColor 是卡片上的装饰色（rgba）。

export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export const friendsData: Friend[] = [
  {
    id: "xinghuisama",
    name: "XingHuiSamaの宝藏之地",
    description: "今天我也要学习吗",
    avatar: "https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg",
    url: "https://www.xinghuisama.top",
    themeColor: "rgba(168, 85, 247, 0.5)",
  },
];
