# DPD-AI 应用系统

基于 React + TypeScript + Vite 的前端项目，实现用户认证、通讯录管理和 AI 聊天功能。

[首版演示视频](./首个版本演示.mov)

## 项目结构

```text
src/
├── App.tsx                 # 入口组件 — 路由、登录态、401 全局拦截
├── App.css                 # 全局样式（导航、表单、通讯录、聊天、弹窗）
├── api.ts                  # 统一 API 封装（自动注入 Bearer token、401 拦截）
├── index.css               # CSS 重置与全局基础样式
├── main.tsx                # ReactDOM 挂载入口
└── pages/
    ├── AuthPage.tsx         # 登录 / 注册 / 忘记密码
    ├── ContactsPage.tsx     # 通讯录（分页、搜索、新增、编辑、删除）
    └── ChatPage.tsx         # AI 聊天（多会话、流式响应、Markdown 渲染）
```

配置文件：

- `vite.config.ts` — Vite 配置，`/api` 代理到 `http://localhost:8000`

## 功能说明

### 用户认证

- 登录、注册、忘记密码
- JWT token 存储于 `localStorage`
- 全局 401 响应自动登出并跳转登录页
- 所有 API 请求自动携带 `Authorization: Bearer <token>`

### 通讯录

- 分页列表，支持搜索姓名、电话、邮箱、地址、社交账号
- 新增 / 编辑（模态框表单）/ 删除（确认弹窗）
- 路由 `/contacts` 受登录保护

### AI 聊天

- 左侧多会话管理（新建、切换、删除），数据持久化至 `localStorage`
- 与后端 `/api/chat/send-stream` SSE 流式接口对接
- Markdown 渲染：标题、加粗、链接、图片、行内代码、代码块（语法高亮 + 一键复制）
- Enter 发送、Shift+Enter 换行，自动滚动到底部
- 打字动画等待指示器

## 路由

| 路径 | 页面 | 登录保护 |
| ---- | ---- | -------- |
| `/auth` | 登录 / 注册 / 忘记密码 | 否（已登录自动跳转 `/contacts`） |
| `/contacts` | 通讯录管理 | 是 |
| `/chat` | AI 聊天 | 是 |
| `/` | 默认跳转至 `/auth` | — |

## 使用说明

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 本地开发代理

`vite.config.ts` 已配置：

```text
/api  →  http://localhost:8000
```

前端请求 `/api/user/login`、`/api/contact/list`、`/api/chat/send-stream` 等均自动转发到本地后端。
