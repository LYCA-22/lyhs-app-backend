# LYHS 後端錯誤處理系統文件

## 概述

LYHS 後端使用統一的錯誤處理系統，提供標準化的錯誤代碼、訊息和 HTTP 狀態碼。所有錯誤代碼都以 `L` 開頭，後跟四位數字，便於識別和追蹤。

## 錯誤代碼結構

錯誤代碼格式：`LXXXX`
- `L`：代表 LYHS
- `XXXX`：四位數字，表示錯誤類型和具體錯誤

### 錯誤代碼範圍

| 範圍 | 類型 | 說明 |
|------|------|------|
| 1000-1999 | 一般錯誤 | 系統級別的通用錯誤 |
| 2000-2999 | 認證錯誤 | 身份驗證相關錯誤 |
| 3000-3999 | 授權錯誤 | 權限不足相關錯誤 |
| 4000-4999 | 驗證錯誤 | 資料格式驗證錯誤 |
| 5000-5999 | 業務邏輯錯誤 | 應用程式邏輯錯誤 |
| 6000-6999 | 資料庫錯誤 | 資料庫操作錯誤 |
| 7000-7999 | 外部服務錯誤 | 第三方服務錯誤 |
| 8000-8999 | 檔案/媒體錯誤 | 檔案處理相關錯誤 |
| 9000-9999 | 系統錯誤 | 系統配置和維護錯誤 |

## 常用錯誤代碼

### 一般錯誤 (1000-1999)
- `L1000`: 發生未知錯誤
- `L1001`: 內部伺服器錯誤
- `L1002`: 服務暫時無法使用
- `L1003`: 請求逾時
- `L1004`: 請求頻率過高

### 認證錯誤 (2000-2999)
- `L2000`: 帳號或密碼錯誤
- `L2001`: 找不到使用者
- `L2002`: 密碼錯誤
- `L2005`: 登入狀態已過期
- `L2006`: 找不到登入狀態
- `L2009`: Google 驗證失敗
- `L2012`: 無效的登入類型

### 授權錯誤 (3000-3999)
- `L3000`: 拒絕存取
- `L3001`: 權限不足
- `L3003`: 需要管理員權限
- `L3004`: 需要工作人員權限
- `L3005`: 帳號等級不足

### 驗證錯誤 (4000-4999)
- `L4000`: 缺少必填欄位
- `L4001`: 請求格式錯誤
- `L4002`: 電子郵件格式錯誤
- `L4004`: 學號格式錯誤
- `L4009`: 等級值錯誤

### 業務邏輯錯誤 (5000-5999)
- `L5000`: 找不到註冊代碼
- `L5001`: 註冊代碼已過期
- `L5003`: 使用者已存在
- `L5004`: 找不到活動
- `L5008`: 找不到維修案件
- `L5009`: 維修案件已結案
- `L5010`: 找不到行事曆活動
- `L5020`: 找不到 PCS 專案
- `L5021`: 找不到 SRM 資源

## 使用方式

### 1. 拋出 LYHS 錯誤

```typescript
import { errorHandler, KnownErrorCode } from '../utils/error';

// 基本用法
throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);

// 包含詳細資訊
throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS, {
    missingFields: ['email', 'password']
});
```

### 2. 使用錯誤處理包裝器

```typescript
import { withErrorHandler } from '../utils/errorHandler';

export class MyEndpoint extends OpenAPIRoute {
    async handle(ctx: AppContext) {
        return withErrorHandler(async (ctx: AppContext) => {
            // 你的業務邏輯
            const userData = await getUserData(ctx);
            return ctx.json({ data: userData });
        })(ctx);
    }
}
```

### 3. 使用驗證輔助函數

```typescript
import { ValidationHelper } from '../utils/errorHandler';

// 驗證必填欄位
ValidationHelper.validateRequiredFields(requestData, ['email', 'password']);

// 驗證電子郵件格式
ValidationHelper.validateEmail(email);

// 驗證學號格式
ValidationHelper.validateStudentId(studentId);

// 驗證等級
ValidationHelper.validateLevel(level);

// 驗證登入類型
ValidationHelper.validateLoginType(loginType);
```

### 4. 使用授權輔助函數

```typescript
import { AuthorizationHelper } from '../utils/errorHandler';

// 檢查使用者存在
AuthorizationHelper.requireUser(userData);

// 檢查管理員權限
AuthorizationHelper.requireAdmin(userLevel);

// 檢查工作人員權限
AuthorizationHelper.requireStaff(userType);
```

