# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 食单 · 一周食谱规划

纯前端、零依赖的居家菜谱规划工具：内置家常菜谱库，按库存食材自动排一周午/晚餐，支持购物清单、荤素搭配、忌口过滤、家庭共享实时同步。全项目无构建工具、无包管理器、无运行时依赖。

## 常用命令

```bash
node server.js 8765        # 启动本地服务（默认端口 8765）：静态文件 + 同步 API + 链接抓取代理
node tests/core.test.js    # 核心算法测试（荤素组合、丰盛晚餐）
node tests/classifier.test.js  # 荤素分类器测试（72 道菜全表 + 川菜特例）
node --check <file>.js     # 语法检查（没有 linter；改完任何 .js 都跑一遍）
docker compose up -d --build   # Docker 部署（compose 里配了 SHIDAN_HOSTS 放行 Authentik 域名）
```

测试是仓库内的两个自包含 Node 脚本（无框架、无依赖），直接 `node tests/*.test.js` 运行，失败退出码 1。改 `core.js` / `classifier.js` / `recipes.js` 后必跑。UI 流程无自动化测试。README 里的快速验证：

```bash
node -e "const R=require('./recipes.js'),C=require('./core.js');const p=C.planWeek(R,[],{days:7,servings:2.5,quick:true,maxMissing:2,quickLimit:25,maxSpice:0});console.log('餐数',p.days.length*2,'平均',p.stats.avgMinutes,'分钟')"
```

## 部署

### 运行形态

- **纯静态**（双击 `index.html` / GitHub Pages / Netlify / Vercel）：数据仅存浏览器 localStorage，无共享同步；`/api/fetch` 链接抓取代理不可用，跨域受限的网站需手动复制文字粘贴
- **Node 本地服务**：`node server.js 8765`（Node ≥ 18，零依赖）；家庭内网经 `http://IP:8765` 共享，防火墙需放行端口
- **Docker**（家庭服务器推荐）：`docker compose up -d --build`；镜像 `node:22-alpine`，`.dockerignore` 排除了 `data/`，靠卷 `./data:/app/data` 持久化数据（重建容器不丢）

### 反向代理 / 自定义域名

server.js 校验请求 Host（防 DNS rebinding）：只放行 IP / localhost / 单段主机名 / `*.local`。经反向代理（如 Authentik）用域名访问时，必须把域名加进环境变量 `SHIDAN_HOSTS`（逗号分隔多个；compose 里已配 `eat.ihxq.fun`），否则所有请求 403。

服务器**没有内置认证**，公网部署请自行前置反向代理加认证。代理环境下两个已兼容的坑（改代码别破坏）：
- SSE 长响应可能被认证代理缓冲 → 客户端自动走 `/api/wait` 长轮询兼容通道（25s 超时；旧服务器无此端点会自动禁用）
- sw.js 须在会话过期时可更新 → network-first、不缓存 API 与 Authentik 响应、安装阶段不预取

### 数据运维（data/state.json）

- 备份 = 复制 `data/state.json`
- 重置 = 停服删除该文件再重启；任一设备重开页面时被询问是否上传本机数据（可取消，不会自动播种）
- 首次部署播种：任一设备确认后把浏览器现有数据上传为共享数据

## 架构

### 模块加载（顺序敏感）

index.html 的 `<script>` 顺序即依赖顺序：

```
recipes.js → classifier.js → core.js → parser.js → storage.js → sync.js → app.js
```

每个文件都是 UMD 模块，浏览器/Node 双用：浏览器挂全局（`window.RECIPES`、`window.MealClassify`、`window.MealCore`、`window.RecipeParser`、`window.Storage`、`window.Sync`），Node 下直接 `require()`（core.js 在 Node 下依赖 `require('./classifier.js')`）。依赖方向：core.js → classifier.js；app.js 依赖其余全部；server.js 只依赖 parser.js。

### 分层职责

