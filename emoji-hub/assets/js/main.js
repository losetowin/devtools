/* Emoji 大全 · 交互脚本
   功能：主题切换 / 一键复制 / 中英文搜索 / 导航 */
(function () {
  'use strict';

  var DATA = window.EMOJI_DATA || [];
  var IS_HOME = /index\.html$/.test(location.pathname) || /\/$/.test(location.pathname) || location.pathname === '';
  var BASE = IS_HOME ? '' : '../';

  // ================= 主题切换 =================
  var THEMES = ['candy', 'mint', 'sunset', 'night'];
  var savedTheme = 'candy';
  try { savedTheme = localStorage.getItem('emoji-theme') || 'candy'; } catch (e) {}
  if (THEMES.indexOf(savedTheme) === -1) savedTheme = 'candy';
  document.body.dataset.theme = savedTheme;

  function syncThemeButtons() {
    document.querySelectorAll('.theme-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-theme') === savedTheme ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.theme-btn');
    if (!btn) return;
    savedTheme = btn.getAttribute('data-theme');
    document.body.dataset.theme = savedTheme;
    try { localStorage.setItem('emoji-theme', savedTheme); } catch (e) {}
    syncThemeButtons();
  });
  syncThemeButtons();

  // ================= 本地存储：最近使用 / 收藏 =================
  var RECENTS_KEY = 'emoji-recents', FAVS_KEY = 'emoji-favs', MAX_RECENTS = 24;
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var recents = lsGet(RECENTS_KEY, []);
  var favs = lsGet(FAVS_KEY, []);
  var byCharMap = {};
  DATA.forEach(function (e) { byCharMap[e.c.replace(/\uFE0F/g, '')] = e; });
  function recordRecent(c) {
    recents = recents.filter(function (x) { return x !== c; });
    recents.unshift(c);
    if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS);
    lsSet(RECENTS_KEY, recents);
    renderRecentGrid();
  }
  function toggleFav(c) {
    var i = favs.indexOf(c);
    if (i === -1) favs.push(c); else favs.splice(i, 1);
    lsSet(FAVS_KEY, favs);
    renderFavGrid();
    syncFavButtons();
  }
  function renderRecentGrid() {
    var sec = document.getElementById('recent-section'), grid = document.getElementById('recent-grid');
    if (!sec || !grid) return;
    if (!recents.length) { sec.hidden = true; grid.innerHTML = ''; return; }
    sec.hidden = false;
    grid.innerHTML = recents.map(function (c) { var e = byCharMap[c]; return e ? emojiCard(e) : ''; }).join('');
  }
  function renderFavGrid() {
    var sec = document.getElementById('fav-section'), grid = document.getElementById('fav-grid');
    if (!sec || !grid) return;
    if (!favs.length) { sec.hidden = true; grid.innerHTML = ''; return; }
    sec.hidden = false;
    grid.innerHTML = favs.slice().reverse().map(function (c) { var e = byCharMap[c]; return e ? emojiCard(e) : ''; }).join('');
  }
  function syncFavButtons() {
    document.querySelectorAll('.fav-btn').forEach(function (b) {
      var on = favs.indexOf(b.getAttribute('data-fav')) !== -1;
      b.classList.toggle('on', on);
      b.innerHTML = on ? '★' : '☆';
      b.setAttribute('aria-label', (on ? '取消收藏 ' : '收藏 ') + '');
    });
  }

  // ================= 复制 =================
  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  document.addEventListener('click', function (ev) {
    // 链接（详情页）与收藏按钮不触发复制
    if (ev.target.closest('a') || ev.target.closest('[data-fav]')) return;
    var el = ev.target.closest('[data-copy]');
    if (!el) return;
    ev.preventDefault();
    var text = el.getAttribute('data-copy');
    var card = el.closest('.ecard');
    if (card && el.classList.contains('ec-char')) {
      recordRecent(text); // 仅复制字符本身时记入最近使用
    }
    var label = el.classList.contains('ec-code') ? (el.getAttribute('title') || text) : text;
    copyText(text).then(function (ok) {
      if (card) {
        card.classList.remove('copied');
        void card.offsetWidth; // 重启动画
        card.classList.add('copied');
        setTimeout(function () { card.classList.remove('copied'); }, 700);
      }
      if (ok && navigator.vibrate && document.hasFocus() && document.visibilityState === 'visible') { try { navigator.vibrate(12); } catch (e) {} } // 移动端触觉反馈
      toast(ok ? '已复制 <b>' + escapeHtml(label) + '</b>' : '复制失败，请手动选择复制');
    });
  });
  // 收藏切换（不触发复制；stopImmediatePropagation 阻止同节点后续复制委托）
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-fav]');
    if (!btn) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    toggleFav(btn.getAttribute('data-fav'));
  });
  // 键盘可达性：role=button 的复制/收藏元素支持 Enter/Space 触发
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('role') === 'button' && (t.hasAttribute('data-copy') || t.hasAttribute('data-fav'))) {
      ev.preventDefault();
      t.click();
    }
  });
  // 复制整组（集合页分组标题按钮）
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.copy-group');
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    var shorts = (btn.getAttribute('data-shorts') || '').split(',').filter(Boolean);
    var text = shorts.map(function (s) { var e = byShortMap[s]; return e ? e.c : ''; }).join('');
    if (!text) return;
    copyText(text).then(function (ok) {
      if (ok && navigator.vibrate && document.hasFocus() && document.visibilityState === 'visible') { try { navigator.vibrate(12); } catch (e) {} }
      toast(ok ? '已复制整组 <b>' + shorts.length + '</b> 个 emoji' : '复制失败，请手动选择复制');
    });
  });
  // 快捷组合（首页一键复制一组表情）
  document.addEventListener('click', function (ev) {
    var chip = ev.target.closest('.combo-chip');
    if (!chip) return;
    ev.preventDefault();
    var text = chip.getAttribute('data-combo') || '';
    if (!text) return;
    copyText(text).then(function (ok) {
      if (ok && navigator.vibrate && document.hasFocus() && document.visibilityState === 'visible') { try { navigator.vibrate(12); } catch (e) {} }
      toast(ok ? '已复制组合 <b>' + escapeHtml(text) + '</b>' : '复制失败，请手动选择复制');
    });
  });
  // 回到顶部（P1 移动端优化）
  var backTop = document.getElementById('back-top');
  if (backTop) {
    window.addEventListener('scroll', function () {
      backTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ================= 搜索卡片渲染 =================
  function emojiHex(c) {
    return Array.from(c).map(function (ch) { return ch.codePointAt(0).toString(16); }).join('-');
  }
  function emojiSlug(e) {
    var base = (e.en || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'emoji';
    return base + '-' + emojiHex(e.c);
  }
  function emojiCard(e) {
    var fav = favs.indexOf(e.c) !== -1;
    return '<div class="ecard" aria-label="' + escapeHtml(e.zh) + '（' + escapeHtml(e.en) + '）">'
      + '<span class="fav-btn' + (fav ? ' on' : '') + '" role="button" tabindex="0" data-fav="' + escapeHtml(e.c) + '" aria-label="' + (fav ? '取消收藏 ' : '收藏 ') + escapeHtml(e.zh) + '">' + (fav ? '★' : '☆') + '</span>'
      + '<span class="ec-char" role="button" tabindex="0" data-copy="' + escapeHtml(e.c) + '" title="点击复制 ' + e.c + '" aria-label="复制 ' + escapeHtml(e.zh) + '（' + escapeHtml(e.en) + '）">' + e.c + '</span>'
      + '<span class="ec-zh">' + escapeHtml(e.zh) + '</span>'
      + '<span class="ec-en">' + escapeHtml(e.en) + '</span>'
      + '<span class="ec-meta">'
      + '<span class="ec-code" data-copy=":' + escapeHtml(e.s) + ':" title="复制短代码 :' + escapeHtml(e.s) + ':"><span class="ec-k">短码</span>:' + escapeHtml(e.s) + ':</span>'
      + '<span class="ec-code" data-copy="' + escapeHtml(e.u) + '" title="复制 Unicode 码点 ' + escapeHtml(e.u) + '"><span class="ec-k">Unicode</span>' + escapeHtml(e.u) + '</span>'
      + '</span>'
      + '<a class="ec-detail" href="emoji/' + emojiSlug(e) + '.html" aria-label="查看 ' + escapeHtml(e.zh) + ' 详情">详情 ↗</a>'
      + '</div>';
  }

  // ================= 搜索 =================
  // 常用同义词 → 短代码（解决“知道意思但不知道名字/关键词”的查找痛点）
  var SYN = {
    // —— 口语/网络语 ——
    'yyds': ['100', 'fire', 'muscle'], '666': ['+1', 'ok_hand', '100'], '点赞': ['+1', 'ok_hand'],
    '赞': ['+1', 'ok_hand'], '牛': ['muscle', 'fire', '100'], '牛批': ['100', 'muscle', 'fire'],
    '棒': ['100', 'clap', 'ok_hand'], '稳': ['ok_hand', '100', 'muscle'], '顶': ['muscle', '+1', 'fire'],
    '菜': ['seedling', 'hatched_chick'], '拉胯': ['snail', 'turtle', 'cold_sweat'],
    '哈哈': ['joy', 'laughing', 'smile'], '笑死': ['joy', 'laughing', 'skull'], '笑哭': ['joy', 'laughing'],
    '无语': ['facepalm', 'roll_eyes'], '捂脸': ['facepalm', 'hand_over_mouth'],
    '尴尬': ['sweat_smile', 'grimacing', 'facepalm'], '委屈': ['pensive', 'disappointed', 'cry'],
    '晕': ['dizzy_face', 'dizzy'], '头大': ['dizzy_face', 'exploding_head'],
    '裂开': ['broken_heart', 'vomiting_face', 'skull'], '炸了': ['exploding_head', 'angry', 'fire'],
    '惊呆了': ['open_mouth', 'astonished', 'scream'], '哭了': ['sob', 'cry'], '大哭': ['sob', 'cry'],
    '压力': ['cold_sweat', 'sweat_drops'], 'emo': ['pensive', 'disappointed', 'cry'],
    // —— 工作与任务状态 ——
    '施工': ['construction', 'hammer_and_wrench', 'hourglass_flowing_sand'],
    '施工中': ['construction', 'hammer_and_wrench'],
    '进行': ['construction', 'hourglass_flowing_sand', 'arrows_counterclockwise'],
    '进行中': ['construction', 'hourglass_flowing_sand'],
    '沙漏': ['hourglass_flowing_sand', 'hourglass', 'alarm_clock'],
    '等待': ['hourglass_flowing_sand', 'coffee', 'clock1'],
    '等': ['hourglass_flowing_sand', 'coffee'],
    '阻塞': ['stop_sign', 'construction', 'snail'],
    '卡住': ['snail', 'stop_sign', 'turtle'],
    '阻塞中': ['stop_sign', 'construction'],
    '风险': ['warning', 'fire', 'cloud_with_lightning'],
    '问题': ['question', 'bug', 'warning'],
    '修复': ['wrench', 'hammer_and_wrench', 'bug'],
    '完成': ['white_check_mark', 'checkered_flag', 'tada'],
    '取消': ['x', 'stop_sign', 'negative_squared_cross_mark'],
    '计划': ['date', 'memo', 'dart'],
    '提醒': ['bell', 'alarm_clock', 'pushpin'],
    '截止': ['alarm_clock', 'hourglass', 'stop_sign'],
    '加班': ['night_with_stars', 'moon', 'coffee'],
    '摸鱼': ['fish', 'coffee', 'dash'],
    '卷': ['muscle', 'fire', 'snake'],
    '开会': ['mega', 'date', 'bar_chart'],
    '需求': ['memo', 'pushpin', 'dart'],
    '上线': ['rocket', 'tada', 'chart_with_upwards_trend'],
    '发布': ['rocket', 'tada', 'package'],
    '部署': ['rocket', 'package', 'cloud'],
    '测试': ['bug', 'mag', 'test_tube'],
    '汇报': ['bar_chart', 'memo', 'mega'],
    '数据': ['bar_chart', 'chart_with_upwards_trend', 'abacus'],
    '指标': ['bar_chart', 'dart'],
    '文档': ['memo', 'page_facing_up', 'book'],
    '邮件': ['email', 'envelope', 'inbox_tray'],
    '电话': ['phone', 'iphone'],
    '保存': ['floppy_disk', 'package', 'memo'],
    '上传': ['cloud', 'arrow_up', 'package'],
    '下载': ['arrow_down', 'cloud', 'floppy_disk'],
    '备份': ['floppy_disk', 'package', 'cloud'],
    '充电': ['battery', 'electric_plug', 'zap'],
    '电量': ['battery', 'electric_plug'],
    '信号': ['signal_strength', 'satellite'],
    '联网': ['globe_with_meridians', 'link', 'cloud'],
    '清理': ['broom', 'wastebasket'],
    '删除': ['wastebasket', 'x', 'scissors'],
    '入职': ['briefcase', 'wave', 'office'],
    '辞职': ['wave', 'briefcase', 'door'],
    '面试': ['memo', 'briefcase', 'speech_balloon'],
    '招聘': ['mega', 'briefcase', 'mag'],
    '升职': ['chart_with_upwards_trend', 'rocket', 'tada'],
    '加薪': ['moneybag', 'rocket', 'heart'],
    '老板': ['briefcase', 'crown', 'office'],
    '客户': ['handshake', 'briefcase', 'bar_chart'],
    '开会中': ['mega', 'date'],
    '下班': ['house', 'beer', 'relieved'],
    '周末': ['beer', 'tada', 'parasol_on_ground'],
    // —— 生活与健康 ——
    '吃饭': ['fork_and_knife', 'rice', 'ramen'],
    '饿了': ['hamburger', 'pizza', 'ramen'],
    '咖啡': ['coffee', 'tea'],
    '喝水': ['droplet', 'tea', 'beer'],
    '睡觉': ['sleeping', 'bed', 'zzz'],
    '失眠': ['moon', 'zzz', 'sleepy'],
    '熬夜': ['moon', 'night_with_stars', 'coffee'],
    '早起': ['alarm_clock', 'sunrise', 'coffee'],
    '生病': ['face_with_thermometer', 'sneezing_face', 'hospital'],
    '感冒': ['sneezing_face', 'face_with_thermometer'],
    '发烧': ['face_with_thermometer', 'hot_face'],
    '吃药': ['pill', 'syringe', 'hospital'],
    '医院': ['hospital', 'ambulance', 'health_worker'],
    '医生': ['health_worker', 'hospital', 'stethoscope'],
    '健康': ['heart', 'muscle', 'green_heart'],
    '运动': ['runner', 'weight_lifting', 'basketball'],
    '健身': ['muscle', 'weight_lifting', 'fire'],
    '跑步': ['runner', 'dash', 'horse_racing'],
    '游泳': ['swimmer', 'ocean', 'fish'],
    '打球': ['basketball', 'soccer', 'tennis'],
    '游戏': ['video_game', 'joystick', 'game_die'],
    '赢了': ['trophy', '1st_place_medal', 'tada'],
    '输了': ['2nd_place_medal', '-1', 'cold_sweat'],
    '唱歌': ['microphone', 'musical_note', 'guitar'],
    '音乐': ['musical_note', 'headphones', 'guitar'],
    '电影': ['clapper', 'popcorn', 'ticket'],
    '看书': ['book', 'books'],
    '学习': ['books', 'pencil2', 'mortar_board'],
    '考试': ['memo', 'pencil2', 'mortar_board'],
    '毕业': ['mortar_board', 'tada', 'scroll'],
    '结婚': ['ring', 'heart', 'person_with_veil'],
    '生子': ['baby', 'baby_bottle', 'heart'],
    '买房': ['house', 'key', 'moneybag'],
    '旅行': ['airplane', 'luggage', 'camera'],
    '拍照': ['camera', 'iphone', 'camera_flash'],
    '下雨': ['cloud_with_rain', 'umbrella', 'droplet'],
    '下雪': ['snowflake', 'snowman', 'cloud_with_snow'],
    '天气': ['sunny', 'cloud', 'umbrella'],
    '热': ['hot_face', 'sunny', 'fire'],
    '冷': ['cold_face', 'snowflake', 'snowman'],
    // —— 情感与关系 ——
    '加油': ['muscle', 'raised_hands', 'fire'], '加油呀': ['muscle', 'fire'],
    '收到': ['inbox_tray', 'white_check_mark'], '再见': ['wave'], '拜拜': ['wave'],
    '晚安': ['night_with_stars', 'sleeping', 'zzz'], '早安': ['sunrise', 'coffee', 'sunny'],
    '谢谢': ['pray'], '感谢': ['pray'], '辛苦': ['pray'],
    '爱你': ['heart', 'heart_eyes', 'love_letter'], '爱了': ['heart', 'heart_eyes'],
    '恭喜': ['tada', 'confetti_ball', 'clap'], '祝贺': ['tada', 'confetti_ball'],
    '生日快乐': ['birthday', 'cake', 'tada'], '生日': ['birthday', 'cake'],
    '圣诞': ['christmas_tree', 'santa', 'snowman'], '新年': ['fireworks', 'sparkler', 'tada'],
    '成功': ['trophy', 'rocket', 'tada'], '失败': ['-1', 'x', 'cry'],
    '顺利': ['white_check_mark', 'clap', '100'], '平安': ['pray', 'heart', 'peace_symbol'],
    '坚持': ['muscle', 'fire', 'trophy'], '努力': ['muscle', 'fire', 'runner'],
    '冲鸭': ['rocket', 'duck', 'fire'], '搞起': ['rocket', 'muscle', 'fire'],
    '冲': ['rocket', 'dash', 'fire'], '出发': ['airplane', 'car', 'runner'],
    '到了': ['checkered_flag', 'house', 'mailbox'], '回家': ['house', 'wave', 'airplane'],
    '约会': ['heart', 'rose', 'couple_with_heart'], '恋爱': ['heart', 'two_hearts', 'kiss'],
    '失恋': ['broken_heart', 'cry', 'pensive'], '吵架': ['angry', 'rage', 'boom'],
    '道歉': ['pray', 'hugs', 'facepalm'], '和好': ['handshake', 'hugs', 'heart'],
    '朋友': ['handshake', 'smile', 'people_holding_hands'], '家人': ['family', 'house', 'heart'],
    '放弃': ['wave', 'x', 'white_flag'], '加油鸭': ['muscle', 'duck', 'fire'],
    // —— 英文口语 ——
    'ok': ['ok_hand', '+1'], 'lol': ['joy', 'laughing'], 'omg': ['scream', 'astonished'],
    'wow': ['open_mouth', 'astonished'], 'cool': ['sunglasses', 'ok_hand'],
    'nice': ['ok_hand', '+1', '100'], 'good': ['+1', 'ok_hand', '100'], 'great': ['+1', '100'],
    'yes': ['white_check_mark', '+1'], 'no': ['x', '-1'], 'love': ['heart', 'heart_eyes', 'two_hearts'],
    'thanks': ['pray'], 'thank': ['pray'],
    'congrats': ['tada', 'confetti_ball', 'clap'], 'happy': ['smile', 'grin', 'joy'],
    'sad': ['sob', 'cry', 'disappointed'], 'angry': ['angry', 'rage'], 'mad': ['angry', 'rage'],
    'sleep': ['sleeping', 'sleepy', 'zzz'], 'sleepy': ['sleepy', 'sleeping'],
    'fire': ['fire'], 'rocket': ['rocket'], 'bug': ['bug'], 'party': ['tada', 'confetti_ball'],
    'progress': ['construction', 'hourglass_flowing_sand'], 'wait': ['hourglass_flowing_sand', 'coffee'],
    'done': ['white_check_mark', 'checkered_flag'], 'blocked': ['stop_sign', 'construction'],
    'risk': ['warning', 'fire'], 'meeting': ['mega', 'date', 'bar_chart'],
    'celebrate': ['tada', 'confetti_ball', 'champagne'],
    // —— 已有补充 ——
    '庆祝': ['tada', 'confetti_ball', 'fireworks'], '完美': ['100', 'white_check_mark'],
    '厉害': ['muscle', 'fire', '100'],
  };
  var byShortMap = {};
  DATA.forEach(function (e) { if (!byShortMap[e.s]) byShortMap[e.s] = e; });

  function search(q) {
    q = (q || '').trim();
    if (!q) return [];
    var lq = q.toLowerCase();
    var nq = lq.replace(/^:+|:+$/g, '');
    var uq = q.toUpperCase();
    var qNorm = q.replace(/\uFE0F/g, '');
    var out = [];
    var seen = new Set();
    // 同义词直命中优先（用户说“点赞”“yyds”也能搜到）
    var synKey = lq.replace(/[!?。，！？\s]+/g, '');
    var synList = SYN[synKey] || SYN[lq];
    if (synList) {
      for (var si = 0; si < synList.length; si++) {
        var hit = byShortMap[synList[si]];
        if (hit && !seen.has(hit.c)) { out.push(hit); seen.add(hit.c); }
      }
    }
    for (var i = 0; i < DATA.length; i++) {
      var e = DATA[i];
      if (seen.has(e.c)) continue;
      if (e.c.indexOf(qNorm) !== -1) { out.push(e); seen.add(e.c); continue; }
      if (e.zh && e.zh.toLowerCase().indexOf(lq) !== -1) { out.push(e); seen.add(e.c); continue; }
      if (e.en && e.en.toLowerCase().indexOf(lq) !== -1) { out.push(e); seen.add(e.c); continue; }
      if (e.s && (e.s.toLowerCase().indexOf(nq) !== -1 || (':' + e.s + ':').toLowerCase().indexOf(lq) !== -1)) { out.push(e); seen.add(e.c); continue; }
      if (e.u && e.u.toUpperCase().indexOf(uq) !== -1) { out.push(e); seen.add(e.c); continue; }
      if (e.kz && e.kz.some(function (k) { return k && k.toLowerCase().indexOf(lq) !== -1; })) { out.push(e); seen.add(e.c); continue; }
      if (e.ke && e.ke.some(function (k) { return k && k.toLowerCase().indexOf(lq) !== -1; })) { out.push(e); seen.add(e.c); continue; }
    }
    return out;
  }

  var heroInput = document.getElementById('hero-search-input');
  var headerInput = document.getElementById('search-input');
  var resultsSection = document.getElementById('search-results');
  var resultGrid = document.getElementById('result-grid');
  var resultCount = document.getElementById('result-count');

  function renderResults(q) {
    if (!resultsSection || !resultGrid) return;
    var results = search(q);
    resultsSection.hidden = false;
    var shown = results.slice(0, 600);
    resultGrid.innerHTML = shown.map(emojiCard).join('');
    if (results.length === 0) {
      resultGrid.innerHTML = '<div class="empty-state"><span class="big">🤷</span>没有找到匹配的 emoji<br>试试其他中文、英文、短代码（如 :smile:）或码点（如 U+1F600）</div>';
      resultCount.innerHTML = '';
    } else if (results.length > 600) {
      resultCount.innerHTML = '<span class="result-hint">共 ' + results.length + ' 个结果，已显示前 600 个，请细化关键词</span>';
    } else {
      resultCount.innerHTML = '<span class="result-hint">共 ' + results.length + ' 个结果</span>';
    }
    var top = resultsSection.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  function submitSearch(q) {
    q = (q || '').trim();
    if (!q) return;
    if (IS_HOME) {
      if (heroInput) heroInput.value = q;
      if (headerInput) headerInput.value = q;
      renderResults(q);
    } else {
      location.href = BASE + 'index.html?q=' + encodeURIComponent(q);
    }
  }

  // header 搜索表单
  var form = document.querySelector('[data-search-form]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var inp = form.querySelector('input');
      submitSearch(inp.value);
    });
  }
  // 首页输入实时搜索（防抖）
  function bindLiveSearch(input, other) {
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var v = input.value;
        if (other && other.value !== v) other.value = v;
        if (v.trim()) renderResults(v);
        else if (resultsSection) resultsSection.hidden = true;
      }, 200);
    });
  }
  if (IS_HOME) {
    bindLiveSearch(heroInput, headerInput);
    bindLiveSearch(headerInput, heroInput);
  }
  // 热门搜索词
  document.querySelectorAll('.hot-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var q = chip.getAttribute('data-q');
      submitSearch(q);
    });
  });
  // URL 参数直达搜索
  function getQuery() {
    try { return new URLSearchParams(location.search).get('q') || ''; } catch (e) { return ''; }
  }
  if (IS_HOME) {
    var initialQ = getQuery();
    if (initialQ) {
      if (heroInput) heroInput.value = initialQ;
      if (headerInput) headerInput.value = initialQ;
      setTimeout(function () { renderResults(initialQ); }, 60);
    }
  }

  // ================= 角色视图（工作常用集合） =================
  var roleTabs = document.querySelectorAll('[data-role]');
  var roleGroups = document.querySelectorAll('[data-cat]');
  if (roleTabs.length && roleGroups.length) {
    function applyRole(role) {
      var tab = null;
      roleTabs.forEach(function (t) {
        var hit = t.getAttribute('data-role') === role;
        if (hit) tab = t;
        t.classList.toggle('active', hit);
        t.setAttribute('aria-pressed', hit ? 'true' : 'false');
      });
      var cats = tab ? (tab.getAttribute('data-cats') || '').split(',').filter(Boolean) : [];
      roleGroups.forEach(function (g) {
        var show = role === 'all' || cats.indexOf(g.getAttribute('data-cat')) !== -1;
        g.hidden = !show;
      });
    }
    document.addEventListener('click', function (ev) {
      var tab = ev.target.closest('[data-role]');
      if (!tab) return;
      var role = tab.getAttribute('data-role');
      applyRole(role);
      try { history.replaceState(null, '', '?role=' + role); } catch (e) {}
    });
    var initialRole = (function () {
      try { return new URLSearchParams(location.search).get('role') || 'all'; } catch (e) { return 'all'; }
    })();
    applyRole(initialRole);
  }

  // ================= 导航（移动端）=================
  var navToggle = document.querySelector('.nav-toggle');
  var siteNav = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ================= 搜索联想下拉 =================
  function bindSuggest(inputId, boxId) {
    var input = document.getElementById(inputId);
    var box = document.getElementById(boxId);
    if (!input || !box) return;
    var timer = null;
    function close() { box.hidden = true; }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var v = input.value;
      if (!v.trim()) { close(); return; }
      timer = setTimeout(function () {
        var r = search(v).slice(0, 8);
        if (!r.length) { close(); return; }
        box.innerHTML = r.map(function (e) {
          return '<button type="button" class="suggest-item" data-q="' + escapeHtml(e.c) + '">'
            + '<span class="sg-char">' + e.c + '</span>'
            + '<span class="sg-name">' + escapeHtml(e.zh) + ' · ' + escapeHtml(e.en) + '</span>'
            + '</button>';
        }).join('');
        box.hidden = false;
      }, 120);
    });
    box.addEventListener('click', function (ev) {
      var item = ev.target.closest('.suggest-item');
      if (!item) return;
      var q = item.getAttribute('data-q');
      input.value = q;
      close();
      submitSearch(q);
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') close();
      if (ev.key === 'Enter') close();
    });
    document.addEventListener('click', function (ev) {
      if (!input.contains(ev.target) && !box.contains(ev.target)) close();
    });
  }
  bindSuggest('hero-search-input', 'hero-suggest');
  bindSuggest('search-input', 'header-suggest');

  // ================= 初始化：最近使用 / 收藏 =================
  renderRecentGrid();
  renderFavGrid();
  syncFavButtons();
})();
