// 相册数据源
// 照片存放在 public/photos/<相册目录>/ 下。
//
// ⚠️ 关于隐私：所有照片在上传前都已「缩放 + 彻底剥离 EXIF」。
// 原图里带有 Artist / Copyright 标签（含真实姓名拼音与英文名）、
// 相机型号、拍摄时间、Lightroom 版本等信息，均已被清除。
// 后续新增照片请务必同样处理，不要直接上传相机原图。

export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    id: "2020-bund",
    title: "2020年外滩",
    description:
      "这些照片摄于 2020 年国庆，是我第一次参加高中摄影社活动时留下的。那时，我刚拥有自己的第一台相机——尼康 D5600 和 18-55mm 套机。学业繁重，我对爸妈软磨硬泡了很久，才终于把它盼到手。彼时的我还不懂 RAW，只会用 JPEG，也弄不明白相机上的闪光灯为什么总爱突然弹出来。可正是这些青涩、笨拙又真实的瞬间，成了我的摄影启蒙。它带我走进摄影，也把我带向许多人：在社团结识的朋友，以及因为摄影遇见的现在的女朋友。如今回看，那台相机留下的不只是照片，更是一段青春开始发光的证据。",
    cover: "/photos/2020-bund/01.jpg",
    date: "2020.10",
    photos: [
      { url: "/photos/2020-bund/01.jpg", caption: "外滩的大楼" },
      { url: "/photos/2020-bund/02.jpg", caption: "江对岸的陆家嘴" },
      { url: "/photos/2020-bund/03.jpg", caption: "在江堤上拍南京路的人" },
      { url: "/photos/2020-bund/04.jpg", caption: "要上岗的同志" },
    ],
  },
  {
    id: "yanxue",
    title: "2020年研学",
    description:
      "如果说前面那些照片，是我摄影的启蒙；那么这些在外滩 BFC 研学时拍下的画面，就是我真正开始“玩摄影”的证明。那时我学了一些摄影常识，也把 D5600 换成了佳能 M6 Mark II。卖掉旧相机，入手 M6 Mark II 和 18-150mm 镜头，一镜走天下。无反轻、小、顺手，比单反更让我愿意随时举起相机。那天在外滩 BFC，我拍得酣畅淋漓——原来器材的升级，不只是参数的改变，更是让我离摄影更近了一点。",
    cover: "/photos/yanxue/01.jpg",
    date: "2021.05",
    photos: [
      { url: "/photos/yanxue/01.jpg" },
      { url: "/photos/yanxue/02.jpg" },
      { url: "/photos/yanxue/03.jpg" },
      { url: "/photos/yanxue/04.jpg" },
      { url: "/photos/yanxue/05.jpg" },
    ],
  },
  {
    id: "2021-palou",
    title: "2021年第一次爬楼",
    description:
      "如果说换相机让我开始主动表达，那么那次爬楼，就是第一次把我真正推进摄影的新世界。学长和摄影社社长带着我，爬上高高的楼。我以前不知道，照片还能这样拍。等站上去，城市在脚下铺开，我才明白什么叫登高望远。那次之后，我对摄影的兴趣彻底被点燃。只是浪漫归浪漫，背着一大堆器材爬楼，也是真的累。",
    cover: "/photos/2021-palou/01.jpg",
    date: "2021.02",
    photos: [
      { url: "/photos/2021-palou/01.jpg" },
      { url: "/photos/2021-palou/02.jpg" },
    ],
  },
  {
    id: "2022-school",
    title: "2022年在学校拍的",
    description:
      "这是我在军训结束之后在学校里面拍的。",
    cover: "/photos/2022-school/01.jpg",
    date: "2022.10",
    photos: [
      { url: "/photos/2022-school/01.jpg" },
      { url: "/photos/2022-school/02.jpg" },
      { url: "/photos/2022-school/03.jpg" },
    ],
  },
];