### 5. 使用資料庫輔助函數

```typescript
import { DatabaseHelper } from '../utils/errorHandler';

// 執行查詢並自動處理錯誤
const userData = await DatabaseHelper.executeQuery(
    env.DATABASE.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first(),
    KnownErrorCode.USER_NOT_FOUND
);

// 執行交易
const result = await DatabaseHelper.executeTransaction(async () => {
    // 你的交易邏輯
    await insertUser(userData);
    await updateStats();
    return { success: true };
});
```

## 錯誤回應格式

所有錯誤回應都遵循統一格式：

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

### 欄位說明
- `code`: LYHS 錯誤代碼
- `message`: 中文錯誤訊息
- `details`: 可選的詳細資訊物件

## OpenAPI Schema 定義

在 OpenAPI schema 中定義錯誤回應：

```typescript
responses: {
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
                                code: {
                                    type: 'string',
                                    example: 'L4000',
                                },
                                message: {
                                    type: 'string',
                                    example: '缺少必填欄位',
                                },
                                details: {
                                    type: 'object',
                                    example: {
                                        missingFields: ['email', 'password']
                                    }
                                }
                            },
                        },
                    },
                },
            },
        },
    },
}
```

## 最佳實踐

### 1. 統一錯誤處理
所有端點都應使用 `withErrorHandler` 包裝器：

```typescript
async handle(ctx: AppContext) {
    return withErrorHandler(async (ctx: AppContext) => {
        // 業務邏輯
    })(ctx);
}
```

### 2. 早期驗證
在處理業務邏輯之前先進行所有驗證：

```typescript
// 驗證輸入
ValidationHelper.validateRequiredFields(data, ['email', 'password']);
ValidationHelper.validateEmail(data.email);

// 驗證權限
AuthorizationHelper.requireUser(userData);
AuthorizationHelper.requireAdmin(userData.level);

// 執行業務邏輯
const result = await performBusinessLogic(data);
```

### 3. 有意義的錯誤詳情
提供有助於偵錯的詳細資訊：

```typescript
throw new errorHandler(KnownErrorCode.INVALID_REQUEST_FORMAT, {
    reason: 'Invalid data format',
    receivedData: data
});
```

### 4. 記錄錯誤
重要錯誤應該記錄到日誌：

```typescript
try {
    // 業務邏輯
} catch (error) {
    console.error('Critical error in user registration:', error);
    throw new LyhsError(KnownErrorCode.INTERNAL_SERVER_ERROR);
}
```

## 測試

### 錯誤情況測試範例

```typescript
import { errorHandler, KnownErrorCode } from '../utils/error';

describe('User Registration', () => {
    it('should throw error when email is invalid', () => {
        expect(() => {
            ValidationHelper.validateEmail('invalid-email');
        }).toThrow(new errorHandler(KnownErrorCode.INVALID_EMAIL_FORMAT));
    });

    it('should throw error when user not found', async () => {
        const userData = null;
        expect(() => {
            AuthorizationHelper.requireUser(userData);
        }).toThrow(new errorHandler(KnownErrorCode.USER_NOT_FOUND));
    });
});
```

## 錯誤監控

建議設置錯誤監控來追蹤錯誤發生頻率：

```typescript
// 在 globalErrorHandler 中添加監控
export async function globalErrorHandler(error: Error | errorHandler, ctx: Context) {
    if (isErrorHandler(error)) {
        // 發送錯誤到監控系統
        await sendErrorToMonitoring({
            code: error.code,
            message: error.message,
            endpoint: ctx.req.url,
            timestamp: new Date().toISOString(),
            details: error.details
        });
    }
    
    return ctx.json(error.toJSON(), error.statusCode);
}
```

## 常見問題

### Q: 如何添加新的錯誤代碼？
A: 在 `KnownErrorCode` 枚舉中添加新代碼，並在 `ErrorMessages` 和 `ErrorStatusCodes` 中添加對應的訊息和狀態碼。

### Q: 如何處理第三方 API 錯誤？
A: 使用 `ExternalServiceHelper` 中的方法，或創建新的 errorHandler 錯誤包裝原始錯誤。

### Q: 錯誤詳情應該包含什麼資訊？
A: 包含有助於偵錯的資訊，但避免洩露敏感資料。建議包含：操作類型、相關 ID、時間戳等。

### Q: 如何確保錯誤訊息的一致性？
A: 所有錯誤訊息都在 `ErrorMessages` 中統一管理，避免在程式碼中硬編碼錯誤訊息。