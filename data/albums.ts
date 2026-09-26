// 相册数据源
// 照片建议放到 public/ 目录后用 /文件名.jpg 引用，或填你自己的图床直链。
// 原项目这里填的是原作者图床的测试图，已清空。

export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  // 示例（取消注释并改成你自己的内容即可）：
  // {
  //   id: "my-album",
  //   title: "相册标题",
  //   description: "相册描述",
  //   cover: "/default-cover.svg",
  //   date: "2026.09",
  //   photos: [
  //     { url: "https://你的图床/照片1.jpg", caption: "照片说明" },
  //   ],
  // },
];
