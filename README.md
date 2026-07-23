# 通讯录管理系统

基于 React + TypeScript + Vite 的前端项目，实现登录、注册、忘记密码以及通讯录管理功能。

## 项目结构

- `src/`
  - `App.tsx`：项目入口组件，负责路由导航、登录状态管理和访问保护。
  - `main.tsx`：React 入口文件，挂载应用到 `#root`。
  - `index.css`：全局样式和基础样式重置。
  - `App.css`：应用页面样式，包括导航、表单、通讯录布局、弹窗和确认对话框样式。
  - `pages/`
    - `AuthPage.tsx`：登录、注册、忘记密码页面。
    - `ContactsPage.tsx`：通讯录页面，支持联系人列表展示、搜索、新增、编辑、删除（含确认弹窗），并使用分页接口。

- `vite.config.ts`：Vite 配置文件，设置开发服务器代理，将 `/api` 请求转发到 `http://localhost:8000`。

## 功能说明

- 登录、注册、忘记密码
- 通讯录管理：查看列表、搜索、新增、编辑、删除（删除前弹出确认框）
- 本地开发时 `/api` 请求代理到 `http://localhost:8000`
- 通讯录数据保存在浏览器本地 `localStorage`
- `/contacts` 页面受登录保护，未登录访问会自动跳回 `/auth`
- 登录或注册成功后会自动跳转到 `/contacts`

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

1. 打开浏览器访问项目地址，默认由 Vite 提供本地端口。

## 本地开发代理配置

项目已在 `vite.config.ts` 中配置本地代理：

- `/api` -> `http://localhost:8000`

前端代码中直接使用 `fetch('/api/user/login')`、`fetch('/api/user/register')`、`fetch('/api/user/forget')` 即可转发到本地后端接口。
