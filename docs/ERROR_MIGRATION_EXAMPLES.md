# LYHS 錯誤處理系統遷移範例

本文件提供將現有端點遷移到新錯誤處理系統的具體範例。

## 遷移前後對比

### 範例 1: 使用者登入端點

#### 遷移前 (舊版本)
```typescript
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

export class userLogin extends OpenAPIRoute {
    async handle(ctx: AppContext) {
        const { email, password, loginType } = await ctx.req.json();

        try {
            if (!password || !email || !loginType) {
                return ctx.json({ error: 'Require data is missing' }, 400);
            }

            if (loginType != 'APP' && loginType != 'WEB') {
                return ctx.json({ error: 'Invalid login type' }, 400);
            }

            const user = await env.DATABASE.prepare('SELECT * FROM users WHERE email = ?')
                .bind(email).first();

            if (!user) {
                return ctx.json({ error: 'User not found' }, 404);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return ctx.json({ error: 'Invalid password' }, 401);
            }

            // 成功邏輯...
            return ctx.json({ sessionId: newSessionId }, 200);

        } catch (error) {
            console.error('Error during login:', error);
            return ctx.json({ error: 'Internal server error' }, 500);
        }
    }
}
```

#### 遷移後 (新版本)
```typescript
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { withErrorHandler, ValidationHelper, AuthorizationHelper, DatabaseHelper } from '../../../utils/errorHandler';
import bcrypt from 'bcrypt';

export class userLogin extends OpenAPIRoute {
    schema: OpenAPIRouteSchema = {
        // ... 原有的 schema 定義
        responses: {
            '200': {
                description: '登入成功',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                sessionId: { type: 'string' }
                            }
                        }
                    }
                }
            },
            '400': {
                description: '請求資料格式錯誤',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        code: { type: 'string', example: 'L4000' },
                                        message: { type: 'string', example: '缺少必填欄位' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '401': {
                description: '認證失敗',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        code: { type: 'string', example: 'L2000' },
                                        message: { type: 'string', example: '帳號或密碼錯誤' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '404': {
                description: '找不到使用者',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        code: { type: 'string', example: 'L2001' },
                                        message: { type: 'string', example: '找不到使用者' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    async handle(ctx: AppContext) {
        return withErrorHandler(async (ctx: AppContext) => {
            const { email, password, loginType } = await ctx.req.json();
            const env = ctx.env;

            // 驗證必填欄位
            ValidationHelper.validateRequiredFields(
                { email, password, loginType },
                ['email', 'password', 'loginType']
            );

            // 驗證格式
            ValidationHelper.validateEmail(email);
            ValidationHelper.validateLoginType(loginType);

            // 查詢使用者
            const user = await DatabaseHelper.executeQuery(
                env.DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first(),
                KnownErrorCode.USER_NOT_FOUND
            );

            // 驗證密碼
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new errorHandler(KnownErrorCode.INVALID_PASSWORD);
            }

            // 生成會話 (省略實現細節)
            const newSessionId = await generateSession(user.id, loginType);

            return ctx.json({ sessionId: newSessionId }, 200);
        })(ctx);
    }
}
```

### 範例 2: 檔案上傳端點

#### 遷移前 (舊版本)
```typescript
export class fileUpload extends OpenAPIRoute {
    async handle(ctx: AppContext) {
        try {
            const formData = await ctx.req.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return ctx.json({ error: '沒有上傳檔案' }, 400);
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB
                return ctx.json({ error: '檔案大小超過限制' }, 400);
            }

            const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (!fileExtension || !allowedTypes.includes(fileExtension)) {
                return ctx.json({ error: '不支援的檔案類型' }, 400);
            }

            // 上傳檔案...
            return ctx.json({ fileUrl: uploadedUrl }, 200);

        } catch (error) {
            console.error('檔案上傳錯誤:', error);
            return ctx.json({ error: '檔案上傳失敗' }, 500);
        }
    }
}
```

