# George Lopez English Lab

面向初一入门学习者的中文英语学习网站。Next.js App Router + TypeScript + Tailwind CSS 4 + SQLite + Prisma 7。无需 AI 密钥或付费接口。

## 本地启动

需要 Node.js **22.18+**（推荐 Node 24 LTS）、npm，以及现代浏览器。

```bash
npm install
npm run dev
```

安装会自动生成 Prisma 客户端、应用 SQL 迁移、初始化 SQLite 和教学种子数据。开发命令也会幂等检查数据库。浏览器访问终端显示的地址（默认端口 3000）。录音需 localhost 或 HTTPS，并授权麦克风。

```bash
npm run build
npm start
npm test
npx playwright install chromium
npm run test:e2e
```

若已有 Chromium，省略下载，用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`。Windows 可在 PowerShell 用 `$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 设置实际路径。

`npm install` 首次需要 npm 注册表；better-sqlite3 优先下载平台预编译包，不存在时需要 Python、make、C++ 编译器。安装不关闭 TLS、签名或校验和检查。Prisma 使用 JavaScript 驱动适配器，无查询引擎；`scripts/generate.mjs` 将未使用的 schema-engine 选择器设为现有程序，避免下载无需运行的原生引擎。迁移由版本化 SQL 与 better-sqlite3 执行，**不要另用 `prisma migrate deploy`**。若要添加模型，新增迁移目录并扩展迁移执行器。当前脚本用 SHA-256 检查已应用迁移未被修改，使用事务初始化，重复运行保留数据。

## 第一次学习

1. 首页 → 课程目录 → 第 1 集。
2. 导入自己拥有的 MP4 / WebM 与 SRT / VTT；确认替换教学字幕。
3. 点击字幕跳转，使用上下句、倍速、偏移、AB 循环。偏移为正代表字幕在视频中延后。
4. 可编辑英文字幕和中文解释，收藏句子；独立教学扩展与用户字幕保持明确来源标签。
5. 学习 6 个词、3 个短语、语法；做听力选择和整句听写。
6. 跟读，可录音回放、手动跟读；语音识别是可选功能。
7. 完成四题随堂测验；错题可重做，单词可标记认识 / 不认识。
8. 刷新后恢复字幕、解释、播放位置、学习状态。出于浏览器文件权限，**重新打开页面需再次选择视频文件**，系统会恢复保存的时间。

视频使用本地 Blob URL，永不上传。录音只存当前设备内存，刷新即丢弃，不包含在导出文件中。语音识别可能通过浏览器服务商联网，点击后才启用；可以完全不用它。词汇匹配仅比较识别文本中出现的单词，**不是发音评分**。语音合成选择 en-US，音色取决于系统安装的美式语音。

## 内容与来源

