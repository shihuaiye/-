# pc-secondhand

基于 pnpm workspace 的 PC 校园二手交易平台。

## 目录

- `server`：Express + TypeScript + MySQL API
- `web`：React + Vite 前端
- `shared`：前后端共享类型

## 架构概览

- **鉴权**：bcrypt 密码哈希 + JWT（Bearer Token）
- **数据层**：`repositories/` 访问 MySQL
- **路由**：`server/src/routes/` 按模块拆分
- **前端**：`hooks/` 管理状态，`VITE_API_URL` 配置 API 地址

## 快速启动

```bash
pnpm install
```

### 数据库

1. 安装 MySQL，创建库（或由程序自动创建）`secondhand`
2. 复制 `server/.env.example` 为 `server/.env` 并填写数据库密码与 `JWT_SECRET`
3. 可选：复制 `web/.env.example` 为 `web/.env` 修改 API 地址

```bash
cd server
pnpm migrate   # 仅在有旧 JSON 备份时需要
cd ..
pnpm dev
```

- API: `http://localhost:3100`
- Web: `http://localhost:5174`

## 测试账号（首次启动自动初始化）

- 管理员：`admin` / `admin123`
- 普通用户：`user01` / `user123`

## 功能亮点

- 商品审核、订单流、私信、收藏、卖家诚信分
- 私信快捷回复（内置 + 用户自定义）
- 首页智能推荐（分类偏好、收藏、上新时间等多因子打分）