#### 遷移後 (新版本)
```typescript
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { withErrorHandler, ValidationHelper } from '../../../utils/errorHandler';

export class fileUpload extends OpenAPIRoute {
    async handle(ctx: AppContext) {
        return withErrorHandler(async (ctx: AppContext) => {
            const formData = await ctx.req.formData();
            const file = formData.get('file') as File;

            // 驗證檔案存在
            if (!file) {
                throw new LyhsError(KnownErrorCode.MISSING_REQUIRED_FIELDS, {
                    missingFields: ['file']
                });
            }

            // 驗證檔案大小 (10MB)
            const maxSize = 10 * 1024 * 1024;
            ValidationHelper.validateFileSize(file.size, maxSize);

            // 驗證檔案類型
            const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
            ValidationHelper.validateFileType(file.name, allowedTypes);

            // 上傳檔案
            let uploadedUrl: string;
            try {
                uploadedUrl = await uploadFileToStorage(file);
            } catch (error) {
                throw new errorHandler(KnownErrorCode.FILE_UPLOAD_FAILED, {
                    filename: file.name,
                    size: file.size,
                    originalError: error
                });
            }

            return ctx.json({
                fileUrl: uploadedUrl,
                filename: file.name,
                size: file.size
            }, 200);
        })(ctx);
    }
}
```

## 遷移檢查清單

### 1. 基本結構更新
- [ ] 導入必要的錯誤處理模組
- [ ] 使用 `withErrorHandler` 包裝主要邏輯
- [ ] 移除 try-catch 塊（由錯誤處理器處理）

### 2. 輸入驗證
- [ ] 使用 `ValidationHelper.validateRequiredFields()` 替換手動檢查
- [ ] 使用專用驗證函數（email、studentId 等）
- [ ] 移除硬編碼的錯誤訊息

### 3. 資料庫操作
- [ ] 使用 `DatabaseHelper.executeQuery()` 包裝查詢
- [ ] 使用 `DatabaseHelper.executeTransaction()` 處理交易
- [ ] 指定適當的 `notFoundError` 參數

### 4. 業務邏輯驗證
- [ ] 使用 `AuthorizationHelper` 檢查權限
- [ ] 使用 `BusinessLogicHelper` 檢查業務規則
- [ ] 拋出具體的 `LyhsError` 而非通用錯誤

### 5. 錯誤回應格式
- [ ] 更新 OpenAPI schema 使用新的錯誤格式
- [ ] 確保所有錯誤都包含 `code` 和 `message`
- [ ] 添加有用的 `details` 資訊

### 6. 測試更新
- [ ] 更新單元測試以檢查新的錯誤格式
- [ ] 測試各種錯誤情況
- [ ] 驗證錯誤代碼和狀態碼正確對應

## 常見遷移模式

### 模式 1: 簡單欄位驗證
```typescript
// 舊版本
if (!email || !password) {
    return ctx.json({ error: 'Missing required fields' }, 400);
}

// 新版本
ValidationHelper.validateRequiredFields(
    { email, password },
    ['email', 'password']
);
```

### 模式 2: 資料庫查詢
```typescript
// 舊版本
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
if (!user) {
    return ctx.json({ error: 'User not found' }, 404);
}

// 新版本
const user = await DatabaseHelper.executeQuery(
    db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first(),
    KnownErrorCode.USER_NOT_FOUND
);
```

### 模式 3: 權限檢查
```typescript
// 舊版本
if (userLevel !== 'A1') {
    return ctx.json({ error: 'Unauthorized' }, 403);
}

// 新版本
AuthorizationHelper.requireAdmin(userLevel);
```

### 模式 4: 業務邏輯錯誤
```typescript
// 舊版本
if (repairCase.status === 'closed') {
    return ctx.json({ error: 'Repair case is closed' }, 400);
}

// 新版本
if (repairCase.status === 'closed') {
    throw new errorHandler(KnownErrorCode.REPAIR_CASE_CLOSED);
}
```

## 遷移後的優勢

1. **一致性**: 所有錯誤都使用統一的格式和代碼
2. **可維護性**: 錯誤訊息集中管理，易於更新
3. **可追蹤性**: 每個錯誤都有唯一代碼便於追蹤
4. **國際化**: 錯誤訊息支援多語言（目前為繁體中文）
5. **偵錯友善**: 詳細的錯誤資訊幫助快速定位問題
6. **類型安全**: TypeScript 支援，減少運行時錯誤

## 注意事項

1. **向後相容性**: 遷移時注意不要破壞現有 API 契約
2. **錯誤詳情**: 避免在錯誤詳情中洩露敏感資訊
3. **效能影響**: 新的錯誤處理系統對效能影響微乎其微
4. **日誌記錄**: 確保重要錯誤仍然被正確記錄
5. **測試覆蓋**: 更新測試以涵蓋新的錯誤格式

## 相關文件

- [錯誤處理系統文件](./ERROR_HANDLING.md)
- [API 規範](../openapi.yaml)
- [開發指南](./DEVELOPMENT_GUIDE.md)