- **classifier.js** — 荤素/蛋白分类器：食材语义词典（词长降序最长匹配 + 组优先级消歧）+ 规则。菜名不参与判断，一切按配料说话（鱼香肉丝没鱼、素鸡里的"鸡"不算荤、可选配料不参与）。口径：肉/禽/水产/加工肉 = 荤；蛋、豆腐、干豆 = 素但算蛋白来源；蚝油/猪油/高汤等灰区默认不计荤。core.js 的 `isMeat`/`hasProtein` 全部委托它。
- **core.js** — 规划算法纯函数：库存归一化（`SYNONYMS` 同义词表）、缺料打分排序、每餐荤素约束补位、忌口辣度过滤、替代推荐（`SUBSTITUTE_GROUPS`）、5 餐/3 餐重复控制、份量换算。对外：`planWeek` / `replaceMeal` / `aggregateShopping` / `shoppingText` / `planText`。
- **parser.js** — 导入文本解析：自由文本 → 菜谱对象（分段、猜分类/用时）；`htmlToText` 供服务器链接抓取用。
- **storage.js** — localStorage 持久化 + `repairState()`：把任意来源的原始状态修复/补全成规范 7 键对象。
- **server.js** — 零依赖静态服务器：`/api/state`（GET 带 rev 条件请求 / PUT 原子落盘+rev 递增后广播）、`/api/events`（SSE）、`/api/wait`（长轮询兼容通道，25s 超时）、`/api/fetch`（网页抓取代理）、Host 白名单防 DNS rebinding（IP/localhost/单段主机名/*.local 放行，自定义域名需 `SHIDAN_HOSTS` 环境变量）。
- **sync.js** — 家庭共享客户端：SSE + 长轮询 + 定时对账三条通道并行，`fullSync()` 去重合并请求；本地优先、后写胜出（有未上传修改时先推后拉）；服务器为空时询问播种迁移。
- **app.js** — 全部 UI 与交互：持有全局可变 `state` 对象，`save()` = localStorage + `Sync.push()`；模板字符串渲染 5 个 tab。模态框打开时拒绝应用远端状态（避免顶掉编辑内容，关闭时补拉）。
- **sw.js** — Service Worker：network-first（仅网络不可用时回退缓存），`CACHE_NAME`（当前 `shidan-v14`）即版本号。

### 状态数据模型（7 键，两处强校验）

```js
{ inventory: [], customRecipes: [], disabledRecipes: [], settings: {...}, plan: null, shopping: {items: []}, cravings: [] }
```

**新增状态字段必须同时改两处**：`storage.js` 的 `repairState()`（补默认值、兼容旧数据）和 `server.js` 的 `isValidState()`（PUT 校验，缺字段直接 400 拒绝）。同步按整份 7 键全量传输，rev 由服务器递增，localStorage 降级为离线缓存。

### 菜谱数据（recipes.js）

内置菜谱库，字段说明在文件头部注释：`id`（拼音小写连字符）/ `name` / `emoji` / `category`（荤菜/素菜/蛋豆/水产/汤羹/主食/凉菜）/ `difficulty` 1~3 / `minutes` / `servings` / `tags` / `ingredients`（`{name, amount, optional}`）/ `steps`。自建菜谱、导入菜谱与内置共用此 schema，`allRecipes()` = 内置 + `state.customRecipes`；`disabledRecipes` 中的 id 不参与排菜。

**用户要加菜时用 `/add-recipe` 技能**（联网搜索 → 整理 2~3 种做法变体 → 用户选择 → 按上述结构写入 recipes.js），不要凭记忆编一份写进去。

## 关键约定（容易踩坑）

- **荤素口径**：蛋、豆腐是"素"但算蛋白来源——一荤一素里的素位可以放番茄炒蛋、家常豆腐；肉汤不进素位。判断荤素只信 `classifier.js` 的结果，不要按菜名或 category 猜（麻婆豆腐是蛋豆类但含肉末=荤）。
- **每餐约束**：默认一荤一素（主菜缺荤补荤、缺素补素），晚餐加汤；`richDinner` 开启时晚餐排满两荤一素一汤（主菜荤→配菜补一素一荤；主菜素→两个配菜都排荤）。
- **改应用文件后必须 bump `sw.js` 的 `CACHE_NAME`**（版本号 +1），否则旧缓存让改动不生效；server.js 已对 html/js/css 发 `no-cache` 头。
- `data/state.json` 是运行时数据（gitignore）：备份 = 复制该文件；重置 = 删文件重启。`persist()` 先写 tmp 再 rename，失败会回滚 rev 不广播。
- 辣度推断：`recipe.spice` 字段优先，其次 `tags`（辣=2 / 微辣=1），最后按配料名兜底（小米辣/剁椒=2、干辣椒/豆瓣酱=1）。
- 份量换算：克/毫升按 5 取整、个数按 0.5 取整；`sumAmounts` 同单位求和、否则 `+` 拼接。
- 代码、注释、UI、commit message 全中文，保持现有风格。
