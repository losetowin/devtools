#!/usr/bin/env node
/**
 * build-data.js
 * 合并多份数据源 → assets/data/emoji-data.json
 *  - emoji-test.txt              : Unicode 15.1 官方全量 RGI 列表（分组/子分组/码点/英文短名）
 *  - zh-annotations.xml(+derived): Unicode CLDR 中文注释（中文名 + 中文关键词）
 *  - en-annotations.xml          : Unicode CLDR 英文注释
 *  - gemoji.json                 : GitHub 官方短代码表
 *  - emoji-data.json             : iamcal/emoji-data（短代码兜底）
 *  - zh-territories.json         : CLDR 中文国家/地区名（国旗名）
 * 肤色变体若 CLDR 无注释，按派生规则生成：基础名 + 肤色名。
 * 用法: node build/build-data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(ROOT, '_raw');

const norm = (ch) => ch.replace(/\uFE0F/g, '');
const toChar = (cps) => cps.map((h) => String.fromCodePoint(parseInt(h, 16))).join('');
const toUnicodeLabel = (cps) => cps.map((h) => 'U+' + h.toUpperCase()).join(' ');
const TONES = { '1F3FB': '🏻', '1F3FC': '🏼', '1F3FD': '🏽', '1F3FE': '🏾', '1F3FF': '🏿' };

// ---------- 1. emoji-test.txt ----------
const lines = fs.readFileSync(path.join(RAW, 'emoji-test.txt'), 'utf8').split('\n');
const entries = [];
let group = '', subgroup = '';
for (const line of lines) {
  if (line.startsWith('# group:')) { group = line.slice(8).trim(); continue; }
  if (line.startsWith('# subgroup:')) { subgroup = line.slice(11).trim(); continue; }
  if (!line.trim() || line.startsWith('#')) continue;
  const m = line.match(/^([0-9A-F ]+?)\s*;\s*(\S+)\s*#\s*(\S+)\s+E[\d.]+\s+(.*)$/);
  if (!m) continue;
  const cps = m[1].trim().split(/\s+/);
  entries.push({ cps, char: toChar(cps), status: m[2], group, subgroup, name: m[4].trim() });
}
const full = entries.filter((e) => e.status === 'fully-qualified' && e.group !== 'Component');
console.log('fully-qualified:', full.length);

// ---------- 2. CLDR XML 注释（基础 + 派生合并） ----------
function parseAnnotationsXml(file) {
  const xml = fs.readFileSync(file, 'utf8');
  const map = new Map();
  const reTts = /<annotation cp="([^"]*)" type="tts">([^<]+)<\/annotation>/g;
  const reKeys = /<annotation cp="([^"]*)">([^<]+)<\/annotation>/g;
  let m;
  while ((m = reTts.exec(xml))) {
    const ch = norm(m[1]);
    if (!map.has(ch)) map.set(ch, { tts: '', keys: [] });
    map.get(ch).tts = m[2].trim();
  }
  while ((m = reKeys.exec(xml))) {
    const ch = norm(m[1]);
    if (!map.has(ch)) map.set(ch, { tts: '', keys: [] });
    map.get(ch).keys = m[2].split('|').map((s) => s.trim()).filter(Boolean);
  }
  return map;
}
const zhMap = parseAnnotationsXml(path.join(RAW, 'zh-annotations.xml'));
const zhDerivedMap = parseAnnotationsXml(path.join(RAW, 'zh-annotations-derived.xml'));
const enMap = parseAnnotationsXml(path.join(RAW, 'en-annotations.xml'));
for (const [k, v] of zhDerivedMap) zhMap.set(k, v); // 派生覆盖/补充
console.log('CLDR 中文注释(含派生):', zhMap.size, '| 英文注释:', enMap.size);

// ---------- 3. gemoji 短代码 ----------
const gemojiMap = new Map();
for (const g of JSON.parse(fs.readFileSync(path.join(RAW, 'gemoji.json'), 'utf8'))) {
  if (g.emoji) gemojiMap.set(norm(g.emoji), g);
}
console.log('gemoji:', gemojiMap.size);

// ---------- 4. iamcal 短代码兜底 ----------
const iamcalMap = new Map();
for (const e of JSON.parse(fs.readFileSync(path.join(RAW, 'emoji-data.json'), 'utf8'))) {
  if (e.short_name && e.unified) iamcalMap.set(norm(toChar(e.unified.split('-'))), e.short_name);
}
console.log('iamcal 短代码:', iamcalMap.size);

// ---------- 5. 国旗地区名 ----------
const terr = JSON.parse(fs.readFileSync(path.join(RAW, 'zh-territories.json'), 'utf8')).main.zh.localeDisplayNames.territories;
const TERRITORY_FALLBACK = { 'CQ': '萨克岛' }; // Unicode 16.0 新增（Flag: Sark）
const flagNameZh = (code) => ((terr[code] || TERRITORY_FALLBACK[code] || '') + '国旗');
const SPECIAL_FLAG_ZH = {
  'chequered flag': '方格旗', 'triangular flag': '三角旗', 'crossed flags': '交叉旗',
  'black flag': '黑旗', 'white flag': '白旗', 'rainbow flag': '彩虹旗',
  'transgender flag': '跨性别旗', 'pirate flag': '海盗旗',
  'England': '英格兰旗', 'Scotland': '苏格兰旗', 'Wales': '威尔士旗',
};
const flagNameZhSpecial = (en) => SPECIAL_FLAG_ZH[en] || '';
// 英文旗帜名从 gemoji description 提取（"flag: China" → "China"）
const flagNameEn = (g) => {
  if (g && g.description) {
    const d = g.description.replace(/^flag:\s*/i, '');
    if (d) return d;
  }
  return '';
};
const TONE_NAME_ZH = { '1F3FB': '较浅肤色', '1F3FC': '浅肤色', '1F3FD': '中等肤色', '1F3FE': '中等偏深肤色', '1F3FF': '深肤色' };
const TONE_NAME_EN = { '1F3FB': 'light skin tone', '1F3FC': 'medium-light skin tone', '1F3FD': 'medium skin tone', '1F3FE': 'medium-dark skin tone', '1F3FF': 'dark skin tone' };

