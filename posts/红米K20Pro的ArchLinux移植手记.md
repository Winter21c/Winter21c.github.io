---
title: "红米 K20 Pro 的 Arch Linux 移植手记"
date: "2026-10-02 17:25:00"
description: "从 U-Boot 引导到 KDE Plasma Mobile，从零构建一台能 ssh、能 pacman 的手机系统。附带 8 个看起来毫无道理的坑，以及它们真正的根因。"
cover: "/background.webp"
tags: ["Arch Linux", "Linux 手机", "SM8150", "U-Boot", "移植", "踩坑记录"]
---

> 一篇写给"想试试、或者正在踩同一个坑"的人的记录。
> 不需要认识这台手机，但需要一点命令行基础。所有结论都在真机上验证过。

---

## 一、起因：为什么要把手机刷成 Linux

手里有台退役的 Redmi K20 Pro（代号 raphael，骁龙 855+）。它跑 Android 已经没什么意思了，
但它有完整的 Qualcomm 上游支持、可解锁的 bootloader、以及一块不错的 AMOLED ——
拿来跑一个**真正属于自己、能 `ssh` 进去、能 `pacman -S` 装东西的桌面级 Linux**，
比刷个第三方 ROM 有意思得多。

今天的成果是这样的：

| 能力 | 状态 |
|:--|:--|
| 开机 | ✅ 18.7 秒进 Plasma Mobile 桌面（firmware 4.96s + 引导器 3.25s + 内核 1.70s + 用户空间 8.78s） |
| 触摸屏 / 屏幕键盘 / 中英切换 | ✅ |
| Wi-Fi | ✅ 自动连 5G，2.4G 兜底 |
| 蓝牙 | ✅ 可扫描、可配对 |
| 扬声器 / 音量调节 | ✅ |
| USB 网络共享 | ✅ 插上电脑就是 `ssh user@172.16.42.1` |
| 麦克风 / 相机 | ❌ 还不能用（见最后一节） |

整个系统是**从零构建**的：U-Boot 引导 → systemd-boot → 定制内核 → Arch Linux ARM（btrfs）→ KDE Plasma Mobile，
另外还有一个 GitHub Actions 工作流，点一下就能在云端出刷机镜像。

但真正花时间的不是"让它开机"，而是**八个看起来毫无道理的 bug**。下面每个都按
「现象 → 我一开始以为 → 真相 → 怎么修」来讲。

---

## 二、先花一分钟搞清楚它是怎么开机的

不然下面的坑会很难懂。这台手机开机走三段：

```
① boot 分区      →  U-Boot            （引导器，相当于 PC 的 BIOS+GRUB）
② cache 分区     →  systemd-boot + 内核 + initramfs + 设备树   （一个小 FAT32 分区）
③ userdata 分区  →  真正的系统（btrfs 文件系统）
```

两个关键概念：

- **initramfs**：跟着内核一起被加载的"应急小包"。内核启动时真正的系统还没挂上，
  需要驱动、工具、固件时只能用这个包里的东西。
- **设备树（DTB）**：一份"这块板子上有什么硬件、怎么接线"的说明书，内核靠它认识硬件。
  高通手机的设备树是**每台设备一份**的（后面第 7 个坑就跟这个有关）。

---

## 三、八个坑

### 坑 1：开机/熄屏瞬间的花屏 —— "固件放错了抽屉"

**现象**：开机闪一下彩色条纹，熄屏时偶尔也花。不是一直花，就是一瞬间。

**我一开始以为**：屏幕驱动或者刷新率问题，试了各种内核参数。

**真相**：GPU 固件**根本没被找到**，但只差那么 0.3 秒。

GPU 驱动（`msm_dpu`/`adreno`）是**编译进内核**的，所以它在开机 **0.6 秒**就醒来要固件 ——
那时候真正的系统还没挂上，只能从 initramfs 里拿。而我们的 initramfs 里**明明放了固件**，
dmesg 却在骂街：

```text
[ 0.63s] msm_dpu: Direct firmware load for qcom/a630_sqe.fw failed with error -2
[ 0.63s] msm_dpu: [drm:adreno_request_fw] *ERROR* failed to load a630_sqe.fw
[10.0s]  msm_dpu: [drm:adreno_request_fw] loaded qcom/a630_sqe.fw from new location
```

