# pc-secondhand

基于现有技术栈拆出的 PC 校园二手交易平台（起步版）。

## 目录

- `server`：Express + TypeScript API（文件存储）
- `web`：React + Vite PC 端页面（基础壳）
- `shared`：前后端共享类型

## 已实现（MVP 起步）

- 认证：登录、注册（仅 `admin` / `seller`）
- 商品：发布、列表、审核（通过/拒绝）、下线/恢复
- 下线为软下线，可恢复

## 快速启动

```bash(在所属文件夹中打开终端）
pnpm install
npm install mysql2
pnpm dev
```

- 注意：电脑首先要已经安装MYSQL
- 然后修改：db.ts （4-10行）
- const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",（root改为自己的数据库名字）
  password: process.env.DB_PASSWORD || "xxxx",(把xxx改为自己数据库密码）
  database: process.env.DB_NAME || "secondhand",
  };
- 同理更新 migrate.ts 中（6-11）行的密码
- 然后：cd f:\secondhand\-\server;
- pnpm migrate
- 这一步是完成数据的迁移，然后就可以正常在server和web下pnpm dev启动程序了

## TOdolist

当前代办任务：

- 样式方面：个人中心页面使用的颜色需修改、我的收藏界面美化；
- 优化：设置“可小刀”等快捷回复,商品广场查看商品详情的时候点击卖家可以显示卖家的一些基本信息，比如诚信分啥的
- API: `http://localhost:3100`
- Web: `http://localhost:5174`

## 测试账号（首次启动自动初始化）

- 管理员：`admin / admin123`
