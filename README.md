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
pnpm dev
```
## TOdolist
当前代办任务：（后面加括号示意谁正在完成任务，任务进度）（示例：xxx 正在做/xxx已完成）
-'迁移数据库，当前使用jason文件保存'
-修改:建议迁移到MySQL数据库
-'优化排序逻辑，当前无论怎么排序都是越近的越靠前'
-修改：建议增加一个距离由近到远排序，已经有价格升序降序


- API: `http://localhost:3100`
- Web: `http://localhost:5174`

## 测试账号（首次启动自动初始化）

- 管理员：`admin / admin123`