注意第三行：**10 秒后又加载成功了**。因为那时系统已经挂上，固件在 `/usr/lib/firmware` 里躺着。
但 GPU 早就用"没有固件"的状态初始化完了自己 —— 这才是花屏的来源。

为什么 0.6 秒时找不到？因为我们把固件放进了 initramfs 的 `usr/lib/firmware/`，
而**内核的固件加载器只按 `/lib/firmware` 这个路径找**。系统启动后能成功，是因为
真实系统里 `/lib` 是一个指向 `usr/lib` 的软链 —— 而我们的 initramfs 里**没有这个软链**。

就像你把护照放进了"随身包"的第二层，但安检只看第一层：东西在，路径不对。

**修法**：一行。

```bash
# scripts/08-initramfs.sh
mkdir -p "$IR"/{bin,sbin,proc,sys,dev,run,tmp,newroot,usr/lib/firmware}
ln -sfn usr/lib "$IR/lib"      # ★ 内核只认 /lib/firmware
```

**验证**（不用刷机，因为 `cache` 分区就是系统的 `/boot`）：

```bash
scp work/initramfs.img user@172.16.42.1:/tmp/
ssh user@172.16.42.1 'echo 1234 | sudo -S cp /tmp/initramfs.img /boot/initramfs && sudo reboot'
# 重启后
sudo dmesg | grep -c "failed to load a630_sqe"    # 0
sudo dmesg | grep a630_sqe                        # [0.94s] loaded ... ← 提前了 9 秒
```

> 这个坑最值得记住的一点：**"10 秒后加载成功"曾经让我以为问题已经修好了**。
> 实际上要看的不是"最终成功了吗"，而是"**第一次要用它的时候成功了吗**"。

---

### 坑 2：拖动音量条就卡死、扬声器没声音 —— 8 声道 vs 只吃 2 声道的 DSP

**现象**：一拖音量条，整个音频栈卡住几秒；扬声器从头到尾没声音。dmesg 每 3 秒刷屏：

```text
qcom-q6afe: AFE enable for port 0x1006 failed -110        (ETIMEDOUT)
q6afe-dai: ASoC error (-110): at snd_soc_dai_prepare() on QUAT_MI2S_RX
```

**我一开始以为**：功放坏了 / 设备树接错线 / 需要 Android 那套 `mixer_paths.xml`。

**真相**：PipeWire 给扬声器通路默认选了 **`s16le 8ch`（8 声道）**，
而高通 DSP 里那条 QUAT_MI2S 通路**只接受 1 或 2 声道**。
8 声道让 DSP 去找一个不存在的配置，端口使能超时（`-110`）；
每次改音量/重开音频流都会重走"使能端口"这一步，所以"一调就卡"。

**修法**：用 WirePlumber 规则把它**钉死成 2 声道**，并且不让音频节点挂起
（每次挂起重开都会重建一遍 DSP 会话，正是"卡"的来源）：

```json
// ~/.config/wireplumber/wireplumber.conf.d/51-raphael-alsa.conf
monitor.alsa.rules = [
  {
    matches = [ { node.name = "~alsa_output.*" } ]
    actions = {
      update-props = {
        audio.format = "S16LE"
        audio.rate = 48000
        audio.channels = 2
        session.suspend-timeout-seconds = 0
      }
    }
  }
]
```

**验证（不用耳朵，纯文本）**：

```bash
pactl list sinks | grep "Sample Specification"    # s16le 2ch 48000Hz
sudo dmesg | grep -c "AFE enable.*failed"         # 0
sudo grep '^00:' /sys/kernel/debug/regmap/0-0034/registers   # 00: 0018  ← 功放已开
```

最后那行值得解释一下：功放芯片（TFA9874）的寄存器 `0x00` 里第 3 位是"功放使能"。
`0x0018` 说明**它确实开着**，所以"没声音"根本不是功放的问题 ——
**先证明链路是通的，再去怀疑别的地方**，能省掉很多瞎试。

> 另一个小发现：给多媒体的路由也必须补全。`MultiMedia1`（也就是 `aplay` 的默认设备 `hw:0,0`）
> 原本一个后端都没接，内核会直接报 `no backend DAIs enabled for MultiMedia1`：
> 播放"成功"，一点声音没有。

---

### 坑 3：屏幕键盘能弹出来，但字打不进输入框

**现象**：虚拟键盘弹得很积极，点上去也有反馈，**但输入框里一个字都没有**；
有时候还关不掉。