// ---------- 6. 工具 ----------
function kebab(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';
}
const toneIdx = ['1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF'];

// ---------- 7. 合并 ----------
const out = [];
let missZh = 0, missEn = 0, missShort = 0, derivedCount = 0;
const baseIndex = new Map(); // norm(char) -> entry ref（供肤色派生）

for (const e of full) {
  const key = norm(e.char);
  const isFlag = e.group === 'Flags';
  const g = gemojiMap.get(key);
  const iamcal = iamcalMap.get(key);
  const short = (g && g.aliases && g.aliases[0]) || iamcal || '';
  let zhName = '', enName = '', kz = [], ke = [];
  if (isFlag) {
    // 区域码旗帜：最后两个码点为区域指示符(1F1E6-1F1FF)
    const cpsInt = e.cps.map((h) => parseInt(h, 16));
    const isRegion = cpsInt.length >= 2 && cpsInt.slice(-2).every((v) => v >= 0x1F1E6 && v <= 0x1F1FF);
    let code = '';
    if (isRegion) code = cpsInt.slice(-2).map((v) => String.fromCharCode(v - 0x1F1E6 + 65)).join('');
    zhName = isRegion ? flagNameZh(code) : flagNameZhSpecial(e.name.replace(/^flag:\s*/i, ''));
    enName = flagNameEn(g) || e.name.replace(/^flag:\s*/i, '');
    kz = ['旗帜', '国旗', code].filter(Boolean);
    ke = [...(enName ? [enName.toLowerCase()] : []), 'flag'];
  } else {
    const zh = zhMap.get(key);
    const en = enMap.get(key);
    zhName = (zh && zh.tts) || '';
    enName = (en && en.tts) || gemojiMap.get(key)?.description || e.name;
    kz = zh ? zh.keys : [];
    ke = en ? en.keys : [];
  }
  const entry = {
    c: e.char, u: toUnicodeLabel(e.cps), s: short,
    zh: zhName, en: enName, kz, ke, g: e.group, sg: e.subgroup,
  };
  baseIndex.set(key, entry);
}
console.log('基础条目:', baseIndex.size);

for (const e of full) {
  const key = norm(e.char);
  const base = baseIndex.get(key);
  if (!base) continue;

  let s = base.s;
  // 肤色变体无官方短代码 → 由基础短代码派生（如 +1_tone3）
  const toneCps = e.cps.filter((h) => TONES[h]);
  if (!s && toneCps.length > 0) {
    const baseEntry = baseIndex.get(norm(toChar(e.cps.filter((h) => !TONES[h]))));
    if (baseEntry && baseEntry.s) s = baseEntry.s + '_tone' + (toneIdx.indexOf(toneCps[0]) + 1);
  }
  if (!s) s = kebab(base.en || e.name);

  if (!base.zh) missZh++;
  if (!base.en) missEn++;
  if (!s) missShort++;
  out.push({ ...base, s, zh: base.zh.replace(/:\s/g, '：') });
}

console.log('合并:', out.length, '| 肤色派生:', derivedCount, '| 缺中文名:', missZh, '| 缺英文名:', missEn, '| 缺短代码:', missShort);

// ---------- 8. 输出 ----------
const dataDir = path.join(ROOT, 'assets', 'data');
fs.mkdirSync(dataDir, { recursive: true });
// JSON（调试/API 用）
const jsonPath = path.join(dataDir, 'emoji-data.json');
fs.writeFileSync(jsonPath, JSON.stringify(out));
// JS 全局变量版（站点 script 加载，file:// 协议下不受 fetch CORS 限制）
const jsPath = path.join(dataDir, 'emoji-data.js');
fs.writeFileSync(jsPath, 'window.EMOJI_DATA = ' + JSON.stringify(out) + ';\n');
console.log('输出:', jsonPath, (fs.statSync(jsonPath).size / 1024).toFixed(0) + 'KB |', jsPath, (fs.statSync(jsPath).size / 1024).toFixed(0) + 'KB');

for (const sn of ['😀', '👍', '👍🏽', '❤️', '👨‍💻', '👨🏽‍💻', '👨‍🦰', '👨🏻‍🦰', '🫱🏻‍🫲🏼', '👩‍❤️‍👨', '🚀', '🇨🇳', '🇺🇸', '#️⃣', '🥸']) {
  const found = out.find((o) => norm(o.c) === norm(sn));
  console.log('样本', sn, '=>', found ? JSON.stringify({ zh: found.zh, en: found.en, s: found.s }) : 'NOT FOUND');
}
