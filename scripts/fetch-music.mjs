#!/usr/bin/env node
/**
 * 构建期歌单烘焙器
 * ------------------------------------------------------------------
 * 原项目通过 app/api/music/route.ts 在「运行时」代理网易云 API，
 * 但 GitHub Pages 只能托管静态文件、跑不了服务端路由。
 *
 * 本脚本把这一步提前到「构建期」：在 next build 之前抓取歌单数据，
 * 写入 public/music-data.json，页面运行时只读这个静态文件。
 *
 * 好处：
 *   - 零运行时第三方依赖，外部 API 挂掉也不影响已构建的站点
 *   - 不需要任何密钥
 *   - 歌单更新 = 改 siteConfig.ts 里的 cloudMusicIds 后重新构建
 *
 * 容错：任何网络失败都不会中断构建，只会产出空歌单（播放器自动隐藏）。
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
};

/** 从 siteConfig.ts 里抽取 cloudMusicIds，保持单一数据源 */
function readSongIds() {
  try {
    const src = readFileSync(join(root, 'siteConfig.ts'), 'utf8');
    const m = src.match(/cloudMusicIds\s*:\s*\[([^\]]*)\]/);
    if (!m) {
      console.warn('[music] 未在 siteConfig.ts 中找到 cloudMusicIds');
      return [];
    }
    return [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1].trim()).filter(Boolean);
  } catch (err) {
    console.warn('[music] 读取 siteConfig.ts 失败:', err.message);
    return [];
  }
}

async function fetchJson(url, timeoutMs = 8000) {
  const res = await fetch(url, { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * 校验歌曲是否真的能免费播放。
 *
 * 背景：网易云的 /song/media/outer/url 对 VIP / 已下架歌曲不会返回 404，
 * 而是返回一个 200 + text/html 的「无法播放」提示页（约 107KB）。
 * 如果不过滤，播放器里就会出现点了没反应的坏歌。
 *
 * 这里用 Range 请求只取开头极少量字节，避免为一个 4MB 的 mp3 白下载一遍。
 */
async function checkPlayable(id, { retries = 2 } = {}) {
  const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { ...NET_EASE_HEADERS, Range: 'bytes=0-1' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
      const type = (res.headers.get('content-type') || '').toLowerCase();
      if (!type.startsWith('audio/')) {
        return { ok: false, reason: `非音频响应 (${type || 'unknown'})，通常是 VIP/下架歌曲` };
      }
      // content-range 形如 "bytes 0-1/4588399"，末段才是文件总大小。
      // ⚠️ 不能回退到 content-length：Range 请求下它只有 2 字节，会误判为过小。
      const range = res.headers.get('content-range') || '';
      const total = Number(range.split('/')[1] || 0);
      if (total && total < 100 * 1024) {
        return { ok: false, reason: `文件过小 (${total} 字节)，疑似占位响应` };
      }
      return { ok: true, url, bytes: total || null };
    } catch (err) {
      if (attempt === retries) return { ok: false, reason: `校验请求失败: ${err.message}` };
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return { ok: false, reason: '未知错误' };
}

async function fetchSong(id) {
  try {
    const check = await checkPlayable(id);
    if (!check.ok) {
      console.warn(`[music] ⏭️  跳过 ${id}：${check.reason}`);
      return { id, error: check.reason };
    }

    const url = `https://music.163.com/api/song/detail/?id=${id}&ids=%5B${id}%5D`;
    const detail = await fetchJson(url);
    const song = detail.songs?.[0];
    if (!song) return { id, error: 'not_found' };

    let lrc = '';
    try {
      const lrcData = await fetchJson(
        `https://music.163.com/api/song/lyric?id=${id}&lv=-1&kv=-1&tv=-1`,
      );
      lrc = lrcData.lrc?.lyric || '';
    } catch {
      /* 歌词可选，失败不影响主流程 */
    }

    const artist = song.artists?.[0]?.name || '未知歌手';
    return {
      id,
      name: song.name,
      artist,
      author: artist,
      cover: song.album?.picUrl || '',
      pic: song.album?.picUrl || '',
      // 外链播放地址；<audio> 播放不受 CORS 限制，可直连
      url: check.url,
      lrc,
    };
  } catch (err) {
    console.warn(`[music] 歌曲 ${id} 抓取失败: ${err.message}`);
    return { id, error: String(err.message || err) };
  }
}

/**
 * 读取已入库的歌单作为「基线」。
 *
 * 为什么需要：网易云的外链接口有地域限制。GitHub Actions 跑在美国 IP，
 * 部分歌曲（尤其国内版权曲）会返回 text/html 而拿不到音频；
 * 而在国内网络下构建则一切正常。
 * 若不做回退，CI 构建会把本地烘焙好的可用歌单覆盖成残缺版本。
 */
function readBaseline(outPath) {
  try {
    const data = JSON.parse(readFileSync(outPath, 'utf8'));
    if (!Array.isArray(data)) return new Map();
    const usable = data.filter((s) => s && s.id && s.url && !s.error);
    console.log(`[music] 发现基线歌单，可用 ${usable.length} 首`);
    return new Map(usable.map((s) => [String(s.id), s]));
  } catch {
    return new Map();
  }
}

async function main() {
  const ids = readSongIds();
  const outPath = join(root, 'public', 'music-data.json');
  mkdirSync(dirname(outPath), { recursive: true });

  if (ids.length === 0) {
    writeFileSync(outPath, '[]\n');
    console.log('[music] 未配置歌曲，已写入空歌单');
    return;
  }

  const baseline = readBaseline(outPath);

  console.log(`[music] 开始烘焙 ${ids.length} 首歌...`);
  const fetched = await Promise.all(ids.map(fetchSong));

  // 抓取失败时回退到基线，避免因地域限制丢失本来可用的歌曲
  const results = fetched.map((r) => {
    if (!r.error && r.url) return r;
    const cached = baseline.get(String(r.id));
    if (cached) {
      console.log(`[music] ♻️  ${r.id} 实时抓取失败，沿用基线数据：${cached.name} — ${cached.artist}`);
      return cached;
    }
    return r;
  });

  const ok = results.filter((r) => !r.error && r.url);
  const failed = results.length - ok.length;

  writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n');
  console.log(
    `[music] ${ok.length > 0 ? '✅' : '⚠️ '} 可用 ${ok.length} 首${failed ? `，缺失 ${failed} 首` : ''} → public/music-data.json`,
  );
  for (const s of ok) console.log(`         · ${s.name} — ${s.artist}`);
  for (const s of results.filter((r) => r.error)) {
    console.warn(`         ✗ ${s.id}：${s.error}`);
  }
}

// 关键：构建绝不能因为歌单抓取失败而中断
main().catch((err) => {
  console.warn('[music] 烘焙过程出现异常，保留已有歌单以保证构建继续:', err.message);
  // 注意：这里刻意「不」写入空歌单，否则一次网络抖动就会清空线上可用的歌单
});