**我一开始以为**：这是 Plasma Mobile 的 bug，或者键盘包版本问题。

**真相**：Qt 里有两个差一个字母的环境变量，含义完全不同：

- `QT_IM_MODULE`（单数）→ 给**应用程序**看的
- `QT_IM_MODULES`（复数）→ 给**合成器（KWin）**看的

我们一开始全局设了 `QT_IM_MODULE=fcitx`：键盘能弹（因为 KWin 那边有自己的逻辑），
但输入事件走的是 fcitx5 的路，而 fcitx5 在这套 Wayland 环境下根本收不到事件 ——
于是就变成"键盘在，字进不去"。
反过来全局设 `qtvirtualkeyboard` 又会让 plasma-keyboard 走一条它自己声明**不支持**的
client-side 路径，直接闪退。

**修法**：三个地方必须同时正确：

| 位置 | 内容 | 为什么 |
|:--|:--|:--|
| `~/.config/kwinrc` | `[Wayland] InputMethod[$e]=/usr/share/applications/org.kde.plasma.keyboard.desktop` | 告诉 KWin 用哪个虚拟键盘 |
| KWin 的 systemd drop-in | `QT_IM_MODULES=qtvirtualkeyboard` | **只有合成器**需要这个 |
| plasma-keyboard 的启动项 | `Exec=env -u QT_IM_MODULES plasma-keyboard` | 键盘自己启动时**要把它清掉** |
| `/etc/environment` | 不要出现任何 `QT_IM_*` | 全局设置会污染所有应用 |

还有一个 KDE 的小陷阱：键盘的语言列表存在 `~/.config/plasma-keyboardrc`：

```ini
[General]
enabledLocales=zh_CN,en_US      # 逗号后面不能有空格！
```

写成 `"zh_CN, en_US"` 的话，KConfig 不会帮你去掉空格，第二个语言会变成非法的 `" en_US"`，
表现就是**英文切不出来**。而这个文件只有"系统设置 → 键盘 → 屏幕键盘 → 语言"里的
那个 KCM 会正确写 —— 手改配置文件很容易踩这个空格坑。

---

### 坑 4：本地编译一切正常，云端编译出来的镜像没 Wi-Fi、没声音

**现象**：GitHub Actions 构建的镜像刷进去：Wi-Fi 扫不到任何网络，声音也没有，
`dmesg` 又是那个 `AFE enable ... failed -110`。而我本机构建的镜像一切正常。

**我一开始以为**：CI 缓存脏了，或者云端的内核参数不一样。

**真相**：`05-qcom.sh` 这个阶段要从源码交叉编译 4 个高通用户态程序
（`rmtfs`、`pd-mapper`、`tqftpserv`、`qrtr`）。编译顺序是：

1. 先编出 `libqrtr.so.1`
2. 再用 `-lqrtr` 去链接那 4 个程序

问题在第 2 步：**`-lqrtr` 只会找 `libqrtr.so` 或 `libqrtr.a`，不认 `libqrtr.so.1`**。
本地构建时，rootfs 里还留着**上一次**装好的 `/usr/lib/libqrtr.so`，
编译器的 sysroot 搜索路径会顺手把它捞出来，所以本地永远看不出问题；
CI 是全新 rootfs，于是：

```text
ld.lld: error: unable to find library -lqrtr        ← 4 个程序全部链接失败
```

而脚本当时只 `warn` 不报错，于是**静默产出了一个没有 Wi-Fi、没有声音的镜像**。

为什么这几个程序这么关键？因为 `tqftpserv` 负责通过 QRTR 把固件送给 DSP：

- 没有它 → Wi-Fi 芯片拿不到网卡固件（QRTR 服务列表里看不到 `ATH10k WLAN firmware service`）
- 没有它 → DSP 的音频端口使能超时（`-110`）→ 又是一样的"没声音"

**修法**：

```bash
# scripts/05-qcom.sh —— 编完立刻补软链
if compile libqrtr ... -o "$STAGE/libqrtr.so.1" ...; then
  OK_LIBQRTR=1
  ln -sfn libqrtr.so.1 "$STAGE/libqrtr.so"     # ★ -lqrtr 只认 libqrtr.so
fi
```

并且把"产物校验"从 `warn` 改成 **`die`**：缺 `rmtfs`/`tqftpserv`/`libqrtr.so.1` 直接终止构建。

