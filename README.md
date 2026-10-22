# Dammaz Kron 仇恨之书

一个中文矮人笑话收集站。每一笔，都记着。

以 Astro 构建的静态网站，代码、文字和展示图片保存在本仓库，使用 GitHub Pages 发布。

- 网站：https://yakumo-hx.github.io/Dammaz-Kron/
- 投稿：通过网站右下角“添一笔仇”打开表单，或直接新建 GitHub Issue。
- 本地预览：`http://127.0.0.1:4321/Dammaz-Kron/`

## 本地开发

使用 Node.js 24 或符合 Astro 要求的 Node.js 版本。

```sh
npm ci
npm run dev
```

构建发布文件：

```sh
npm run build
npm run preview
```

构建前自动检查编号是否重复、必需字段和图片路径。构建输出保存在 `dist/`。

## 已有功能

- 纸页样式的随机翻阅，上一条、下一条和暂停。
- 文字默认 30 秒、图片默认 15 秒；阅读图片等待加载完成，悬停、焦点留在书页、打开对话框或切出标签页时暂停计时。
- 按编号、正文和标签搜索；标签筛选可与搜索组合。
- 每条内容有独立地址，例如 `/Dammaz-Kron/entries/0000/`。
- 页脚下方的矮人彩蛋，点击矮人可以听到不同抱怨。
- 侧边投稿抽屉，生成 GitHub Issue 投稿草稿；需要 GitHub 登录，图片在 GitHub 页面添加。网站不会假装已收到投稿，用户需要在 GitHub 完成提交。
- 手机布局、键盘操作与减少动画偏好。

## 收录内容

编辑 `src/data/entries.json`。编号使用字符串，从 `0000` 开始递增，已有编号不随排序或标签改变。

```json
{
  "id": "0002",
  "question": "笑话标题或问题",
  "answer": "正文；如果日期是笑话的一部分，也写在这里。",
  "tags": ["麦酒", "记仇"],
  "images": []
}
```

图片放在 `public/images/`，条目的 `images` 可填写：

```json
[{ "src": "/images/0002-01.png", "alt": "图片内容的简短描述" }]
```

`question` 与 `answer` 共同组成笑话正文。编号 `0000` 的 2026 年 10 月 10 日和编号 `0001` 的 2026 年 10 月 22 日属于正文，不能抽取成页面发布日期。

标签用于辅助识别和筛选，不是判重依据。同一笑话的文字和截图可以放在一个条目下；是否重复由维护者结合内容判断。

## GitHub Pages

仓库 Settings → Pages 的 Source 使用 GitHub Actions。推送到 `main` 后，`.github/workflows/pages.yml` 自动构建和发布。

若变更仓库名或改用独立域名，需要同步调整 `astro.config.mjs` 的 `site` 和 `base`。

当前只依赖静态托管。后续可以为无需 GitHub 账号的投稿增加接收接口；前期托管、容量与交互讨论保存在 [技术方案](docs/technical-plan.md)。
