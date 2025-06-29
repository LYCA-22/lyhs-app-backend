# LYHS 錯誤處理系統命名變更總結

## 變更概述

本文件記錄了 LYHS 後端錯誤處理系統的命名變更，從原本的 `LyhsError` 系統更新為 `errorHandler` 系統。

## 主要變更

### 1. 類別名稱變更

| 舊名稱 | 新名稱 | 說明 |
|--------|--------|------|
| `LyhsError` | `errorHandler` | 主要錯誤處理類別 |

### 2. 函數名稱變更

| 舊名稱 | 新名稱 | 說明 |
|--------|--------|------|
| `throwLyhsError()` | `throwErrorHandler()` | 拋出錯誤的輔助函數 |
| `isLyhsError()` | `isErrorHandler()` | 檢查錯誤類型的函數 |

### 3. 變數和引用變更

| 舊引用 | 新引用 | 檔案位置 |
|--------|--------|----------|
| `import { LyhsError }` | `import { errorHandler }` | 所有 TypeScript 檔案 |
| `new LyhsError()` | `new errorHandler()` | 所有錯誤實例化 |
| `isLyhsError(error)` | `isErrorHandler(error)` | 錯誤檢查函數調用 |

## 受影響的檔案

### 核心檔案
- `src/utils/error.ts` - 主要錯誤處理系統
- `src/utils/errorHandler.ts` - 錯誤處理輔助工具

### 端點檔案
- `src/endpoints/user/staff/deleteCode.ts` - 刪除註冊代碼端點

### 文件檔案
- `docs/ERROR_HANDLING.md` - 錯誤處理使用指南
- `docs/ERROR_MIGRATION_EXAMPLES.md` - 遷移範例文件
- `README.md` - 專案說明文件

## 變更詳情

### 1. 錯誤類別定義

**舊版本:**
```typescript
export class LyhsError extends Error {
    public readonly code: KnownErrorCode;
    public readonly statusCode: ContentfulStatusCode;
    public readonly details?: any;

    constructor(code: KnownErrorCode, details?: any) {
        const message = ErrorMessages[code];
        super(message);
        this.name = 'LyhsError';
        // ...
    }
}
```

**新版本:**
```typescript
export class errorHandler extends Error {
    public readonly code: KnownErrorCode;
    public readonly statusCode: ContentfulStatusCode;
    public readonly details?: any;

    constructor(code: KnownErrorCode, details?: any) {
        const message = ErrorMessages[code];
        super(message);
        this.name = 'errorHandler';
        // ...
    }
}
```

### 2. 錯誤拋出方式

**舊版本:**
```typescript
throw new LyhsError(KnownErrorCode.USER_NOT_FOUND);
```

**新版本:**
```typescript
throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);
```

### 3. 錯誤檢查方式

**舊版本:**
```typescript
if (isLyhsError(error)) {
    return ctx.json(error.toJSON(), error.statusCode);
}
```

**新版本:**
```typescript
if (isErrorHandler(error)) {
    return ctx.json(error.toJSON(), error.statusCode);
}
```

### 4. 導入聲明

**舊版本:**
```typescript
import { LyhsError, KnownErrorCode } from '../utils/error';
```

**新版本:**
```typescript
import { errorHandler, KnownErrorCode } from '../utils/error';
```

## 驗證檢查

### 編譯檢查
所有 TypeScript 檔案編譯無錯誤：
```bash
✅ No errors or warnings found in the project.
```

### 搜尋檢查
確認沒有遺留的舊命名：
```bash
✅ 沒有找到 "LyhsError" 引用
✅ 沒有找到 "isLyhsError" 引用
✅ 沒有找到 "throwLyhsError" 引用
```

## 向後相容性

### 不相容變更
- 所有直接使用 `LyhsError` 的程式碼需要更新為 `errorHandler`
- 錯誤檢查函數 `isLyhsError()` 需要更新為 `isErrorHandler()`

### API 回應格式
錯誤回應格式保持不變：
```json
{
  "error": {
    "code": "L2001",
    "message": "找不到使用者",
    "details": {
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 遷移指南

### 對於現有程式碼
1. 將所有 `LyhsError` 替換為 `errorHandler`
2. 將所有 `isLyhsError` 替換為 `isErrorHandler`
3. 將所有 `throwLyhsError` 替換為 `throwErrorHandler`
4. 更新導入聲明

### 搜尋和替換
可以使用以下正則表達式進行批量替換：
```bash
# 類別名稱
LyhsError → errorHandler

# 函數名稱
isLyhsError → isErrorHandler
throwLyhsError → throwErrorHandler

# 導入聲明
import { LyhsError → import { errorHandler
```

## 注意事項

### 保持一致性
- 所有新程式碼都應使用 `errorHandler` 命名
- 確保文件和註解也使用新的命名約定
- 測試檔案也需要相應更新

### 文件更新
- API 文件已更新使用新的命名
- 範例程式碼已全部更新
- README 和開發指南已同步更新

## 完成狀態

- ✅ 核心錯誤處理系統已更新
- ✅ 所有端點檔案已更新
- ✅ 輔助工具函數已更新
- ✅ 文件和範例已更新
- ✅ TypeScript 編譯通過
- ✅ 無遺留舊命名引用

## 相關文件

- [錯誤處理系統文件](./ERROR_HANDLING.md)
- [錯誤遷移範例](./ERROR_MIGRATION_EXAMPLES.md)
- [錯誤代碼總結](./ERROR_CODES_SUMMARY.md)

---

**變更日期**: 2024-01-15  
**執行者**: LYHS 開發團隊  
**版本**: 1.0  

*本次變更確保了錯誤處理系統的命名一致性，提升了程式碼的可讀性和維護性。*