> 这个坑的教训：**"我本地能跑"不代表构建脚本是对的**。
> 凡是"本地有历史残留可以兜住"的依赖，都要假设**干净环境**会挂。

---

### 坑 5：`dnsmasq` 一起床就死 —— 换了新发动机，还装着旧变速箱

**现象**：开机后 `dnsmasq` 反复重启到放弃：

```text
/usr/lib/libnftables.so.1: version `LIBNFTNL_19' not found
    (required by /usr/lib/libnftables.so.1)
```

**真相**：这是典型的**半升级**。我们的构建脚本原来是：

```bash
pacman -S --needed <一长串包名>
```

它**只安装列表里的包，不升级 rootfs 基础镜像里自带的旧包**。
而 Arch Linux ARM 的 rootfs 压缩包常常落后官方仓库几周，
于是出现"新装的 `nftables` 需要新版 `libnftnl`，而系统里还是旧的"。

最坑的是：**`pacman` 自己的依赖检查完全看不出这个问题** ——
包版本号都满足声明，坏的是**符号版本**这一层。

**修法**：装完列表后再做一次全量对齐：

```bash
pacman -Su --noscriptlet --ignore linux-firmware
```

`--ignore linux-firmware` 是刻意的：仓库里这个包已经拆成了 meta 包，
升级会连带拉进 `mediatek`/`nvidia`/`radeon`/`realtek` **几个 GB 的无关固件**，
而手机只用 qcom + ath10k。

再加一道保险 —— **关键程序烟雾测试**：用 qemu 真的把
`bash` / `dnsmasq` / `nft` / `nmcli` / `iw` / `wpa_supplicant` 各跑一次
（`--version` 就行），只把"库/符号加载失败"当成致命错误。
这个检查后来**真的在 CI 上拦下了一次坏镜像** —— 否则又是一个"能刷但没网络"的产物。

---

### 坑 6：开机要 2 分钟 —— 有服务在"挡路"

**现象**：改完一堆配置后开机变成 **2 分 01 秒**。

**修法**：`systemd-analyze blame` 一看就明白了，两个服务挂在关键路径上：

| 服务 | 原来 | 耗时 | 改成 |
|:--|:--|:--|:--|
| `raphael-audio-init` | `Before=display-manager` | 1 分 46 秒 | 定时器 `OnBootSec=12s` |
| AUR 安装脚本 | `multi-user.target` | 1 分 43 秒 | 定时器 `OnBootSec=90s` |

结果：**2 分 01 秒 → 18.7 秒**。

> 经验：`Before=display-manager` 这类"我要在桌面之前做完"的写法非常危险，
> 一个慢操作就能让开机时间翻几倍。**能用定时器的就不要放在关键路径上。**

---

### 坑 7：蓝牙地址每台设备都不一样，而且写法是**反的**

**现象**：蓝牙完全不工作，`btmgmt` 报 `Invalid Index`，但固件下载日志显示一切正常。

**真相**（两层）：

第一层：蓝牙地址是**每台设备唯一**的，产线写在设备自己的数据里。
而我们的刷机流程会 `fastboot erase dtbo`，**把厂商那份带地址的设备树清掉** ——
地址一旦丢了，`persist` 分区、`bluetooth` 分区里的 NVM 文件里都**找不到明文**
（这几个地方我都实测翻过）。没有地址时，内核会因为"控制器上报全零地址"**直接关掉蓝牙**。

第二层更阴险：**设备树里存的地址字节序和系统显示的是相反的**。

| 配置里写（设备树） | `bluetoothctl` 显示 |
|:--|:--|
| `11 22 33 44 55 66` | `66:55:44:33:22:11` |

原因是内核（`net/bluetooth/hci_sync.c`）把设备树里的字节数组**原样**拷进
`bdaddr_t`，而打印函数 `%pMR` 是**反序**输出的。所以你在 Android 设置里看到的地址，
写进配置时要**反过来**。

**修法**：三条路都给你留好了：

```bash
# 1) 自己构建：写进 config/local.conf（已 gitignore，不会进仓库）
BT_MAC="11 22 33 44 55 66"

# 2) 云端构建：设仓库 Secret IMAGE_BT_MAC

