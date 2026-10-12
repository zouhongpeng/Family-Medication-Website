# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 项目：全家用药小管家（Medicine Manager）

手机端优先的 SPA，帮家庭管理长辈用药（定位「整理 + 提醒」，不做诊断）。苹果极简风，强调色为安心蓝绿（teal）。无登录，数据全部存 `localStorage`。

### 业务结构（移动端 3 Tab）
- 家人：`src/components/home-view.tsx`（头像+称呼卡片，增删，进入档案）
- 今日：`src/components/today-view.tsx`（按时间序、打勾持久、浏览器到点通知）
- 清单：`src/components/meds-view.tsx`（手动添加 + 拍照识别确认 + 相互作用 + 就医出示）

### 数据层
- `src/lib/types.ts`：Profile / Medicine / InteractionItem / AppState 类型
- `src/lib/store.tsx`：React Context + localStorage（key `med-mgr:v1`），含档案/药品/服药打卡增删改
- 家人档案数据隔离：Medicine 与 Profile 通过 `profileId` 关联
- 今日打卡：`taken[dateStr]` 数组存 `${medId}|${time}`

### 后端 API（仅服务端，模型走 coze-coding-dev-sdk）
- `POST /api/recognize`：拍照识别药盒（视觉模型 doubao-seed-2-0-pro-260215），返回待确认草稿，**前端必须经用户确认后才入库**
- `POST /api/interaction`：多口服药同服注意（口服 ≥2 时才调用模型，否则返回空数组）

### 注意事项
- SDK 必须 `HeaderUtils.extractForwardHeaders(request.headers)` 转发头
- 当前开发环境模型网关可能返回 `ErrBalanceOverdue`（平台层余额/配额拦截，非代码问题）：请先确认模型额度可用后再联调 AI 功能；接口在不可用时应降级返回友好错误，不要伪造成功结果
- AI 输出统一带免责标注「AI 参考信息，非医疗建议，请遵医嘱」
