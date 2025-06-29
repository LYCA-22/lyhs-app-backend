# LYHS App Backend

<div align="center">
  <h3>🏫 LYHS+ 後端服務</h3>
  <p>基於 Cloudflare Workers 和 Hono 框架構建的現代化後端 API</p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)
  [![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
</div>

## 📋 目錄

- [系統概述](#-系統概述)
- [功能特色](#-功能特色)
- [技術架構](#-技術架構)
- [快速開始](#-快速開始)
- [API 文件](#-api-文件)
- [開發指南](#-開發指南)
- [部署指南](#-部署指南)
- [錯誤處理](#-錯誤處理)
- [貢獻指南](#-貢獻指南)
- [授權協議](#-授權協議)

## 🎯 系統概述

LYHS App Backend 是林園高中應用程式的後端服務，提供學校管理系統的核心 API 功能。系統採用無伺服器架構，部署在 Cloudflare Workers 平台上，提供高效能、低延遲的 API 服務。

### 主要服務對象
- **學生**: 查看個人資訊、成績、行事曆等
- **教職員**: 管理學生資料、發布公告、維修申報等
- **管理員**: 系統管理、使用者權限控制、統計分析等

## ✨ 功能特色

### 🔐 認證與授權
- **多重登入方式**: 支援帳號密碼及 Google OAuth 登入
- **會話管理**: 基於 JWT 的安全會話機制
- **權限控制**: 細粒度的角色權限管理
- **註冊代碼**: 安全的使用者註冊流程

### 📚 核心功能模組
- **使用者管理**: 完整的使用者生命週期管理
- **行事曆系統**: 學校活動與重要日程管理
- **維修申報**: 校園設施維修申請與追蹤
- **公告系統**: 學校公告發布與管理
- **檔案管理**: 安全的檔案上傳與存取
- **學校資料整合**: 與校務系統的資料同步

### 🛠 系統特性
- **RESTful API**: 標準化的 API 設計
- **OpenAPI 規範**: 完整的 API 文件
- **統一錯誤處理**: 標準化的錯誤代碼系統
- **類型安全**: TypeScript 全覆蓋
- **高效能**: Edge Computing 架構
- **可擴展**: 模組化設計便於擴展

## 🏗 技術架構

### 核心技術棧
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Framework**: [Hono](https://hono.dev/) - 輕量級 Web 框架
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **API 規範**: [OpenAPI 3.0](https://swagger.io/specification/) with [Chanfana](https://chanfana.pages.dev/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **Storage**: [Cloudflare KV](https://developers.cloudflare.com/kv/) + [R2](https://developers.cloudflare.com/r2/)

### 依賴套件
```json
{
  "dependencies": {
    "hono": "^4.7.2",
    "chanfana": "^2.6.3",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "@aws-sdk/client-s3": "^3.777.0",
    "web-push": "^3.6.7"
  }
}
```

### 系統架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Workers       │
│   (React/Vue)   │◄──►│   (Cloudflare)  │◄──►│   (Hono)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Storage       │
                       │   (D1/SQLite)   │    │   (KV + R2)     │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 快速開始

### 環境需求
- Node.js 18+
- Yarn 1.22+
- Cloudflare CLI (Wrangler)

### 安裝與設定

1. **克隆專案**
```bash
git clone https://github.com/LYCA-22/lyhs-app-backend.git
cd lyhs-app-backend
```

2. **安裝依賴**
```bash
yarn install
```

3. **設定環境變數**
```bash
# 複製環境變數範本
cp .env.example .env

# 編輯環境變數
nano .env
```

4. **初始化資料庫**
```bash
# 建立 D1 資料庫
wrangler d1 create lycaapis-db

# 執行資料庫遷移
wrangler d1 migrations apply lycaapis-db
```

5. **啟動開發伺服器**
```bash
yarn dev
```

伺服器將在 `http://localhost:8787` 啟動

### 開發環境驗證
```bash
# 健康檢查
curl http://localhost:8787/v1/health

# API 文件
open http://localhost:8787/docs
```

## 📖 API 文件

### 在線文件
- **開發環境**: http://localhost:8787/docs
- **生產環境**: https://api.lyhsca.org/docs

### API 端點總覽

#### 🔐 認證相關
```
POST   /v1/auth/login           # 使用者登入
POST   /v1/auth/google          # Google OAuth 登入
POST   /v1/auth/logout          # 登出
GET    /v1/auth/verify          # 驗證會話
GET    /v1/auth/sessions        # 會話列表
DELETE /v1/auth/sessions/:id    # 刪除會話
```

#### 👤 使用者管理
```
GET    /v1/user/profile         # 個人資料
PUT    /v1/user/profile         # 更新資料
DELETE /v1/user/account         # 刪除帳號
POST   /v1/user/register        # 註冊使用者
```

#### 🏫 管理員功能
```
GET    /v1/admin/users          # 使用者列表
GET    /v1/admin/stats          # 系統統計
POST   /v1/admin/codes          # 建立註冊代碼
GET    /v1/admin/codes          # 註冊代碼列表
DELETE /v1/admin/codes/:id      # 刪除註冊代碼
```

#### 📅 行事曆系統
```
GET    /v1/calendar/events      # 行事曆列表
POST   /v1/calendar/events      # 新增活動
PUT    /v1/calendar/events/:id  # 更新活動
DELETE /v1/calendar/events/:id  # 刪除活動
GET    /v1/calendar/subscribe   # 訂閱行事曆
```

#### 🔧 維修申報
```
GET    /v1/repair/cases         # 維修案件列表
POST   /v1/repair/cases         # 建立維修申請
GET    /v1/repair/cases/:id     # 案件詳情
PUT    /v1/repair/cases/:id     # 更新案件
DELETE /v1/repair/cases/:id     # 刪除案件
```

#### 🔑 密碼管理
```
POST   /v1/password/forgot      # 忘記密碼
POST   /v1/password/reset       # 重設密碼
PUT    /v1/password/change      # 變更密碼
```

#### 📁 檔案管理
```
GET    /v1/files/photos         # 照片列表
POST   /v1/files/upload         # 檔案上傳
GET    /v1/files/:id            # 檔案下載
DELETE /v1/files/:id            # 刪除檔案
```

### 認證機制
API 使用 Session Id 認證：
```bash
curl -H "Session-Id: YOUR_SESSION_ID" \
     https://api.lyhsca.org/v1/user/me
```

## 🛠 開發指南

### 專案結構
```
lyhs-app-backend/
├── src/
│   ├── core/                # 核心配置
│   │   ├── openapi.ts       # OpenAPI 設定
│   │   └── info.ts          # API 資訊
│   ├── endpoints/           # API 端點
│   │   ├── auth/            # 認證相關
│   │   ├── user/            # 使用者管理
│   │   ├── admin/           # 管理功能
│   │   ├── calendar/        # 行事曆
│   │   ├── lyps/            # 學校系統整合
│   │   ├── password/        # 密碼管理
│   │   └── openfile/        # 檔案管理
│   ├── utils/               # 工具函數
│   │   ├── error.ts         # 錯誤處理
│   │   ├── errorHandler.ts  # 錯誤輔助工具
│   │   ├── verifySession.ts # 會話驗證
│   │   └── env.ts           # 環境配置
│   ├── services/            # 業務邏輯
│   ├── types/               # 型別定義
│   └── index.ts             # 應用程式入口
├── docs/                    # 文件
├── migrations/              # 資料庫遷移
├── wrangler.toml           # Cloudflare 配置
├── package.json            # 專案配置
└── tsconfig.json           # TypeScript 配置
```

### 新增 API 端點

1. **建立端點檔案**
```typescript
// src/endpoints/example/hello.ts
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { withErrorHandler } from '../../utils/errorHandler';

export class HelloWorld extends OpenAPIRoute {
    schema: OpenAPIRouteSchema = {
        summary: '問候端點',
        tags: ['範例'],
        responses: {
            '200': {
                description: '成功回應',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    };

    async handle(ctx: AppContext) {
        return withErrorHandler(async (ctx: AppContext) => {
            return ctx.json({ message: 'Hello, LYHS!' });
        })(ctx);
    }
}
```

2. **註冊端點**
```typescript
// src/endpoints/example/index.ts
import { AppRouter } from '../..';
import { HelloWorld } from './hello';

export function registerExampleEndpoints(router: AppRouter) {
    router.get('/hello', HelloWorld);
}
```

3. **加入主路由**
```typescript
// src/endpoints/index.ts
import { registerExampleEndpoints } from './example';

export function registerEndpoints() {
    const router = new Hono<AppOptions>();

    registerExampleEndpoints(router);

    return router;
}
```

### 資料庫操作

使用 D1 資料庫：
```typescript
// 查詢資料
const user = await env.DATABASE
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();

// 插入資料
const result = await env.DATABASE
    .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name, email)
    .run();

// 使用 DatabaseHelper (推薦)
import { DatabaseHelper } from '../utils/errorHandler';

const user = await DatabaseHelper.executeQuery(
    env.DATABASE.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first(),
    KnownErrorCode.USER_NOT_FOUND
);
```

### 錯誤處理

使用統一的錯誤處理系統：
```typescript
import { errorHandler, KnownErrorCode } from '../utils/error';
import { ValidationHelper } from '../utils/errorHandler';

// 拋出標準錯誤
throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);

// 驗證輸入
ValidationHelper.validateRequiredFields(data, ['email', 'password']);
ValidationHelper.validateEmail(email);
```

### 測試

```bash
# 執行測試
yarn test

# 執行特定測試
yarn test src/endpoints/auth

# 檢查程式碼品質
yarn lint
```

## 🚀 部署指南

### 部署到 Cloudflare Workers

1. **設定 Cloudflare 帳號**
```bash
# 登入 Cloudflare
wrangler auth login

# 驗證設定
wrangler whoami
```

2. **設定生產環境變數**
```bash
# 設定環境變數
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
```

3. **部署應用程式**
```bash
# 部署到生產環境
yarn deploy

# 檢查部署狀態
wrangler deployments list
```

4. **設定自訂網域**
```bash
# 新增自訂網域
wrangler custom-domains add api.lyhsca.org
```

### 環境管理

支援多環境部署：
- **開發環境**: `wrangler dev`
- **測試環境**: `wrangler deploy --env staging`
- **生產環境**: `wrangler deploy --env production`

### 監控與日誌

```bash
# 查看即時日誌
wrangler tail

# 查看分析資料
wrangler analytics
```

## 🔧 錯誤處理

### 統一錯誤格式
```json
{
  "error": {
    "code": "L2001",
    "message": "找不到使用者",
    "details": {
      "userId": "12345",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 錯誤代碼分類
- **L1xxx**: 一般錯誤 (系統錯誤、逾時等)
- **L2xxx**: 認證錯誤 (登入失敗、會話過期等)
- **L3xxx**: 授權錯誤 (權限不足、拒絕存取等)
- **L4xxx**: 驗證錯誤 (格式錯誤、必填欄位等)
- **L5xxx**: 業務邏輯錯誤 (資源不存在、狀態錯誤等)

詳細錯誤代碼請參考：[錯誤處理文件](docs/ERROR_HANDLING.md)

## 🤝 貢獻指南

### 開發流程
1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

### 程式碼規範
- 使用 TypeScript 並保持類型安全
- 遵循 ESLint 和 Prettier 規範
- 撰寫清晰的註解和文件
- 單元測試覆蓋率 > 80%

### 提交訊息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

範例：
```
feat(auth): add Google OAuth login
fix(user): resolve profile update issue
docs(readme): update API documentation
```

## 📊 效能指標

### 目標效能
- **回應時間**: < 100ms (P95)
- **可用性**: > 99.9%
- **並發處理**: > 1000 RPS
- **冷啟動**: < 50ms

### 監控工具
- Cloudflare Analytics
- Workers Analytics Engine
- Custom Metrics

## 🔒 安全性

### 安全措施
- JWT Token 認證
- HTTPS 強制使用
- CORS 設定
- 輸入驗證與清理
- 率限制保護
- SQL 注入防護

### 資料保護
- 密碼加密存儲 (bcrypt)
- 敏感資料脫敏
- 存取日誌記錄
- 定期安全審計

## 📝 授權協議

本專案採用 MIT 授權協議。詳見 [LICENSE](LICENSE) 檔案。

## 📞 聯絡資訊

- **專案維護**: LYHS 開發團隊
- **技術支援**: contact@lyhsca.org
- **問題回報**: [GitHub Issues](https://github.com/LYCA-22/lyhs-app-backend/issues)

---

<div align="center">
  <p>Made with ❤️ by LYHS Development Team</p>
  <p>© 2024 - 2025 LYHS Plus. All rights reserved.</p>
</div>