# 3) 直接刷别人给的公开镜像（最常见）：一条命令改成自己的地址
./scripts/bt-mac.sh show boot-cache.img          # 先看现在是什么
./scripts/bt-mac.sh set  boot-cache.img "11 22 33 44 55 66"
#    或者刷机时顺手写： ./scripts/11-flash.sh --flash --bt-mac "11 22 33 44 55 66"
```

> 顺带一个"设备唯一性"的结论：**刷机前一定先把自己的蓝牙地址记下来**。
> 这台机器的 `dtbo` 被清过一次之后就再也找不回来了。

---

### 坑 8：镜像里所有文件的属主都变成 1000，开机 mount 全失败

**现象**：能开机，但 `systemd-remount-fs` 之类一堆服务失败，根分区停在只读。

**真相**：构建脚本在 **user namespace**（普通用户模拟 root）里跑，
`cp -a` 把宿主机的 uid（1000）原样带进了镜像 —— 包括 `/usr/bin/mount` 这个
**本该是 setuid root** 的程序。于是开机后 root 去执行 mount，实际以 uid 1000 运行 → 全部失败。

**修法**：灌数据之前做一次"属主归一化"：

```bash
# 整树 chown 回 0:0，恢复 21 个 setuid 文件，并断言关键程序正确
# lib.sh: normalize_ownership()
[ "$(stat -c '%u:%g %a' "$ROOT/usr/bin/mount")" = "0:0 4755" ] || die "..."
```

> 教训：**构建环境和目标环境不一致时，权限/属主是最容易被静默带偏的东西。**
> 加一句断言，比事后查一晚上强。

---

## 四、这些坑背后的共同规律

写完八个坑，回头看有几条是反复出现的：

1. **"最终成功了"不等于"用的时候成功了"**（坑 1）。
   判断固件/依赖是否就绪，要看**第一次需要它的那一刻**。
2. **本地能跑 ≠ 构建脚本对**（坑 4）。
   只要本地有"历史残留"能兜住某个缺失，就要假设干净环境（CI/新机器）会挂。
   这也是为什么我后来**每次都跑一遍云端 CI** 才算改完。
3. **日志里的 `WARN` 可能是致命的**（坑 4、5）。
   "少一个库 → 少三个程序 → 没 Wi-Fi 没声音"这种因果链，
   如果构建脚本只 `warn` 不 `die`，就会一路静默到用户手里。
4. **依赖检查看不出的东西，只能真跑一次**（坑 5）。
   包管理器检查的是版本号，不是符号版本；所以加了"关键程序 qemu 实跑"的烟雾测试。
5. **尽量用文本证据代替"感觉"**。
   这个项目里我几乎不靠耳朵/眼睛判断：
   音频看 DSP 错误计数和功放寄存器、花屏看固件加载时间戳、
   蓝牙看控制器地址、开机慢看 `systemd-analyze`。
   能写成 `grep`/`awk` 的结论，才是可复现的结论。
6. **设备唯一的数据，先备份再动手**（坑 7）。

---

## 五、现在还不能做什么

诚实地说，两个大件还没搞定：

- **麦克风**：采集链路已经全部上电（能看到 DAPM 里各环节都是 `On`），
  但录出来的样本**仍然是全零** —— 差最后一层（DSP/ADM 侧或模拟前端）。
- **相机**：主线内核还没有这块 SoC（SM8150）的 CAMSS/CCI 设备树与 IMX586 等 sensor 驱动。
  短期内只能插 USB 摄像头。

另外还有个小瑕疵：每次拉起桌面会有 **1 次** GPU hangcheck（能自恢复，属于内核/Mesa 层面）。

---

## 六、想自己试的话

构建和刷机都在仓库里 → <https://github.com/Winter21c/archlinux-xiaomi-raphael>

两条命令：

```bash
sudo ./build.sh                                 # 打包出刷机镜像
./scripts/11-flash.sh --flash --bt-mac "<你的蓝牙地址>"
```

没有 Linux 环境也行 —— 仓库自带 GitHub Actions 工作流，点一下 `Run workflow`，
7 分钟出镜像（账号密码、蓝牙地址都能在表单/Secret 里填）。

> 如果你也在折腾高通设备 + 主线 Linux，希望这八个坑能帮你少熬几个晚上。
> 最容易忘的一条，我放在最后：
> **改完构建脚本，一定要在干净环境里再跑一遍。**

---

*本文提到的所有修复都在 [archlinux-xiaomi-raphael](https://github.com/Winter21c/archlinux-xiaomi-raphael) 的提交里，*
*每一条提交信息都写了"现象 + 根因 + 验证方法"。*
