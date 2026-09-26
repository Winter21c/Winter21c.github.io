// 友链数据源
// 原项目这里是一条指向 prts.wiki 的演示友链，已清空。

export interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export const friendsData: Friend[] = [
  // 示例（取消注释并改成你自己的友链即可）：
  // {
  //   id: "friend-id",
  //   name: "朋友的站点名",
  //   description: "一句话简介",
  //   avatar: "https://朋友的站点/avatar.jpg",
  //   url: "https://朋友的站点",
  //   themeColor: "rgba(99, 102, 241, 0.5)",
  // },
];
