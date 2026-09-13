# DevTools — 免费在线开发工具集

> 打开即用的免费在线开发工具：无需注册、无广告、纯前端实现，数据本地处理。

**在线使用：https://tools.dutycode.com**

[![License](https://img.shields.io/github/license/losetowin/devtools)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-tools.dutycode.com-brightgreen)](https://tools.dutycode.com)
[![GitHub Pages](https://img.shields.io/github/deployments/losetowin/devtools/github-pages?logo=github&label=GitHub%20Pages)](https://losetowin.github.io/devtools/)
[![Pure Frontend](https://img.shields.io/badge/Pure%20Frontend-No%20Backend-ff69b4)](https://github.com/losetowin/devtools)
[![Last Commit](https://img.shields.io/github/last-commit/losetowin/devtools)](https://github.com/losetowin/devtools)

## 工具列表

| 工具 | 链接 | 说明 |
| --- | --- | --- |
| Emoji 大全 | https://tools.dutycode.com/emoji-hub/ | Unicode 16.0 全量 3781 个 Emoji：含义、码点、平台差异、一键复制，支持搜索与分类浏览 |
| JSON 工具 | https://tools.dutycode.com/json-tool/ | JSON 格式化、压缩、校验、转义、树形查看、JSONPath 等 |
| 密码工坊 | https://tools.dutycode.com/password-gen/ | 随机密码生成器：本地生成不联网，支持长度、字符集、熵值展示 |

## 特性

- 纯静态 HTML/CSS/JS，无后端依赖，可部署到任何静态托管（nginx 等）
- 响应式设计；emoji-hub 支持多主题（candy / mint / sunset / night）
- SEO 友好：语义化 HTML、结构化数据（JSON-LD：WebSite / FAQPage / Article）、sitemap / robots 齐全、字体自托管
- 内容矩阵：每个工具包含 blog/ 目录，覆盖长尾关键词（emoji 含义、JSON 工具、密码生成等）

## 本地运行与构建

```bash
# emoji-hub 由 Node 生成器构建（数据源 _raw/，产物 emoji/、index.html、sitemap.xml 等）
cd emoji-hub
node build/build-site.js

# json-tool / password-gen 为纯静态页面，浏览器直接打开 index.html 即可
```

## 数据说明

- Emoji 语义数据基于 [Unicode CLDR](https://cldr.unicode.org/) 公共数据
- Emoji 图形由操作系统字体渲染，非本项目资源
- 中文含义注释为项目自行整理（见 `emoji-hub/build/emoji-notes.js`）

## License

[Apache-2.0](LICENSE) © 2026 zhangzhonghua5
