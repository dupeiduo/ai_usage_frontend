# AI Usage Frontend

这是一个基于 React + TypeScript + Vite 的前端项目，已实现：登录、注册、忘记密码以及通讯录管理功能。

## 项目结构

- `src/`
  - `App.tsx`：项目入口组件，负责路由导航和页面切换。
  - `main.tsx`：React 入口文件，挂载应用到 `#root`。
  - `index.css`：全局样式和基础样式重置。
  - `App.css`：应用页面样式，包括导航、表单和通讯录布局。
  - `pages/`
    - `AuthPage.tsx`：登录、注册、忘记密码页面，实现对 `/api/user/login`、`/api/user/register` 和 `/api/user/forget` 的请求。
    - `ContactsPage.tsx`：通讯录页面，支持联系人列表展示、搜索、新增、编辑、删除。

- `vite.config.ts`：Vite 配置文件，设置开发服务器代理，将 `/api` 请求转发到 `http://localhost:8000`。
- `.env.development`：开发环境变量文件，可用于扩展 API 基础地址或其他开发配置。
- `README.md`：当前项目说明文档。

## 功能说明

- 登录、注册、忘记密码页面
- 通讯录页面：查看列表、搜索、新增、编辑、删除
- 本地开发时 `/api` 请求代理到 `http://localhost:8000`
- 通讯录数据保存在浏览器本地 `localStorage`

## 主要页面路由

- `/auth`：登录、注册、忘记密码页面。
- `/contacts`：通讯录管理页面。

## 使用说明

1. 安装依赖：

```bash
npm install
```

1. 启动开发服务器：

```bash
npm run dev
```

1. 打开浏览器访问项目地址，默认会由 Vite 提供本地端口。

## 本地开发代理配置

项目已在 `vite.config.ts` 中配置本地代理：

- `/api` -> `http://localhost:8000`

因此前端代码中直接使用 `fetch('/api/user/login')`、`fetch('/api/user/register')`、`fetch('/api/user/forget')` 即可转发到本地后端接口。

## 关键文件说明

- `src/App.tsx`
  - 配置 `react-router-dom` 路由。
  - 提供顶部导航链接。

- `src/pages/AuthPage.tsx`
  - 提供三种模式：登录、注册、忘记密码。
  - 使用 `fetch` 向后端接口发送请求。

- `src/pages/ContactsPage.tsx`
  - 使用本地 `localStorage` 保存联系人数据。
  - 提供联系人搜索、编辑、新增、删除功能。

- `vite.config.ts`
  - 搭建开发代理，避免跨域问题。

- `.env.development`
  - 开发环境变量文件，可用于未来扩展配置。