- 内置的所有句子、词汇、短语、语法、练习均为本站教学示例，**不是原剧字幕**。
- 第一集标题 `Who's Your Daddy?` 由用户任务书指定，未独立核实。其余 23 集不填推测标题或剧情，显示等待教材。
- `teaching_example`（教学例句）、`user_import`（用户导入、待核实）、`verified_dialogue`（保留给人工核实的原剧字幕）分开存储。导入始终标记“用户提供，未经本站独立核实”，不自动升级为已核实台词。词汇、短语、语法、发音提示和练习各自注明教学来源。没有角色或剧情推断。
- 原始字幕文件文本和文件名保留在学习状态，编辑不会覆盖原文。字幕 cue 另存时轴、来源类型、来源和当前文本。
- IPA 为人工整理的常见美式读音宽式转写，参考 Cambridge Dictionary：
  [ready](https://dictionary.cambridge.org/dictionary/english/ready)、[family](https://dictionary.cambridge.org/dictionary/english/family)、[learn](https://dictionary.cambridge.org/dictionary/english/learn)、[help](https://dictionary.cambridge.org/dictionary/english/help)、[want](https://dictionary.cambridge.org/dictionary/english/want)、[can](https://dictionary.cambridge.org/dictionary/english/can)。方言读音可能不同，不自动为导入单词猜音标。
- 不含电视剧视频、剧照、完整原剧台词或其他未授权素材。E2E 的 sample.webm 是自行生成的纯色画面与正弦测试音，不属于剧集。

## 数据与复习

本机 `localStorage` 即时保存；700ms 后通过 Prisma 事务写入 `prisma/lab.db`，包括完整状态快照及 SubtitleCue、ExerciseAttempt、LearningProgress、ReviewSchedule、UserSettings 等规范化实体。数据库保存失败会提示，浏览器记录仍可使用。首次无浏览器记录会从 SQLite 恢复。设置中可导出 / 导入 JSON，或二次确认重置。

认识的词：第一次隔 1 天，之后间隔翻倍，上限 30 天；不认识：10 分钟后复习并重置间隔。统计根据真实勾选与作答计算，不伪造学习量。每日计划默认 20 分钟；时长设置保存学习目标，MVP 不会按时长自动改写教学内容。

数据库实体定义和关联在 `prisma/schema.prisma`。首次启动创建 24 个 Episode、第一集教学 Lesson，以及单词、短语、语法、练习种子。额外 LocalState 表用于完整 JSON 备份和离线恢复。**单机单人模式，无登录和多用户隔离**；不应直接作为公共共享服务部署。重置会覆盖单人数据。备份 JSON 不含视频或录音。

## 文件结构

```text
app/                       App Router、全局样式
  page.tsx                 学习空间入口（九个功能区）
  episodes/[id]/page.tsx    剧集课堂入口
  api/state/route.ts       Prisma 状态读取与事务保存
components/lab.tsx         交互课堂、播放器、学习系统
lib/content.ts             有来源标记的教学材料
lib/learning.ts            字幕解析、复习算法、文本匹配
lib/db.ts                  Prisma + SQLite 驱动
prisma/schema.prisma       数据实体和约束
prisma/migrations/         版本化 SQL
scripts/                   客户端生成、迁移、种子
 tests/                    Vitest 核心测试
 e2e/                      Playwright 桌面与手机流程
```

## MVP 范围和后续建议

已实现：响应式首页、24 集占位目录、第一集视频字幕课堂、词汇卡片收藏翻转与测验、10 个语法主题、听力、跟读、四种测验题型、错题本、间隔复习、成绩统计、设置与数据备份。

尚未实现：第二至二十四集的教材编辑和课程、全部剧集标题的独立核实、导入字幕的自动中文翻译和教学提取、多账号云同步、专业发音评估、视频文件跨刷新免重选、自动按每日时长生成个性化课程。导入真实字幕会替换视频课堂字幕，但独立教学单词与练习仍为示例，不能当成该集真实分析。

后续优先：核实标题与内容授权；人工校对第一集真实教材；将教材和练习绑定具体 cue；扩展每集教材管理；在目标浏览器人工验证麦克风与美式语音。

## 本次交付验证

- 全新临时目录 `npm ci`：成功，自动生成客户端、应用迁移并初始化种子数据。
- `npm install`：成功；数据库初始化连续重复执行成功。
- `npm run build`：成功，TypeScript 检查通过；使用 Webpack 避开本云环境 Turbopack 子进程限制。
- `npm test`：8 / 8 通过，覆盖 SRT/VTT、非法和重复字幕、来源、间隔复习、文本匹配及中文答案区分。
- Playwright：开发模式 8 / 8、最终生产模式 8 / 8 通过（桌面 Chromium 与手机视口各 4 项）。覆盖真实 WebM 播放、字幕跳转、偏移、AB 循环、视频位置恢复、字幕编辑、词卡、手动跟读、听力、语法、四种题型、错题本、JSON 导出导入、重置、浏览器记录清除后 SQLite 恢复及接口拒绝非法写入。
- 桌面与手机首页截图已人工查看；手机首页无横向溢出。
- SQLite：24 集、6 个词、10 个语法主题，外键检查无错误。
- 真实麦克风采集、系统语音音色和提供商在线识别未在物理设备验证；已保留手动跟读与手动文本模式。

复验生产模式浏览器流程：先 `npm run build`，然后 `E2E_PRODUCTION=1 npm run test:e2e`；已有 Chromium 时按前文设置其路径。测试操作的是本地单人数据库，会重置学习数据，请在独立测试副本中运行或先备份。
