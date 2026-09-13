# Emoji 大全（EmojiHub）

一个纯静态的 Emoji 检索与复制站点：收录 **Unicode 16.0 全量 3781 个 Emoji**，按官方 9 大分类与 8 个实用场景集合展示，支持**中英文关键词搜索（含同义词联想）**，点击即可复制 **Emoji 字符 / 短代码 / Unicode 码点**，并内置**最近使用、收藏夹**。

## 快速开始

直接用浏览器打开 `index.html` 即可使用（无需服务器，`file://` 协议下一切功能正常）。

## 目录结构

```
emoji-hub/
├── index.html                 # 首页：搜索 + 分类/集合入口
├── category/                  # 9 个官方分类页（静态预渲染，SEO 友好）
│   ├── smileys.html           #   笑脸与表情
│   ├── people.html            #   人物与身体
│   ├── animals.html           #   动物与自然
│   ├── food.html              #   食物与饮品
│   ├── travel.html            #   旅行与地点
│   ├── activities.html        #   活动
│   ├── objects.html           #   物品
│   ├── symbols.html           #   符号
│   └── flags.html             #   旗帜
├── collections/               # 8 个实用场景集合页
│   ├── work.html              #   工作常用（8 类分组 + 角色视图）
│   ├── schedule.html          #   日程管理
│   ├── chat.html              #   聊天回复
│   ├── festival.html          #   节日祝福
│   ├── status.html            #   项目状态
│   ├── meeting.html           #   会议常用
│   ├── mail.html              #   邮件常用
│   └── code_review.html       #   代码评审
├── build/emoji-notes.js      # 188 个高频 Emoji 含义注释（P2 内容生态）
├── emoji/                     # 3781 个 Emoji 独立详情页（SEO 长尾）
│   ├── grinning-face-1f600.html #   语义化 slug 路径（英文短名-码点），页内含含义/关键词/集合/相邻导航
│   └── 1f600.html             #   旧码点路径 → meta refresh 跳转到新 slug 页（兼容旧链接）
├── assets/
│   ├── css/style.css          # 样式（4 套主题，CSS 变量驱动）
│   ├── js/main.js             # 复制 / 搜索 / 主题 / 导航
│   ├── data/emoji-data.js     # 全量 emoji 数据（全局变量，file:// 可用）
│   └── favicon.svg
├── build/
│   ├── build-data.js          # 数据构建：合并多数据源 → emoji-data.js
│   └── build-site.js          # 站点构建：数据 → 全部静态页面
├── _raw/                      # 构建数据源（Unicode/CLDR/gemoji 原始文件）
├── robots.txt
└── sitemap.xml
```

## 功能说明

