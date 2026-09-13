#!/usr/bin/env node
/**
 * build-site.js — 生成 Emoji 大全静态站点
 * 输入: assets/data/emoji-data.json（由 build-data.js 产出）
 * 输出: index.html / category/*.html / collections/*.html / robots.txt / sitemap.xml
 * 用法: node build/build-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'data', 'emoji-data.json'), 'utf8'));
const BASE_DATA = DATA.filter((e) => !/[🏻🏼🏽🏾🏿]/u.test(e.c)); // u 标志按码点匹配，避免代理对误伤 // 无肤色基础条目
const byShort = new Map(BASE_DATA.map((e) => [e.s, e]));
const byNorm = new Map(DATA.map((e) => [e.c.replace(/\uFE0F/g, ''), e]));

// ---------- 站点配置 ----------
const SITE = {
  name: 'Emoji 大全',
  nameEn: 'EmojiHub',
  tagline: '全量 Emoji 检索与复制工具',
  desc: `Emoji 大全收录 Unicode 16.0 全量 ${DATA.length} 个 Emoji 表情符号，按官方 9 大分类与实用场景分组，支持中英文关键词搜索，点击即可复制 Emoji 字符、短代码与 Unicode 码点。`,
};
// P0 SEO：正式域名（canonical / sitemap / robots 的绝对 URL 前缀，子目录部署方式）
const SITE_ORIGIN = 'https://tools.dutycode.com/emoji-hub';

// ---------- 分类元信息 ----------
const CATS = [
  { id: 'smileys', name: 'Smileys & Emotion', zh: '笑脸与表情', short: '笑脸表情', color: '#FFC93C', desc: '开心、悲伤、生气、搞怪…各种面部表情与心情符号，日常聊天与写作中最常用的一类。' },
  { id: 'people', name: 'People & Body', zh: '人物与身体', short: '人物身体', color: '#FF6B6B', desc: '人物、手势、肤色变体、家庭与职业组合。支持五种肤色变体，搜索“人”“手”“家庭”等即可找到。' },
  { id: 'animals', name: 'Animals & Nature', zh: '动物与自然', short: '动物自然', color: '#6BCB77', desc: '哺乳动物、鸟类、海洋生物、昆虫与植物，还包括天气、地形等自然元素。' },
  { id: 'food', name: 'Food & Drink', zh: '食物与饮品', short: '食物饮品', color: '#FF9F45', desc: '水果、蔬菜、正餐、甜点、酒水饮料，以及餐具与厨房用品。' },
  { id: 'travel', name: 'Travel & Places', zh: '旅行与地点', short: '旅行地点', color: '#4D96FF', desc: '交通工具、建筑地标、城市风光与自然景观，写游记和攻略的必备表情。' },
  { id: 'activities', name: 'Activities', zh: '活动', short: '活动', color: '#9B5DE5', desc: '体育运动、游戏娱乐、艺术音乐等休闲活动相关的表情符号。' },
  { id: 'objects', name: 'Objects', zh: '物品', short: '物品', color: '#00B4D8', desc: '日常用品、办公文具、电子设备、工具与各类物件。' },
  { id: 'symbols', name: 'Symbols', zh: '符号', short: '符号', color: '#F15BB5', desc: '标志、箭头、货币、特殊符号与表情按钮，适合做标注和状态标记。' },
  { id: 'flags', name: 'Flags', zh: '旗帜', short: '旗帜', color: '#00BBF9', desc: '世界各国与地区旗帜，以及彩虹旗、海盗旗等特殊旗帜。' },
];
const CAT_MAP = new Map(CATS.map((c) => [c.name, c]));

// ---------- 精选集合 ----------
// 简单集合：shorts 平铺；复杂集合：groups 分组（每组含 id/zh/shorts），可选 roles 人群视图
const COLLECTIONS = [
  {
    id: 'work', zh: '工作常用', short: '工作', en: 'Work Essentials', color: '#4D96FF',
    desc: '会议、汇报、待办与邮件沟通中的高频表情，让工作消息更清晰、更有温度。',
    roles: [
      { id: 'all', zh: '全部' },
      { id: 'dev', zh: '程序员', cats: 'confirm,reject,data,tool,workplace,status' },
      { id: 'pm', zh: '产品经理', cats: 'confirm,time,doc,data,status' },
      { id: 'design', zh: '设计师', cats: 'confirm,doc,tool,comm,status' },
      { id: 'sales', zh: '销售 BD', cats: 'comm,confirm,time,workplace,status' },
      { id: 'hr', zh: 'HR 行政', cats: 'comm,doc,time,status' },
      { id: 'leader', zh: '管理者', cats: 'data,reject,confirm,workplace,status' },
    ],
    groups: [
      { id: 'confirm', zh: '确认 · 通过', shorts: ['white_check_mark', 'heavy_check_mark', '100', 'tada', '+1', 'clap', 'ok_hand'] },
      { id: 'reject', zh: '拒绝 · 退回', shorts: ['x', 'boom', 'no_entry_sign', '-1', 'heavy_multiplication_x'] },
      { id: 'data', zh: '数据 · 指标', shorts: ['chart_with_upwards_trend', 'chart_with_downwards_trend', 'bar_chart', 'shield', 'eyes'] },
      { id: 'time', zh: '时间 · 日程', shorts: ['calendar', 'date', 'watch', 'timer_clock', 'bell'] },
      { id: 'doc', zh: '文档 · 资料', shorts: ['memo', 'pencil2', 'page_facing_up', 'scroll', 'clipboard', 'file_folder', 'open_file_folder', 'paperclip', 'pushpin', 'bookmark', 'ledger', 'notebook', 'file_cabinet'] },
      { id: 'comm', zh: '沟通 · 回应', shorts: ['speech_balloon', 'thought_balloon', 'mega', 'phone', 'email', 'envelope', 'inbox_tray', 'outbox_tray', 'telephone_receiver', 'loudspeaker', 'pray', 'sweat_smile', 'hugs'] },
      { id: 'tool', zh: '工具 · 设备', shorts: ['keyboard', 'desktop_computer', 'computer', 'printer', 'mag', 'bulb', 'gear', 'wrench', 'hammer_and_wrench', 'hammer', 'nut_and_bolt', 'flashlight', 'battery'] },
      { id: 'workplace', zh: '职场 · 能量', shorts: ['briefcase', 'office', 'lock', 'key', 'link', 'package', 'rocket', 'zap', 'fire', 'handshake', 'moneybag', 'muscle'] },
      { id: 'status', zh: '任务 · 状态', shorts: ['hourglass_flowing_sand', 'construction', 'arrows_clockwise', 'arrows_counterclockwise', 'seedling', 'herb', 'green_circle', 'trophy', '1st_place_medal', 'red_circle', 'stop_sign', 'no_entry', 'sos', 'yellow_circle', 'warning', 'bangbang', 'interrobang', 'question', 'hourglass', 'alarm_clock', 'zzz', 'coffee'] },
    ],
  },
  {
    id: 'schedule', zh: '日程管理', short: '日程', en: 'Schedule & Time', color: '#00B4D8',
    desc: '会议时间、截止日期、提醒与里程碑，用表情管理你的日程节奏。',
    groups: [
      { id: 'alert', zh: '提醒闹钟', shorts: ['alarm_clock', 'watch', 'timer_clock', 'mantelpiece_clock', 'stopwatch', 'bell', 'no_bell', 'hourglass', 'hourglass_flowing_sand'] },
      { id: 'date', zh: '日历日期', shorts: ['calendar', 'date', 'spiral_notepad', 'pushpin', 'round_pushpin', 'checkered_flag', 'bookmark', 'memo', 'chart_with_upwards_trend'] },
      { id: 'clock', zh: '整点时钟', shorts: ['clock1', 'clock2', 'clock3', 'clock4', 'clock5', 'clock6', 'clock7', 'clock8', 'clock9', 'clock10', 'clock11', 'clock12'] },
    ],
  },
  {
    id: 'chat', zh: '聊天回复', short: '聊天', en: 'Chat & Reactions', color: '#FF6B6B',
    desc: '消息互动中最常用的表态表情：同意、点赞、大笑、安慰与鼓励。',
    groups: [
      { id: 'agree', zh: '同意点赞', shorts: ['+1', 'ok_hand', 'clap', 'wave', 'heart', 'heart_eyes', 'muscle', 'handshake', 'fist_raised', 'fist_oncoming', 'v', 'crossed_fingers'] },
      { id: 'happy', zh: '大笑开心', shorts: ['smile', 'grin', 'laughing', 'joy', 'sweat_smile', 'wink', 'innocent', 'blush', 'relieved', 'nerd_face', 'sunglasses', 'stuck_out_tongue'] },
      { id: 'warm', zh: '安慰鼓励', shorts: ['pray', 'raised_hands', 'hugs', 'kissing_heart', 'love_you_gesture', 'call_me_hand', 'point_up', 'fire'] },
      { id: 'awk', zh: '尴尬无奈', shorts: ['sob', 'cry', 'angry', 'rage', 'triumph', 'disappointed', 'confused', 'expressionless', 'neutral_face', 'smirk', 'thinking', 'shrug', 'see_no_evil', 'sleepy', 'tired_face', 'weary', 'sleeping', 'zzz', 'mask', 'scream', 'astonished', 'flushed', '-1', 'speech_balloon'] },
    ],
  },
  {
    id: 'festival', zh: '节日祝福', short: '节日', en: 'Festivals & Wishes', color: '#FFC93C',
    desc: '春节、生日、婚礼与各种庆祝场合的祝福表情，气氛担当。',
    groups: [
      { id: 'spring', zh: '春节', shorts: ['firecracker', 'red_envelope', 'sparkler', 'fireworks'] },
      { id: 'xmas', zh: '圣诞', shorts: ['christmas_tree', 'santa', 'snowman', 'snowflake', 'gift', 'sparkles'] },
      { id: 'birthday', zh: '生日庆祝', shorts: ['birthday', 'cake', 'balloon', 'champagne', 'clinking_glasses', 'wine_glass', 'cocktail', 'tropical_drink', 'beers', 'tada', 'confetti_ball'] },
      { id: 'love', zh: '爱情浪漫', shorts: ['two_hearts', 'love_letter', 'bouquet', 'rose', 'ribbon', 'cupid', 'heartbeat', 'sparkling_heart', 'gift_heart', 'envelope_with_arrow'] },
      { id: 'fun', zh: '趣味派对', shorts: ['jack_o_lantern', 'ghost', 'star', 'dizzy', 'boom', 'woman_dancing', 'man_dancing'] },
    ],
  },
  {
    id: 'status', zh: '项目状态', short: '状态', en: 'Project Status', color: '#6BCB77',
    desc: '用表情标记任务进展、风险与状态：进行中、已完成、阻塞、延期一目了然。',
    groups: [
      { id: 'doing', zh: '进行中', shorts: ['hourglass_flowing_sand', 'construction', 'hammer_and_wrench', 'seedling', 'herb', 'arrows_clockwise', 'arrows_counterclockwise', 'repeat', 'repeat_one', 'eyes', 'mag', 'pushpin', 'zzz', 'coffee', 'tea'] },
      { id: 'done', zh: '已完成', shorts: ['green_circle', 'white_check_mark', '100', 'trophy', '1st_place_medal'] },
      { id: 'blocked', zh: '阻塞延期', shorts: ['red_circle', 'x', 'stop_sign', 'no_entry', 'sos', 'warning'] },
      { id: 'risk', zh: '风险待办', shorts: ['yellow_circle', 'bangbang', 'interrobang', 'question', 'exclamation', 'grey_question', 'grey_exclamation', 'heavy_multiplication_x', 'heavy_plus_sign', 'heavy_minus_sign', 'heavy_division_sign', 'lock', 'unlock', 'key', 'shield', 'crossed_swords'] },
      { id: 'milestone', zh: '里程碑庆祝', shorts: ['rocket', 'fire', 'zap', 'loudspeaker', 'bell', 'pizza', 'hamburger', 'fries', 'doughnut', 'icecream', 'bar_chart', 'chart_with_upwards_trend', 'chart_with_downwards_trend', 'bug', 'test_tube', 'microscope'] },
    ],
  },
  {
    id: 'meeting', zh: '会议常用', short: '会议', en: 'Meetings & Minutes', color: '#FF9F45',
    desc: '会议通知、议题、结论与待办——会前会后用表情把节奏理清楚。',
    groups: [
      { id: 'prep', zh: '会前准备', shorts: ['calendar', 'date', 'alarm_clock', 'timer_clock', 'bell', 'memo', 'clipboard', 'pushpin', 'round_pushpin'] },
      { id: 'talk', zh: '会中表达', shorts: ['speech_balloon', 'thought_balloon', 'hand', 'wave', 'eyes', 'question', 'exclamation'] },
      { id: 'vote', zh: '讨论表态', shorts: ['white_check_mark', 'heavy_check_mark', 'x', '100', 'tada'] },
      { id: 'follow', zh: '会后跟进', shorts: ['chart_with_upwards_trend', 'chart_with_downwards_trend', 'bar_chart', 'hourglass_flowing_sand', 'stop_sign', 'warning', 'pencil2'] },
    ],
  },
  {
    id: 'mail', zh: '邮件常用', short: '邮件', en: 'Email & Letters', color: '#7C3AED',
    desc: '起草、发送、跟进与归档——邮件沟通全流程的高频表情。',
    groups: [
      { id: 'draft', zh: '起草', shorts: ['memo', 'pencil2', 'page_facing_up', 'page_with_curl', 'paperclip', 'file_folder', 'open_file_folder', 'pushpin', 'bookmark'] },
      { id: 'send', zh: '发送', shorts: ['email', 'envelope', 'envelope_with_arrow', 'outbox_tray'] },
      { id: 'follow', zh: '跟进', shorts: ['inbox_tray', 'bell', 'loudspeaker', 'alarm_clock', 'calendar', 'date', 'speech_balloon', 'link'] },
      { id: 'reply', zh: '回应', shorts: ['white_check_mark', 'heavy_check_mark', 'x', 'warning', 'question', 'exclamation', '100'] },
      { id: 'secure', zh: '安全归档', shorts: ['lock', 'key'] },
    ],
  },
  {
    id: 'code_review', zh: '代码评审', short: '评审', en: 'Code Review', color: '#2E9E5B',
    desc: '提交、检查、问题与合入——研发同学评审代码时的高频表情。',
    groups: [
      { id: 'build', zh: '提交构建', shorts: ['computer', 'keyboard', 'mag', 'rocket', 'zap', 'fire', 'gear'] },
      { id: 'check', zh: '检查问题', shorts: ['bug', 'test_tube', 'microscope', 'warning', 'boom', 'x', 'red_circle', 'yellow_circle'] },
      { id: 'discuss', zh: '评论讨论', shorts: ['speech_balloon', 'eyes', 'bulb', 'link'] },
      { id: 'merge', zh: '合入通过', shorts: ['white_check_mark', 'heavy_check_mark', 'green_circle', 'tada', '100'] },
      { id: 'guard', zh: '保护排期', shorts: ['shield', 'lock', 'key', 'hourglass_flowing_sand', 'alarm_clock', 'calendar', 'pushpin', 'bookmark', 'wrench', 'hammer_and_wrench'] },
    ],
  },
];

// 集合短码扁平化（兼容 groups / shorts 两种结构）
const colShorts = (c) => (c.groups ? c.groups.reduce((a, g) => a.concat(g.shorts), []) : (c.shorts || []));
// 集合条目（过滤缺失短代码）
const colItems = (c) => colShorts(c).map((s) => byShort.get(s)).filter(Boolean);

// ---------- 工具 ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const catLink = (id) => `category/${id}.html`;
const colLink = (id) => `collections/${id}.html`;

// Emoji → 详情页文件名（码点 hex 序列，如 1f600 / 1f469-200d-1f467）
function emojiHex(c) {
  return Array.from(c).map((ch) => ch.codePointAt(0).toString(16)).join('-');
}
// SEO 友好的语义化 slug：英文短名 + 码点后缀保证唯一（如 grinning-face-1f600）
function emojiSlug(e) {
  const base = (e.en || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'emoji';
  return `${base}-${emojiHex(e.c)}`;
}
function emojiDetailLink(e, base) {
  return `${base || ''}emoji/${emojiSlug(e)}.html`;
}

function emojiCard(e, base) {
  const b = base || '';
  const link = emojiDetailLink(e, b);
  return `<div class="ecard" aria-label="${esc(e.zh)}（${esc(e.en)}）">
<span class="fav-btn" role="button" tabindex="0" data-fav="${esc(e.c)}" aria-label="收藏 ${esc(e.zh)}">☆</span>
<span class="ec-char" role="button" tabindex="0" data-copy="${esc(e.c)}" title="点击复制 ${e.c}" aria-label="复制 ${esc(e.zh)}（${esc(e.en)}）">${e.c}</span>
<span class="ec-zh">${esc(e.zh)}</span>
<span class="ec-en">${esc(e.en)}</span>
<span class="ec-meta">
<span class="ec-code" data-copy=":${esc(e.s)}:" title="复制短代码 :${esc(e.s)}:"><span class="ec-k">短码</span>:${esc(e.s)}:</span>
<span class="ec-code" data-copy="${esc(e.u)}" title="复制 Unicode 码点 ${esc(e.u)}"><span class="ec-k">Unicode</span>${esc(e.u)}</span>
</span>
<a class="ec-detail" href="${link}" aria-label="查看 ${esc(e.zh)} 详情">详情 ↗</a>
</div>`;
}

// 分类图标（内联 SVG，24×24）
const CAT_ICONS = {
  smileys: '<circle cx="12" cy="12" r="10"/><circle cx="8.4" cy="9.2" r="1.3"/><circle cx="15.6" cy="9.2" r="1.3"/><path d="M8.2 13.8c1.1 1.7 2.4 2.6 3.8 2.6s2.7-.9 3.8-2.6"/>',
  people: '<circle cx="12" cy="7.2" r="4.2"/><path d="M4.2 20.6c0-4.3 3.5-7.4 7.8-7.4s7.8 3.1 7.8 7.4"/>',
  animals: '<ellipse cx="12" cy="15.5" rx="3.4" ry="4.2"/><circle cx="5.6" cy="9.6" r="1.9"/><circle cx="10" cy="6" r="2"/><circle cx="15.6" cy="6.2" r="1.9"/><circle cx="19.6" cy="10" r="1.8"/>',
  food: '<path d="M12 6.2c-2.6-1.2-5.6-.2-6.4 3C6.4 13.4 8.4 17 12 17s5.6-3.6 6.4-7.8c-.8-3.2-3.8-4.2-6.4-3z"/><path d="M12 6.2V3.5"/><path d="M12 3.5C11 2.8 9.6 2.6 8.6 3"/><path d="M12 3.5c1-.7 2.4-.9 3.4-.5"/>',
  travel: '<circle cx="12" cy="12" r="10"/><path d="M3.4 15.2c3-2 6.2-.8 8.6.8 2.4 1.5 4.9 1.9 8.4-.4"/><path d="M7.5 11.5l2.5-4 3.5 3.5 4-2.5 2.5 3.5"/><path d="M10 7.5c0-.8-.7-1.5-1.5-1.5S7 6.7 7 7.5 7.7 9 8.5 9 10 8.3 10 7.5z"/>',
  activities: '<path d="M5 20.5V6.5a3 3 0 0 1 3-3H19v11H9a3 3 0 0 0-3 3"/><path d="M8.2 12.2h12"/>',
  objects: '<path d="M12 2.5a6.8 6.8 0 0 0-4.2 12.2c.9.7 1.5 1.6 1.7 2.8h5c.2-1.2.8-2.1 1.7-2.8A6.8 6.8 0 0 0 12 2.5z"/><path d="M9.2 21.5h5.6"/><path d="M10.4 18.5h3.2"/>',
  symbols: '<path d="M10.5 3l-2 18"/><path d="M15.5 3l-2 18"/><path d="M4.5 9h17"/><path d="M2.5 15h17"/>',
  flags: '<path d="M5.5 21.5V3.2"/><path d="M5.5 4c4.5-3.2 8.5 2.6 13 0v9.5c-4.5 2.6-8.5-3.2-13 0"/>',
};

// ---------- 公共模板 ----------
function head(title, desc, canonical, jsonLd, base) {
  const b = base || '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="emoji,表情符号,emoji大全,emoji复制,${esc(title.split('｜')[0])}">
<link rel="canonical" href="${esc(canonical === 'index.html' ? SITE_ORIGIN + '/' : SITE_ORIGIN + '/' + canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="icon" type="image/svg+xml" href="${b}assets/favicon.svg">
<link rel="stylesheet" href="${b}assets/css/style.css">
${jsonLd ? (Array.isArray(jsonLd) ? jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n') : `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`) : ''}
</head>
<body data-theme="candy">`;
}

function navLinks(b, activeCat, activeCol) {
  const b2 = b || '';
  const catLinks = CATS.map((c) => {
    const cls = c.id === activeCat ? ' class="active"' : '';
    return `<a href="${b2}${catLink(c.id)}"${cls}><span class="nav-dot" style="background:${c.color}"></span>${c.short}</a>`;
  }).join('');
  const colLinks = COLLECTIONS.map((c) => {
    const cls = c.id === activeCol ? ' class="active"' : '';
    return `<a href="${b2}${colLink(c.id)}"${cls} title="${esc(c.zh)}"><span class="nav-dot" style="background:${c.color}"></span>${c.short || c.zh}</a>`;
  }).join('');
  return `<nav class="site-nav" aria-label="主导航">
<div class="nav-group" aria-label="官方分类"><div class="nav-links">${catLinks}</div></div>
<span class="nav-divider" aria-hidden="true"></span>
<div class="nav-group" aria-label="精选集合"><div class="nav-links">${colLinks}</div></div>
</nav>`;
}

function header(b, activeCat, activeCol) {
  const b2 = b || '';
  return `<a class="skip-link" href="#main">跳到主要内容</a>
<header class="site-header">
<div class="header-inner">
<a class="logo" href="${b2}index.html" aria-label="${esc(SITE.name)} 首页">
<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--accent)"/><circle cx="11" cy="13" r="3" fill="#fff"/><circle cx="21" cy="13" r="3" fill="#fff"/><path d="M8.5 20.5c2 4 13 4 15 0" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>
<span class="logo-text">${esc(SITE.name)}<em>${SITE.nameEn}</em></span>
</a>
<div class="header-tools">
<form class="search" role="search" data-search-form>
<svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>
<input id="search-input" type="search" placeholder="搜索 emoji：中文 / English / 短代码 / 码点" autocomplete="off" aria-label="搜索 emoji">
<div class="suggest-box" id="header-suggest" hidden></div>
</form>
<div class="theme-switch" role="group" aria-label="切换主题">
<button type="button" class="theme-btn" data-theme="candy" title="糖果派对" aria-label="糖果派对主题"><span style="background:#FF5D8F"></span><span style="background:#FFC93C"></span><span style="background:#4ECDC4"></span></button>
<button type="button" class="theme-btn" data-theme="mint" title="薄荷清新" aria-label="薄荷清新主题"><span style="background:#2EC4B6"></span><span style="background:#80ED99"></span><span style="background:#FFD166"></span></button>
<button type="button" class="theme-btn" data-theme="sunset" title="落日暖橙" aria-label="落日暖橙主题"><span style="background:#FF6B35"></span><span style="background:#FF9F1C"></span><span style="background:#E63946"></span></button>
<button type="button" class="theme-btn" data-theme="night" title="静谧午夜" aria-label="静谧午夜主题"><span style="background:#8B5CF6"></span><span style="background:#06B6D4"></span><span style="background:#F472B6"></span></button>
</div>
<button type="button" class="nav-toggle" aria-label="展开导航" aria-expanded="false"><span></span><span></span><span></span></button>
</div>
</div>
${navLinks(b2, activeCat, activeCol)}
</header>`;
}

function footer(b) {
  const b2 = b || '';
  return `<footer class="site-footer">
<div class="footer-inner">
<div class="footer-about">
<p class="footer-title">${esc(SITE.name)} <em>${SITE.nameEn}</em></p>
<p>收录 Unicode 16.0 全量 <strong>${DATA.length}</strong> 个 Emoji 表情符号，覆盖 9 大官方分类与 <strong>${COLLECTIONS.length}</strong> 个实用场景集合。点击卡片复制 Emoji 字符，点击短代码或码点可单独复制。</p>
</div>
<div class="footer-links">
<div><p class="footer-title">官方分类</p>
${CATS.map((c) => `<a href="${b2}${catLink(c.id)}">${c.zh}</a>`).join('')}
</div>
<div><p class="footer-title">精选集合</p>
${COLLECTIONS.map((c) => `<a href="${b2}${colLink(c.id)}">${c.zh}</a>`).join('')}
</div>
<div><p class="footer-title">更多工具</p>
<a href="${b2}blog/heart-colors.html">爱心颜色含义</a><a href="${b2}blog/work-emoji.html">工作场景 emoji</a><a href="${b2}blog/festival-templates.html">节日祝福文案</a><a href="${b2}blog/emoji-shortcodes.html">emoji 短代码大全</a><a href="${b2}blog/unicode-codepoint-guide.html">Unicode 码点查询</a><a href="https://tools.dutycode.com/json-tool/">JSON 格式化工具</a><a href="https://tools.dutycode.com/password-gen/">在线随机密码生成器</a><a href="https://tools.dutycode.com/">DevTools 工具索引</a>
</div>
</div>
</div>
<p class="footer-note">数据来源：Unicode 16.0 Emoji List · Unicode CLDR 中英文注释 · GitHub Gemoji 短代码。本工具开源供学习使用。</p>
</footer>
<button type="button" class="back-top" id="back-top" aria-label="回到顶部" title="回到顶部">↑</button>
<script src="${b2}assets/data/emoji-data.js"></script>
<script src="${b2}assets/js/main.js"></script>
</body>
</html>`;
}

// ---------- 搜索区（header 下，仅 index 使用大搜索） ----------
function heroSearch() {
  return `<div class="hero-search">
<svg class="search-icon lg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg>
<input id="hero-search-input" type="search" placeholder="输入中文、英文、短代码（:smile:）或码点（U+1F600）" autocomplete="off" aria-label="搜索全部 emoji">
<div class="suggest-box" id="hero-suggest" hidden></div>
</div>
<div class="hero-hot" role="group" aria-label="热门搜索">
<span class="hot-label">大家都在搜：</span>
<button type="button" class="hot-chip" data-q="笑">笑</button>
<button type="button" class="hot-chip" data-q="heart">heart</button>
<button type="button" class="hot-chip" data-q="👍">👍</button>
<button type="button" class="hot-chip" data-q="工作">工作</button>
<button type="button" class="hot-chip" data-q="U+1F680">U+1F680</button>
<button type="button" class="hot-chip" data-q="flag">flag</button>
</div>`;
}

// ---------- 页面生成 ----------
function buildIndex() {
  const webSiteLd = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name,
    description: SITE.desc, inLanguage: 'zh-CN',
  };
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'EmojiHub 收录了多少个 Emoji？', acceptedAnswer: { '@type': 'Answer', text: `Emoji 大全收录 Unicode 16.0 全量 ${DATA.length} 个 Emoji，按官方 9 大分类与 ${COLLECTIONS.length} 个实用场景集合展示，支持中英文关键词搜索。` } },
      { '@type': 'Question', name: '怎么复制 Emoji 到聊天或文档里？', acceptedAnswer: { '@type': 'Answer', text: '点击卡片即可复制 Emoji 字符；点击短代码（如 :smile:）复制 Slack、GitHub 等平台的代码；点击 Unicode 码点可复制给程序员与设计师使用。' } },
      { '@type': 'Question', name: '同一个 Emoji 在不同平台显示一样吗？', acceptedAnswer: { '@type': 'Answer', text: '不同平台（iOS、Android、Windows、微信等）的字体渲染存在差异，组合型 emoji（家庭、职业、肤色变体）依赖平台支持，个别符号可能显示不同。' } },
      { '@type': 'Question', name: '支持哪些搜索方式？', acceptedAnswer: { '@type': 'Answer', text: '支持中英文关键词、短代码与 Unicode 码点搜索，顶部搜索框全站可用。' } },
      { '@type': 'Question', name: 'Emoji 数据来源是什么？', acceptedAnswer: { '@type': 'Answer', text: '数据来自 Unicode 16.0 Emoji List、Unicode CLDR 中英文注释与 GitHub Gemoji 短代码。' } },
    ],
  };
  const jsonLd = [webSiteLd, faqLd];
  const catCards = CATS.map((c) => {
    const n = DATA.filter((e) => e.g === c.name).length;
    return `<a class="cat-card" href="${catLink(c.id)}" style="--cat:${c.color}">
<span class="cat-icon">${CAT_ICONS[c.id]}</span>
<span class="cat-name">${c.zh}</span>
<span class="cat-en">${c.name}</span>
<span class="cat-count">${n} 个</span>
</a>`;
  }).join('');
  const colCards = COLLECTIONS.map((c) => {
    const items = colItems(c);
    const preview = items.slice(0, 6).map((e) => `<span class="col-preview-char">${e.c}</span>`).join('');
    return `<a class="col-card" href="${colLink(c.id)}" style="--cat:${c.color}">
<span class="col-name">${c.zh}</span>
<span class="col-en">${c.en}</span>
<span class="col-preview">${preview}</span>
<span class="col-count">${items.length} 个精选</span>
</a>`;
  }).join('');
  // 快捷组合：一键复制一组表情（P1 批量复制）
  const COMBO = [
    ['发布祝贺', '🎉🚀🎊'], ['收到确认', '✅👌👍'], ['加油鼓劲', '💪🔥🏃'],
    ['开工大吉', '🚧🔨📦'], ['下班走人', '🏠🍺😌'], ['周末愉快', '🎉☀️🍻'],
    ['生日快乐', '🎂🎈🎁'], ['新年快乐', '🎆🧧🎇'], ['感谢支持', '🙏❤️🤝'],
    ['会议开始', '📣📅📝'], ['项目上线', '🚀✅🎉'], ['干饭时间', '🍚🍜☕'],
  ];
  const comboHtml = COMBO.map(([name, chars]) =>
    `<button type="button" class="combo-chip" data-combo="${chars}" title="一键复制 ${chars}">${esc(name)}<span class="combo-chars" aria-hidden="true">${chars}</span></button>`
  ).join('');
  const html = `${head(`${SITE.name}｜${SITE.nameEn}｜全量 Emoji 复制与搜索`, SITE.desc, 'index.html', jsonLd)}
${header('')}
<main class="home-main" id="main">
<section class="hero">
<h1>把想要的那个 <em>Emoji</em>，一秒复制走</h1>
<p class="hero-sub">${SITE.tagline}——${DATA.length} 个表情符号，按官方分类与实用场景整理，中英文皆可搜。</p>
${heroSearch()}
<div class="hero-stats">
<span><strong>${DATA.length}</strong> 全量 Emoji</span>
<span><strong>${CATS.length}</strong> 官方分类</span>
<span><strong>${COLLECTIONS.length}</strong> 实用集合</span>
<span><strong>Unicode 16.0</strong> 标准数据</span>
</div>
</section>
<section class="home-section" id="search-results" hidden>
<h2 class="section-title">搜索结果 <span class="result-count" id="result-count"></span></h2>
<div class="emoji-grid" id="result-grid"></div>
</section>
<section class="home-section" id="recent-section" hidden>
<h2 class="section-title">最近使用 <span class="sec-hint">点击复制过的 emoji 自动记录</span></h2>
<div class="emoji-grid" id="recent-grid"></div>
</section>
<section class="home-section" id="fav-section" hidden>
<h2 class="section-title">我的收藏 <span class="sec-hint">点击卡片右上角 ☆ 即可收藏</span></h2>
<div class="emoji-grid" id="fav-grid"></div>
</section>
<section class="home-section">
<h2 class="section-title">按官方分类浏览</h2>
<p class="section-sub">Unicode 标准 9 大分类，覆盖全部表情符号。</p>
<div class="cat-grid">${catCards}</div>
</section>
<section class="home-section">
<h2 class="section-title">实用场景集合</h2>
<p class="section-sub">按真实使用场景精选，拿来即用。</p>
<div class="col-grid">${colCards}</div>
</section>
<section class="home-section">
<h2 class="section-title">快捷组合 <span class="sec-hint">一键复制一组表情</span></h2>
<p class="section-sub">发布、确认、开工、下班……常用场合的表情串，点一下整组复制。</p>
<div class="combo-grid">${comboHtml}</div>
</section>
<section class="home-section home-howto">
<h2 class="section-title">怎么用？</h2>
<div class="howto-grid">
<div class="howto-item"><span class="howto-num">1</span><p><strong>点击 Emoji</strong> 直接复制字符到剪贴板，粘贴到聊天、文档、代码里都能用。</p></div>
<div class="howto-item"><span class="howto-num">2</span><p><strong>点击短代码</strong>（如 <code>:smile:</code>）复制 Slack、Discord、GitHub 等平台的表情代码。</p></div>
<div class="howto-item"><span class="howto-num">3</span><p><strong>点击 Unicode 码点</strong>（如 <code>U+1F600</code>）复制给程序员与设计师使用。</p></div>
<div class="howto-item"><span class="howto-num">4</span><p><strong>顶部搜索框</strong>支持中英文、关键词、短代码与码点，全站可用。</p></div>
</div>
</section>
<section class="home-section home-faq">
<h2 class="section-title">常见问题（FAQ）</h2>
<div class="faq-list">
<details class="faq-item"><summary>EmojiHub 收录了多少个 Emoji？</summary><p>收录 Unicode 16.0 全量 ${DATA.length} 个 Emoji，按官方 9 大分类与 ${COLLECTIONS.length} 个实用场景集合展示，支持中英文关键词搜索。</p></details>
<details class="faq-item"><summary>怎么复制 Emoji 到聊天或文档里？</summary><p>点击卡片即可复制 Emoji 字符；点击短代码（如 <code>:smile:</code>）复制 Slack、GitHub 等平台的代码；点击 Unicode 码点可复制给程序员与设计师使用。</p></details>
<details class="faq-item"><summary>同一个 Emoji 在不同平台显示一样吗？</summary><p>不同平台（iOS、Android、Windows、微信等）的字体渲染存在差异，组合型 emoji（家庭、职业、肤色变体）依赖平台支持，个别符号可能显示不同。</p></details>
<details class="faq-item"><summary>支持哪些搜索方式？</summary><p>支持中英文关键词、短代码与 Unicode 码点搜索，顶部搜索框全站可用。</p></details>
<details class="faq-item"><summary>Emoji 数据来源是什么？</summary><p>数据来自 Unicode 16.0 Emoji List、Unicode CLDR 中英文注释与 GitHub Gemoji 短代码。</p></details>
</div>
</section>
</main>
${footer('')}`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  console.log('✓ index.html');
}

function buildCategoryPages() {
  for (const c of CATS) {
    const list = DATA.filter((e) => e.g === c.name);
    // 子分组（仅展示基础条目避免重复）
    const subgroups = [];
    const sgMap = new Map();
    for (const e of list) {
      if (!sgMap.has(e.sg)) sgMap.set(e.sg, []);
      sgMap.get(e.sg).push(e);
    }
    for (const [sg, items] of sgMap) subgroups.push({ id: sg, name: sg, items });
    const title = `${c.zh}（${c.name}）Emoji 大全｜${DATA.length} 个表情｜${SITE.name}`;
    const desc = `${c.zh}（${c.name}）分类共 ${list.length} 个 Emoji：${c.desc}支持中英文搜索，点击一键复制 Emoji 字符、短代码与 Unicode 码点。`;
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: `${c.zh} Emoji 大全`, description: desc, inLanguage: 'zh-CN',
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: '../index.html' },
        { '@type': 'ListItem', position: 2, name: c.zh },
      ] },
    };
    const sgNav = subgroups.map((sg, i) => `<a href="#sg-${i}">${esc(sg.name)}</a>`).join('');
    const sections = subgroups.map((sg, i) => `
<section class="subgroup" id="sg-${i}">
<h3 class="subgroup-title">${esc(sg.name)} <span>${sg.items.length}</span></h3>
<div class="emoji-grid">${sg.items.map((e) => emojiCard(e, '../')).join('')}</div>
</section>`).join('');
    const html = `${head(title, desc, `category/${c.id}.html`, jsonLd, '../')}
${header('../', c.id)}
<main class="page-main" id="main">
<nav class="breadcrumb" aria-label="面包屑"><a href="../index.html">首页</a><span>/</span><span>${c.zh}</span></nav>
<header class="page-hero" style="--cat:${c.color}">
<h1>${c.zh} <em>${c.name}</em></h1>
<p>${esc(c.desc)}</p>
<div class="page-stats"><span><strong>${list.length}</strong> 个 Emoji</span><span><strong>${subgroups.length}</strong> 个子分类</span></div>
<nav class="sg-nav" aria-label="子分类">${sgNav}</nav>
</header>
${sections}
</main>
${footer('../')}`;
    fs.writeFileSync(path.join(ROOT, 'category', `${c.id}.html`), html);
    console.log(`✓ category/${c.id}.html (${list.length} emoji, ${subgroups.length} subgroups)`);
  }
}

function buildCollectionPages() {
  for (const c of COLLECTIONS) {
    const items = colItems(c);
    const missing = colShorts(c).filter((s) => !byShort.has(s));
    if (missing.length) console.warn(`  ⚠ ${c.id} 缺失短代码: ${missing.join(', ')}`);
    const title = `${c.zh} Emoji 合集｜${items.length} 个精选表情｜${SITE.name}`;
    const desc = `${c.zh} Emoji 精选合集（${c.en}）：${c.desc}共 ${items.length} 个高频表情，点击一键复制字符、短代码与 Unicode 码点。`;
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: `${c.zh} Emoji 合集`, description: desc, inLanguage: 'zh-CN',
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: '../index.html' },
        { '@type': 'ListItem', position: 2, name: c.zh },
      ] },
    };
    // 分组结构（复杂集合）与角色视图
    let body, sgNav = '', roleTabs = '';
    if (c.groups) {
      sgNav = c.groups.map((g) => `<a href="#cat-${g.id}">${esc(g.zh)}</a>`).join('');
      body = c.groups.map((g) => {
        const gItems = g.shorts.map((s) => byShort.get(s)).filter(Boolean);
        return `<section class="subgroup" id="cat-${g.id}" data-cat="${esc(g.id)}">
<h3 class="subgroup-title">${esc(g.zh)} <span>${gItems.length}</span><button type="button" class="copy-group" data-shorts="${esc(g.shorts.join(','))}">复制整组</button></h3>
<div class="emoji-grid">${gItems.map((e) => emojiCard(e, '../')).join('')}</div>
</section>`;
      }).join('');
      if (c.roles) {
        roleTabs = `<div class="role-tabs" role="group" aria-label="按人群查看工作常用">
${c.roles.map((r) => `<button type="button" class="role-tab${r.id === 'all' ? ' active' : ''}" data-role="${esc(r.id)}"${r.cats ? ` data-cats="${esc(r.cats)}"` : ''} aria-pressed="${r.id === 'all' ? 'true' : 'false'}">${esc(r.zh)}</button>`).join('')}
</div>
<p class="role-hint">按角色只看他/她最常用的分类；选择「全部」查看完整合集。</p>`;
      }
    } else {
      body = `<div class="emoji-grid">${items.map((e) => emojiCard(e, '../')).join('')}</div>`;
    }
    const html = `${head(title, desc, `collections/${c.id}.html`, jsonLd, '../')}
${header('../', '', c.id)}
<main class="page-main" id="main">
<nav class="breadcrumb" aria-label="面包屑"><a href="../index.html">首页</a><span>/</span><span>精选集合</span><span>/</span><span>${c.zh}</span></nav>
<header class="page-hero" style="--cat:${c.color}">
<h1>${c.zh} <em>${c.en}</em></h1>
<p>${esc(c.desc)}</p>
<div class="page-stats"><span><strong>${items.length}</strong> 个精选 Emoji</span>${c.groups ? `<span><strong>${c.groups.length}</strong> 个分类</span>` : ''}</div>
${sgNav ? `<nav class="sg-nav" aria-label="分类">${sgNav}</nav>` : ''}
</header>
${roleTabs}
${body}
</main>
${footer('../')}`;
    fs.writeFileSync(path.join(ROOT, 'collections', `${c.id}.html`), html);
    console.log(`✓ collections/${c.id}.html (${items.length} emoji${c.groups ? `, ${c.groups.length} groups` : ''})`);
  }
}

function buildSeo() {
  const pages = ['index.html', ...CATS.map((c) => catLink(c.id)), ...COLLECTIONS.map((c) => colLink(c.id)),
    'blog/heart-colors.html', 'blog/work-emoji.html', 'blog/festival-templates.html',
    'blog/emoji-shortcodes.html', 'blog/unicode-codepoint-guide.html',
    ...DATA.map((e) => 'emoji/' + emojiSlug(e) + '.html')];
  const lastmod = (p) => {
    try { return fs.statSync(path.join(ROOT, p)).mtime.toISOString().slice(0, 10); }
    catch { return new Date().toISOString().slice(0, 10); }
  };
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 域名: ${SITE_ORIGIN} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_ORIGIN}/${p}</loc><lastmod>${lastmod(p)}</lastmod><changefreq>monthly</changefreq></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`);
  console.log('✓ sitemap.xml / robots.txt');
}

// 旧码点路径 → 新 slug 路径的跳转页（兼容已收录/已分享的链接）
function redirectPage(title, target) {
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}｜Emoji 大全</title>
<link rel="canonical" href="${esc(target)}">
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>location.replace('${esc(target)}');</script>
</head><body style="font-family:system-ui;padding:40px;text-align:center">页面已迁移至 <a href="${esc(target)}">${esc(target)}</a></body></html>`;
}

// ---------- Emoji 详情页（P1：SEO 长尾 + 语义承载；P2：开发者格式 + 含义生态） ----------
function buildDetailPages() {
  fs.mkdirSync(path.join(ROOT, 'emoji'), { recursive: true });
  // 含义说明内容生态（P2-2）：字符键 → 注释，归一化 FE0F 后与数据对齐
  const NOTES_RAW = require('./emoji-notes.js');
  const NOTES = {};
  const normC = (c) => c.replace(/\uFE0F/g, '');
  for (const [ch, v] of Object.entries(NOTES_RAW)) {
    const hit = DATA.find((x) => normC(x.c) === normC(ch));
    if (hit) NOTES[hit.c] = v;
  }
  // 码点组件名（P2-1：码点分解表）
  const SPECIAL_CP = {
    '200d': ['零宽连接符', 'ZERO WIDTH JOINER'],
    'fe0f': ['变体选择符-16（强制表情样式）', 'VARIATION SELECTOR-16'],
    '1f3fb': ['浅肤色', 'LIGHT SKIN TONE'],
    '1f3fc': ['中浅肤色', 'MEDIUM-LIGHT SKIN TONE'],
    '1f3fd': ['中肤色', 'MEDIUM SKIN TONE'],
    '1f3fe': ['中深肤色', 'MEDIUM-DARK SKIN TONE'],
    '1f3ff': ['深肤色', 'DARK SKIN TONE'],
  };
  function cpInfo(cp) {
    const hex = cp.toString(16);
    const sp = SPECIAL_CP[hex];
    if (sp) return { hex: hex.toUpperCase(), dec: cp, zh: sp[0], en: sp[1] };
    const hit = DATA.find((x) => emojiHex(x.c) === hex);
    return { hex: hex.toUpperCase(), dec: cp, zh: hit ? hit.zh : '', en: hit ? hit.en : '' };
  }
  const byCat = new Map();
  for (const e of DATA) {
    if (!byCat.has(e.g)) byCat.set(e.g, []);
    byCat.get(e.g).push(e);
  }
  // emoji 字符 → 包含它的集合（避免把重复的肤色变体算进去，按 c 精确匹配）
  const colIndex = new Map();
  for (const c of COLLECTIONS) {
    for (const e of colItems(c)) {
      if (!colIndex.has(e.c)) colIndex.set(e.c, []);
      colIndex.get(e.c).push(c);
    }
  }
  let n = 0;
  for (const e of DATA) {
    const hex = emojiHex(e.c);
    const file = emojiSlug(e);
    const cat = CAT_MAP.get(e.g) || CATS[0];
    const catList = byCat.get(e.g) || [];
    const idx = catList.indexOf(e);
    const prev = idx > 0 ? catList[idx - 1] : null;
    const next = idx < catList.length - 1 ? catList[idx + 1] : null;
    const cols = colIndex.get(e.c) || [];
    const keys = (e.kz || []).slice(0, 8);
    const keysEn = (e.ke || []).slice(0, 8);
    const note = NOTES[e.c];
    // 开发者复制格式（P2-1）
    const cps = Array.from(e.c).map((ch) => ch.codePointAt(0));
    const hexArr = cps.map((cp) => cp.toString(16));
    const fmtHtml = hexArr.map((h) => `&#x${h.toUpperCase()};`).join('');
    const fmtCss = hexArr.map((h) => `\\${h.toUpperCase()}`).join(' ');
    const fmtJs = hexArr.map((h) => `\\u{${h.toUpperCase()}}`).join('');
    const cpRows = cps.map((cp) => {
      const info = cpInfo(cp);
      return `<tr><td><code>U+${info.hex}</code></td><td>${info.dec}</td><td>${esc([info.zh, info.en].filter(Boolean).join(' · '))}</td></tr>`;
    }).join('');
    const title = `${e.zh}（${e.en}）Emoji 是什么意思｜${SITE.name}`;
    const desc = `${e.zh}（${e.en}）Emoji 详解：Unicode ${e.u}，短代码 :${e.s}:，属于「${cat.zh}」分类${keys.length ? `，常见含义：${keys.join('、')}` : ''}${note ? `，含义：${note.zh.slice(0, 44)}` : ''}。支持一键复制字符、短代码、Unicode 码点与 HTML/CSS/JS 转义格式。`;
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'WebPage',
      name: `${e.zh} emoji 详解`, description: desc, inLanguage: 'zh-CN',
      breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE.name, item: '../index.html' },
        { '@type': 'ListItem', position: 2, name: cat.zh, item: `../category/${cat.id}.html` },
        { '@type': 'ListItem', position: 3, name: e.zh },
      ] },
    };
    const colLinks = cols.map((c) => `<a class="rel-col" href="../${colLink(c.id)}">${esc(c.zh)}</a>`).join('');
    // 跨平台渲染预览（P2-3）：3 家稳定 CDN 源，hex 去 FE0F（各源文件均不含变体选择符）
    const hexNoV = hexArr.filter((h) => h !== 'fe0f');
    const VENDORS = [
      { name: 'Google', note: 'Noto Emoji', url: (hs) => `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/png/128/emoji_u${hs.join('_')}.png` },
      { name: 'X / Twitter', note: 'Twemoji', url: (hs) => `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/${hs.join('-')}.png` },
      { name: 'OpenMoji', note: '开源风格', url: (hs) => `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/color/72x72/${hs.join('-').toUpperCase()}.png` },
    ];
    const vendorHtml = VENDORS.map((v) => `<div class="vendor-item"><img src="${v.url(hexNoV)}" alt="${e.zh}在 ${v.name} 上的渲染效果" loading="lazy" onerror="this.closest('.vendor-item').classList.add('missing')"><span class="vendor-name">${v.name}</span><span class="vendor-note">${v.note}</span></div>`).join('');
    // 组合结构行（P2-4 无障碍：组合 emoji 的组件可视化，ZWJ/VS16 用文字徽标展示）
    function composePart(cp) {
      const hex = cp.toString(16);
      if (hex === '200d') return '<span class="compose-part compose-zwj">ZWJ</span>';
      if (hex === 'fe0f') return '<span class="compose-part compose-zwj">VS16</span>';
      return `<span class="compose-part" aria-hidden="true">${String.fromCodePoint(cp)}</span>`;
    }
    const composeHtml = cps.length > 1
      ? `<div class="detail-compose" aria-label="${e.zh}由 ${cps.length} 个码点组合而成">${cps.map(composePart).join('<span class="compose-sep" aria-hidden="true">＋</span>')}<span class="sr-only">由 ${cps.length} 个码点组合而成</span></div>`
      : '';
    const nav = `<nav class="detail-nav" aria-label="相邻 emoji">
${prev ? `<a href="${emojiDetailLink(prev, '../')}">← ${esc(prev.zh)}</a>` : '<span></span>'}
${next ? `<a href="${emojiDetailLink(next, '../')}">${esc(next.zh)} →</a>` : '<span></span>'}
</nav>`;
    const html = `${head(title, desc, `emoji/${file}.html`, jsonLd, '../')}
${header('../', cat.id)}
<main class="page-main detail-main" id="main">
<nav class="breadcrumb" aria-label="面包屑"><a href="../index.html">首页</a><span>/</span><a href="../${catLink(cat.id)}">${cat.zh}</a><span>/</span><span>${e.zh}</span></nav>
<section class="detail-card" style="--cat:${cat.color}">
<div class="detail-char" aria-hidden="true">${e.c}</div>
${composeHtml}
<h1>${e.zh} <em>${esc(e.en)}</em></h1>
<p class="detail-cat"><a href="../${catLink(cat.id)}">${cat.zh}</a> · Unicode 16.0 收录 · 全站共 ${DATA.length} 个 Emoji</p>
<div class="detail-copy" role="group" aria-label="复制">
<button type="button" class="detail-btn primary" data-copy="${esc(e.c)}">复制 ${e.zh}</button>
<button type="button" class="detail-btn" data-copy=":${esc(e.s)}:" title="复制短代码">短码 :${esc(e.s)}:</button>
<button type="button" class="detail-btn" data-copy="${esc(e.u)}" title="复制 Unicode 码点">${esc(e.u)}</button>
</div>
<div class="detail-copy dev" role="group" aria-label="开发者格式复制">
<span class="dev-label">开发者格式</span>
<button type="button" class="detail-btn dev" data-copy="${esc(fmtHtml)}" title="HTML 实体转义">HTML ${esc(fmtHtml)}</button>
<button type="button" class="detail-btn dev" data-copy="${esc(fmtCss)}" title="CSS 转义">CSS ${esc(fmtCss)}</button>
<button type="button" class="detail-btn dev" data-copy="${esc(fmtJs)}" title="JavaScript 转义">JS ${esc(fmtJs)}</button>
</div>
${keys.length ? `<div class="detail-keys"><span class="keys-label">常见含义</span>${keys.map((k) => `<span class="key-chip">${esc(k)}</span>`).join('')}</div>` : ''}
${keysEn.length ? `<div class="detail-keys en"><span class="keys-label">Keywords</span>${keysEn.map((k) => `<span class="key-chip">${esc(k)}</span>`).join('')}</div>` : ''}
${colLinks ? `<div class="detail-cols"><span class="keys-label">出现在集合</span>${colLinks}</div>` : ''}
</section>
<section class="vendor-section">
<h2 class="note-title">不同平台上的样子</h2>
<p class="vendor-hint">同一个 emoji 在各平台渲染风格不同——你发出的样子，对方手机上不一定一样。</p>
<div class="vendor-grid">${vendorHtml}</div>
</section>
${note ? `<section class="note-block">
<h2 class="note-title">含义说明</h2>
<p class="note-zh">${esc(note.zh)}</p>
${note.en ? `<p class="note-en">${esc(note.en)}</p>` : ''}
${note.pop ? `<p class="note-pop"><span class="note-tag">网络流行义</span>${esc(note.pop)}</p>` : ''}
${note.tip ? `<p class="note-tip"><span class="note-tag">使用提示</span>${esc(note.tip)}</p>` : ''}
</section>` : ''}
<section class="cp-section">
<h2 class="note-title">码点分解</h2>
<table class="cp-table">
<thead><tr><th>码点</th><th>十进制</th><th>名称 / 含义</th></tr></thead>
<tbody>${cpRows}</tbody>
</table>
<p class="cp-note">组合型 emoji（如家庭、职业、肤色）由多个码点组成，各平台渲染可能有差异。</p>
</section>
${nav}
</main>
${footer('../')}`;
    fs.writeFileSync(path.join(ROOT, 'emoji', `${file}.html`), html);
    // 旧码点路径跳转页（兼容旧链接，canonical 指向新 slug 页；目标用绝对 URL）
    fs.writeFileSync(path.join(ROOT, 'emoji', `${hex}.html`), redirectPage(e.zh, `${SITE_ORIGIN}/emoji/${file}.html`));
    n++;
  }
  console.log(`✓ emoji/ 详情页 × ${n}`);
}

// ---------- favicon ----------
function buildFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#FF5D8F"/><circle cx="22" cy="26" r="6" fill="#fff"/><circle cx="42" cy="26" r="6" fill="#fff"/><path d="M17 40c4 9 26 9 30 0" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`;
  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'assets', 'favicon.svg'), svg);
  console.log('✓ assets/favicon.svg');
}

// ---------- 执行 ----------
fs.mkdirSync(path.join(ROOT, 'category'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'collections'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'assets', 'css'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'assets', 'js'), { recursive: true });
buildFavicon();
buildIndex();
buildCategoryPages();
buildCollectionPages();
buildDetailPages();
buildSeo();
console.log('站点生成完成 ✅');