- **复制**：点击卡片上的 Emoji 大字符复制字符本身（热区聚焦在字符上，避免误触收藏/详情）；「短码」「Unicode」小块可单独点击复制。
- **搜索**：支持中文名、英文名、关键词、短代码（`:smile:`）、Unicode 码点（`U+1F600`）与 emoji 字符本身；全站顶部搜索框可用，非首页搜索会自动跳转到首页并展示结果。
- **搜索联想**：输入时实时弹出联想下拉（最多 8 条），点击即可直接搜索；Esc / 点击空白处关闭。
- **同义词扩展**：内置 195 个词条 / 517 个短代码的场景化同义词表——既覆盖中英文口语（`yyds`→💯🔥💪、`点赞`→👍👌、`666`、`收到`），也覆盖工作语义映射（`施工`→🚧🛠️⏳=进行中、`沙漏`→⏳⌛⏰=等待、`阻塞`→🛑🚧🐌、`下班`→🏠🍺😌、`加班`→🌃🌔☕、`摸鱼`→🐟☕💨、`emo`、`裂开`、`冲鸭` 等），"知道意思但说不出口"也能搜到。
- **最近使用**：复制过的 emoji 自动记录（最多 24 个，localStorage 持久化），首页「最近使用」区块即点即用。
- **收藏夹**：每张卡片右上角 ☆ 可收藏/取消（★），首页「我的收藏」区块展示，所有页面（分类页/集合页/搜索结果）的卡片均支持。
- **集合分组**：8 个集合页全部按语义分组并带锚点导航——工作常用（9 类：确认/拒绝/数据/时间/文档/沟通/工具/职场/**任务状态** + 角色视图）、会议常用（会前/会中/表态/跟进）、代码评审（提交/检查/讨论/合入/保护）、邮件常用（起草/发送/跟进/回应/归档）、聊天回复（同意/大笑/安慰/无奈）、项目状态（进行/完成/阻塞/风险/里程碑）、节日祝福（春节/圣诞/生日/爱情/趣味）、日程管理（提醒/日期/时钟）。角色视图可切换到 7 种人群（程序员、产品经理、设计师、销售 BD、HR 行政、管理者），深链 `work.html?role=dev` 可直达。
- **Emoji 详情页**：每个 emoji 都有独立静态页，采用 SEO 友好的语义化路径（`emoji/grinning-face-1f600.html`，英文短名 + 码点后缀保证唯一），承载中英文含义、CLDR 关键词、所在集合、同分类相邻导航，并带 JSON-LD 结构化数据；旧码点路径（`emoji/1f600.html`）自动跳转到新页。卡片上的「详情 ↗」胶囊按钮直达。
- **复制整组**：集合页每个分组标题右侧有「复制整组」按钮，一键把该组全部 emoji 拼成字符串复制。
- **快捷组合**：首页新增 12 组高频表情串（发布祝贺 🎉🚀🎊、收到确认 ✅👌👍、开工大吉 🚧🔨📦、下班走人 🏠🍺😌 等），点击整串复制，发群聊/朋友圈更快。
- **移动端优化**：顶部导航在移动端 sticky 吸顶；复制成功带触觉震动反馈（支持设备）；页面右下角「回到顶部」按钮滚动超 600px 后出现。
- **开发者复制格式（P2）**：详情页除字符/短码/码点外，新增 HTML 实体（`&#x1F480;`）、CSS 转义（`\1F480`）、JS 转义（`\u{1F480}`）三种格式一键复制，并附**码点分解表**（组合 emoji 的每个码点、十进制与名称/含义）。
- **含义说明内容生态（P2）**：为 188 个高频 emoji 编写人工含义注释，详情页展示中文含义、英文释义、**网络流行义**（如 💀=笑死、🤡=小丑竟是我自己、🫨=笑到发抖）与**使用提示**（如 🙏 欧美也作击掌、👍 单独回复显敷衍），并汇入页面 description 增强 SEO。
- **跨平台渲染预览（P2）**：详情页新增「不同平台上的样子」区块，从 3 个稳定 CDN 源（Google Noto / X Twemoji / OpenMoji）实时展示同一 emoji 在不同平台的渲染差异，并提示"你发出的样子，对方手机上不一定一样"；加载失败的平台自动隐藏。
- **无障碍深度优化（P2）**：全站新增「跳到主要内容」skip-link（键盘/读屏用户）、`main` 锚点、`prefers-reduced-motion` 动效降级；组合 emoji 详情页新增**组合结构可视化**（👩＋ZWJ＋👧，ZWJ/VS16 用文字徽标展示），码点表语义化；读屏聚焦路径全程可感知。
- **主题**：右上角可切换 4 套配色（糖果派对 / 薄荷清新 / 落日暖橙 / 静谧午夜），选择会保存在本地。
- **SEO**：每个分类/集合页都是独立静态页面，含独立 title、description、canonical、Open Graph 与 JSON-LD 结构化数据，另附 sitemap.xml 与 robots.txt。

## 重新构建

数据或集合需要更新时：

```bash
cd emoji-hub
node build/build-data.js   # 重新合并数据（可选，数据未变可跳过）
node build/build-site.js   # 重新生成全部静态页面
```

- 修改实用集合的精选 emoji：编辑 `build/build-site.js` 中 `COLLECTIONS` 的 `shorts` 数组（填 GitHub 风格短代码）；「工作常用」的分组与角色配置见该集合的 `groups` / `roles` 字段。
- 站点文案、分类描述：同样在 `build/build-site.js` 中修改后重新生成。

## 部署

将整个 `emoji-hub` 目录上传到任意静态托管（GitHub Pages、Vercel、Nginx 等）即可。部署到正式域名后，把 `sitemap.xml` 中 URL 前缀替换为正式域名。

## 数据来源

- [Unicode 16.0 Emoji List](https://unicode.org/Public/emoji/16.0/emoji-test.txt)（官方全量 RGI 集合与分类）
- [Unicode CLDR](https://github.com/unicode-org/cldr)（中英文注释与关键词、国家/地区名）
- [GitHub Gemoji](https://github.com/github/gemoji)（短代码）
- [iamcal/emoji-data](https://github.com/iamcal/emoji-data)（短代码兜底）

数据为 Unicode 与 GitHub 的公开数据，站点代码供学习与个人使用。
