import { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppContext } from '..';

/**
 * Known error codes.
 *
 * The error code is a string in format of "LXXXX", where L is a letter stand for LYHS and XXXX is four numbers.
 *
 * The range of XXXX is from 1000 to 9999.
 *
 * 1000 ~ 1999: General errors
 * 2000 ~ 2999: Authentication errors
 * 3000 ~ 3999: Authorization errors
 * 4000 ~ 4999: Validation errors
 * 5000 ~ 5999: Business logic errors
 * 6000 ~ 6999: Database errors
 * 7000 ~ 7999: External service errors
 * 8000 ~ 8999: File/Media errors
 * 9000 ~ 9999: System errors
 * */
export enum KnownErrorCode {
	// General errors (1000-1999) 一般錯誤
	UNKNOWN_ERROR = 'L1000',
	INTERNAL_SERVER_ERROR = 'L1001',
	SERVICE_UNAVAILABLE = 'L1002',
	REQUEST_TIMEOUT = 'L1003',
	RATE_LIMIT_EXCEEDED = 'L1004',

	// Authentication errors (2000-2999)
	INVALID_CREDENTIALS = 'L2000',
	USER_NOT_FOUND = 'L2001',
	INVALID_PASSWORD = 'L2002',
	ACCOUNT_LOCKED = 'L2003',
	ACCOUNT_DISABLED = 'L2004',
	SESSION_EXPIRED = 'L2005',
	SESSION_NOT_FOUND = 'L2006',
	INVALID_SESSION = 'L2007',
	LOGIN_REQUIRED = 'L2008',
	GOOGLE_AUTH_FAILED = 'L2009',
	INVALID_AUTH_TOKEN = 'L2010',
	TOKEN_EXPIRED = 'L2011',
	INVALID_LOGIN_TYPE = 'L2012',
	SESSION_IP_MISMATCH = 'L2013',
	MALFORMED_SESSION_DATA = 'L2014',

	// Authorization errors (3000-3999)
	FORBIDDEN = 'L3000',
	INSUFFICIENT_PERMISSIONS = 'L3001',
	UNAUTHORIZED_ACCESS = 'L3002',
	ADMIN_REQUIRED = 'L3003',
	STAFF_REQUIRED = 'L3004',
	ACCOUNT_LEVEL_INSUFFICIENT = 'L3005',
	RESOURCE_ACCESS_DENIED = 'L3006',

	// Validation errors (4000-4999)
	MISSING_REQUIRED_FIELDS = 'L4000',
	INVALID_REQUEST_FORMAT = 'L4001',
	INVALID_EMAIL_FORMAT = 'L4002',
	INVALID_PASSWORD_FORMAT = 'L4003',
	INVALID_STUDENT_ID = 'L4004',
	INVALID_CLASS_FORMAT = 'L4005',
	INVALID_PHONE_NUMBER = 'L4006',
	INVALID_DATE_FORMAT = 'L4007',
	INVALID_TIME_FORMAT = 'L4008',
	INVALID_LEVEL_VALUE = 'L4009',
	INVALID_VULI_VALUE = 'L4010',
	INVALID_EVENT_TYPE = 'L4011',
	INVALID_REPAIR_TYPE = 'L4012',
	INVALID_PROGRESS_STATUS = 'L4013',
	INVALID_FILE_TYPE = 'L4014',
	FILE_SIZE_TOO_LARGE = 'L4015',
	INVALID_QUERY_PARAMETERS = 'L4016',

	// Business logic errors (5000-5999)
	REGISTRATION_CODE_NOT_FOUND = 'L5000',
	REGISTRATION_CODE_EXPIRED = 'L5001',
	REGISTRATION_CODE_USED = 'L5002',
	USER_ALREADY_EXISTS = 'L5003',
	EVENT_NOT_FOUND = 'L5004',
	REPAIR_CASE_NOT_FOUND = 'L5008',
	REPAIR_CASE_CLOSED = 'L5009',
	CALENDAR_EVENT_NOT_FOUND = 'L5010',
	CALENDAR_EVENT_CONFLICT = 'L5011',
	ANNOUNCEMENT_NOT_FOUND = 'L5012',
	SCHOOL_DATA_NOT_FOUND = 'L5013',
	INVALID_SCHOOL_SESSION = 'L5014',
	PASSWORD_RESET_TOKEN_INVALID = 'L5015',
	PASSWORD_RESET_TOKEN_EXPIRED = 'L5016',
	PCS_PROJECT_NOT_FOUND = 'L5020',
	SRM_RESOURCE_NOT_FOUND = 'L5021',

	// Database errors (6000-6999)
	DATABASE_CONNECTION_FAILED = 'L6000',
	DATABASE_QUERY_FAILED = 'L6001',
	DATABASE_TRANSACTION_FAILED = 'L6002',
	DUPLICATE_ENTRY = 'L6003',
	FOREIGN_KEY_CONSTRAINT = 'L6004',
	DATA_INTEGRITY_VIOLATION = 'L6005',
	DATABASE_TIMEOUT = 'L6006',

	// External service errors (7000-7999)
	GOOGLE_API_ERROR = 'L7000',
	SCHOOL_SYSTEM_UNAVAILABLE = 'L7001',
	EMAIL_SERVICE_ERROR = 'L7002',
	SMS_SERVICE_ERROR = 'L7003',
	STORAGE_SERVICE_ERROR = 'L7004',
	NOTIFICATION_SERVICE_ERROR = 'L7005',

	// File/Media errors (8000-8999)
	FILE_NOT_FOUND = 'L8000',
	FILE_UPLOAD_FAILED = 'L8001',
	INVALID_FILE_FORMAT = 'L8002',
	FILE_PROCESSING_ERROR = 'L8003',
	IMAGE_PROCESSING_ERROR = 'L8004',
	STORAGE_QUOTA_EXCEEDED = 'L8005',

	// System errors (9000-9999)
	MAINTENANCE_MODE = 'L9000',
	SYSTEM_OVERLOAD = 'L9001',
	CONFIGURATION_ERROR = 'L9002',
	DEPENDENCY_UNAVAILABLE = 'L9003',
}

/**
 * Error messages in Traditional Chinese
 */
export const ErrorMessages: Record<KnownErrorCode, string> = {
	// General errors
	[KnownErrorCode.UNKNOWN_ERROR]: '發生未知錯誤',
	[KnownErrorCode.INTERNAL_SERVER_ERROR]: '內部伺服器錯誤',
	[KnownErrorCode.SERVICE_UNAVAILABLE]: '服務暫時無法使用',
	[KnownErrorCode.REQUEST_TIMEOUT]: '請求逾時',
	[KnownErrorCode.RATE_LIMIT_EXCEEDED]: '請求頻率過高，請稍後再試',

	// Authentication errors
	[KnownErrorCode.INVALID_CREDENTIALS]: '帳號或密碼錯誤',
	[KnownErrorCode.USER_NOT_FOUND]: '找不到使用者',
	[KnownErrorCode.INVALID_PASSWORD]: '密碼錯誤',
	[KnownErrorCode.ACCOUNT_LOCKED]: '帳號已被鎖定',
	[KnownErrorCode.ACCOUNT_DISABLED]: '帳號已被停用',
	[KnownErrorCode.SESSION_EXPIRED]: '登入狀態已過期',
	[KnownErrorCode.SESSION_NOT_FOUND]: '找不到登入狀態',
	[KnownErrorCode.INVALID_SESSION]: '無效的登入狀態',
	[KnownErrorCode.LOGIN_REQUIRED]: '請先登入',
	[KnownErrorCode.GOOGLE_AUTH_FAILED]: 'Google 驗證失敗',
	[KnownErrorCode.INVALID_AUTH_TOKEN]: '無效的驗證令牌',
	[KnownErrorCode.TOKEN_EXPIRED]: '驗證令牌已過期',
	[KnownErrorCode.INVALID_LOGIN_TYPE]: '無效的登入類型',
	[KnownErrorCode.SESSION_IP_MISMATCH]: '登入IP位址不符',
	[KnownErrorCode.MALFORMED_SESSION_DATA]: '會話資料格式錯誤',

	// Authorization errors
	[KnownErrorCode.FORBIDDEN]: '拒絕存取',
	[KnownErrorCode.INSUFFICIENT_PERMISSIONS]: '權限不足',
	[KnownErrorCode.UNAUTHORIZED_ACCESS]: '未授權的存取',
	[KnownErrorCode.ADMIN_REQUIRED]: '需要管理員權限',
	[KnownErrorCode.STAFF_REQUIRED]: '需要工作人員權限',
	[KnownErrorCode.ACCOUNT_LEVEL_INSUFFICIENT]: '帳號等級不足',
	[KnownErrorCode.RESOURCE_ACCESS_DENIED]: '資源存取被拒絕',

	// Validation errors
	[KnownErrorCode.MISSING_REQUIRED_FIELDS]: '缺少必填欄位',
	[KnownErrorCode.INVALID_REQUEST_FORMAT]: '請求格式錯誤',
	[KnownErrorCode.INVALID_EMAIL_FORMAT]: '電子郵件格式錯誤',
	[KnownErrorCode.INVALID_PASSWORD_FORMAT]: '密碼格式錯誤',
	[KnownErrorCode.INVALID_STUDENT_ID]: '學號格式錯誤',
	[KnownErrorCode.INVALID_CLASS_FORMAT]: '班級格式錯誤',
	[KnownErrorCode.INVALID_PHONE_NUMBER]: '電話號碼格式錯誤',
	[KnownErrorCode.INVALID_DATE_FORMAT]: '日期格式錯誤',
	[KnownErrorCode.INVALID_TIME_FORMAT]: '時間格式錯誤',
	[KnownErrorCode.INVALID_LEVEL_VALUE]: '等級值錯誤',
	[KnownErrorCode.INVALID_VULI_VALUE]: 'VULI 值錯誤',
	[KnownErrorCode.INVALID_EVENT_TYPE]: '活動類型錯誤',
	[KnownErrorCode.INVALID_REPAIR_TYPE]: '維修類型錯誤',
	[KnownErrorCode.INVALID_PROGRESS_STATUS]: '進度狀態錯誤',
	[KnownErrorCode.INVALID_FILE_TYPE]: '檔案類型錯誤',
	[KnownErrorCode.FILE_SIZE_TOO_LARGE]: '檔案大小超過限制',
	[KnownErrorCode.INVALID_QUERY_PARAMETERS]: '查詢參數錯誤',

	// Business logic errors
	[KnownErrorCode.REGISTRATION_CODE_NOT_FOUND]: '找不到註冊代碼',
	[KnownErrorCode.REGISTRATION_CODE_EXPIRED]: '註冊代碼已過期',
	[KnownErrorCode.REGISTRATION_CODE_USED]: '註冊代碼已被使用',
	[KnownErrorCode.USER_ALREADY_EXISTS]: '使用者已存在',
	[KnownErrorCode.EVENT_NOT_FOUND]: '找不到活動',
	[KnownErrorCode.REPAIR_CASE_NOT_FOUND]: '找不到維修案件',
	[KnownErrorCode.REPAIR_CASE_CLOSED]: '維修案件已結案',
	[KnownErrorCode.CALENDAR_EVENT_NOT_FOUND]: '找不到行事曆活動',
	[KnownErrorCode.CALENDAR_EVENT_CONFLICT]: '行事曆活動時間衝突',
	[KnownErrorCode.ANNOUNCEMENT_NOT_FOUND]: '找不到公告',
	[KnownErrorCode.SCHOOL_DATA_NOT_FOUND]: '找不到學校資料',
	[KnownErrorCode.INVALID_SCHOOL_SESSION]: '學校系統連線無效',
	[KnownErrorCode.PASSWORD_RESET_TOKEN_INVALID]: '密碼重設令牌無效',
	[KnownErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: '密碼重設令牌已過期',
	[KnownErrorCode.PCS_PROJECT_NOT_FOUND]: '找不到線上報修專案',
	[KnownErrorCode.SRM_RESOURCE_NOT_FOUND]: '找不到學權信箱相關資料',

	// Database errors
	[KnownErrorCode.DATABASE_CONNECTION_FAILED]: '資料庫連線失敗',
	[KnownErrorCode.DATABASE_QUERY_FAILED]: '資料庫查詢失敗',
	[KnownErrorCode.DATABASE_TRANSACTION_FAILED]: '資料庫交易失敗',
	[KnownErrorCode.DUPLICATE_ENTRY]: '資料重複',
	[KnownErrorCode.FOREIGN_KEY_CONSTRAINT]: '外鍵約束錯誤',
	[KnownErrorCode.DATA_INTEGRITY_VIOLATION]: '資料完整性違規',
	[KnownErrorCode.DATABASE_TIMEOUT]: '資料庫操作逾時',

	// External service errors
	[KnownErrorCode.GOOGLE_API_ERROR]: 'Google API 錯誤',
	[KnownErrorCode.SCHOOL_SYSTEM_UNAVAILABLE]: '學校系統無法使用',
	[KnownErrorCode.EMAIL_SERVICE_ERROR]: '電子郵件服務錯誤',
	[KnownErrorCode.SMS_SERVICE_ERROR]: 'SMS 服務錯誤',
	[KnownErrorCode.STORAGE_SERVICE_ERROR]: '儲存服務錯誤',
	[KnownErrorCode.NOTIFICATION_SERVICE_ERROR]: '通知服務錯誤',

	// File/Media errors
	[KnownErrorCode.FILE_NOT_FOUND]: '找不到檔案',
	[KnownErrorCode.FILE_UPLOAD_FAILED]: '檔案上傳失敗',
	[KnownErrorCode.INVALID_FILE_FORMAT]: '無效的檔案格式',
	[KnownErrorCode.FILE_PROCESSING_ERROR]: '檔案處理錯誤',
	[KnownErrorCode.IMAGE_PROCESSING_ERROR]: '圖片處理錯誤',
	[KnownErrorCode.STORAGE_QUOTA_EXCEEDED]: '儲存空間不足',

	// System errors
	[KnownErrorCode.MAINTENANCE_MODE]: '系統維護中',
	[KnownErrorCode.SYSTEM_OVERLOAD]: '系統負載過高',
	[KnownErrorCode.CONFIGURATION_ERROR]: '系統設定錯誤',
	[KnownErrorCode.DEPENDENCY_UNAVAILABLE]: '相依服務無法使用',
};

/**
 * HTTP status codes mapped to error codes
 */
export const ErrorStatusCodes: Record<KnownErrorCode, ContentfulStatusCode> = {
	// General errors - 500
	[KnownErrorCode.UNKNOWN_ERROR]: 500,
	[KnownErrorCode.INTERNAL_SERVER_ERROR]: 500,
	[KnownErrorCode.SERVICE_UNAVAILABLE]: 503,
	[KnownErrorCode.REQUEST_TIMEOUT]: 408,
	[KnownErrorCode.RATE_LIMIT_EXCEEDED]: 429,

	// Authentication errors - 401
	[KnownErrorCode.INVALID_CREDENTIALS]: 401,
	[KnownErrorCode.USER_NOT_FOUND]: 404,
	[KnownErrorCode.INVALID_PASSWORD]: 401,
	[KnownErrorCode.ACCOUNT_LOCKED]: 423,
	[KnownErrorCode.ACCOUNT_DISABLED]: 403,
	[KnownErrorCode.SESSION_EXPIRED]: 401,
	[KnownErrorCode.SESSION_NOT_FOUND]: 401,
	[KnownErrorCode.INVALID_SESSION]: 401,
	[KnownErrorCode.LOGIN_REQUIRED]: 401,
	[KnownErrorCode.GOOGLE_AUTH_FAILED]: 401,
	[KnownErrorCode.INVALID_AUTH_TOKEN]: 401,
	[KnownErrorCode.TOKEN_EXPIRED]: 401,
	[KnownErrorCode.INVALID_LOGIN_TYPE]: 400,
	[KnownErrorCode.SESSION_IP_MISMATCH]: 401,
	[KnownErrorCode.MALFORMED_SESSION_DATA]: 400,

	// Authorization errors - 403
	[KnownErrorCode.FORBIDDEN]: 403,
	[KnownErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
	[KnownErrorCode.UNAUTHORIZED_ACCESS]: 403,
	[KnownErrorCode.ADMIN_REQUIRED]: 403,
	[KnownErrorCode.STAFF_REQUIRED]: 403,
	[KnownErrorCode.ACCOUNT_LEVEL_INSUFFICIENT]: 403,
	[KnownErrorCode.RESOURCE_ACCESS_DENIED]: 403,

	// Validation errors - 400
	[KnownErrorCode.MISSING_REQUIRED_FIELDS]: 400,
	[KnownErrorCode.INVALID_REQUEST_FORMAT]: 400,
	[KnownErrorCode.INVALID_EMAIL_FORMAT]: 400,
	[KnownErrorCode.INVALID_PASSWORD_FORMAT]: 400,
	[KnownErrorCode.INVALID_STUDENT_ID]: 400,
	[KnownErrorCode.INVALID_CLASS_FORMAT]: 400,
	[KnownErrorCode.INVALID_PHONE_NUMBER]: 400,
	[KnownErrorCode.INVALID_DATE_FORMAT]: 400,
	[KnownErrorCode.INVALID_TIME_FORMAT]: 400,
	[KnownErrorCode.INVALID_LEVEL_VALUE]: 400,
	[KnownErrorCode.INVALID_VULI_VALUE]: 400,
	[KnownErrorCode.INVALID_EVENT_TYPE]: 400,
	[KnownErrorCode.INVALID_REPAIR_TYPE]: 400,
	[KnownErrorCode.INVALID_PROGRESS_STATUS]: 400,
	[KnownErrorCode.INVALID_FILE_TYPE]: 400,
	[KnownErrorCode.FILE_SIZE_TOO_LARGE]: 413,
	[KnownErrorCode.INVALID_QUERY_PARAMETERS]: 400,

	// Business logic errors - mix of 400/404/409
	[KnownErrorCode.REGISTRATION_CODE_NOT_FOUND]: 404,
	[KnownErrorCode.REGISTRATION_CODE_EXPIRED]: 400,
	[KnownErrorCode.REGISTRATION_CODE_USED]: 409,
	[KnownErrorCode.USER_ALREADY_EXISTS]: 409,
	[KnownErrorCode.EVENT_NOT_FOUND]: 404,
	[KnownErrorCode.REPAIR_CASE_NOT_FOUND]: 404,
	[KnownErrorCode.REPAIR_CASE_CLOSED]: 400,
	[KnownErrorCode.CALENDAR_EVENT_NOT_FOUND]: 404,
	[KnownErrorCode.CALENDAR_EVENT_CONFLICT]: 409,
	[KnownErrorCode.ANNOUNCEMENT_NOT_FOUND]: 404,
	[KnownErrorCode.SCHOOL_DATA_NOT_FOUND]: 404,
	[KnownErrorCode.INVALID_SCHOOL_SESSION]: 401,
	[KnownErrorCode.PASSWORD_RESET_TOKEN_INVALID]: 400,
	[KnownErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: 400,
	[KnownErrorCode.PCS_PROJECT_NOT_FOUND]: 404,
	[KnownErrorCode.SRM_RESOURCE_NOT_FOUND]: 404,

	// Database errors - 500
	[KnownErrorCode.DATABASE_CONNECTION_FAILED]: 500,
	[KnownErrorCode.DATABASE_QUERY_FAILED]: 500,
	[KnownErrorCode.DATABASE_TRANSACTION_FAILED]: 500,
	[KnownErrorCode.DUPLICATE_ENTRY]: 409,
	[KnownErrorCode.FOREIGN_KEY_CONSTRAINT]: 400,
	[KnownErrorCode.DATA_INTEGRITY_VIOLATION]: 400,
	[KnownErrorCode.DATABASE_TIMEOUT]: 408,

	// External service errors - 502/503
	[KnownErrorCode.GOOGLE_API_ERROR]: 502,
	[KnownErrorCode.SCHOOL_SYSTEM_UNAVAILABLE]: 503,
	[KnownErrorCode.EMAIL_SERVICE_ERROR]: 502,
	[KnownErrorCode.SMS_SERVICE_ERROR]: 502,
	[KnownErrorCode.STORAGE_SERVICE_ERROR]: 502,
	[KnownErrorCode.NOTIFICATION_SERVICE_ERROR]: 502,

	// File/Media errors - 400/404/413/500
	[KnownErrorCode.FILE_NOT_FOUND]: 404,
	[KnownErrorCode.FILE_UPLOAD_FAILED]: 500,
	[KnownErrorCode.INVALID_FILE_FORMAT]: 400,
	[KnownErrorCode.FILE_PROCESSING_ERROR]: 500,
	[KnownErrorCode.IMAGE_PROCESSING_ERROR]: 500,
	[KnownErrorCode.STORAGE_QUOTA_EXCEEDED]: 507,

	// System errors - 503
	[KnownErrorCode.MAINTENANCE_MODE]: 503,
	[KnownErrorCode.SYSTEM_OVERLOAD]: 503,
	[KnownErrorCode.CONFIGURATION_ERROR]: 500,
	[KnownErrorCode.DEPENDENCY_UNAVAILABLE]: 503,
};

/**
 * LYHS Application Error class
 */
export class errorHandler extends Error {
	public readonly code: KnownErrorCode;
	public readonly statusCode: ContentfulStatusCode;
	public readonly details?: any;

	constructor(code: KnownErrorCode, details?: any) {
		const message = ErrorMessages[code];
		super(message);
		this.name = 'errorHandler';
		this.code = code;
		this.statusCode = ErrorStatusCodes[code];
		this.details = details;
	}

	/**
	 * Convert error to JSON response format
	 */
	public toJSON() {
		return {
			error: {
				code: this.code,
				message: this.message,
				...(this.details && { details: this.details }),
			},
		};
	}

	/**
	 * Create error response for API
	 */
	public toResponse() {
		return {
			json: this.toJSON(),
			status: this.statusCode,
		};
	}
}

export function httpReturn(ctx: AppContext, code: KnownErrorCode, details?: any): Response {
	const error = new errorHandler(code, details);
	return ctx.json(error.toJSON(), error.statusCode);
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(code: KnownErrorCode, details?: any) {
	const error = new errorHandler(code, details);
	return error.toResponse();
	// 這一行會自動建立 API 回應的樣式
}

/**
 * Helper function to throw errorHandler errors
 * 處理錯誤訊息
 */
export function throwErrorHandler(code: KnownErrorCode, details?: any): never {
	throw new errorHandler(code, details);
}

/**
 * Helper function to check if an error is an errorHandler error
 * 檢查是否為已知錯誤
 */
export function isErrorHandler(error: any): error is errorHandler {
	return error instanceof errorHandler;
}

/**
 * Helper function to handle unknown errors and convert them to errorHandler errors
 */
export function handleUnknownError(error: unknown): errorHandler {
	if (isErrorHandler(error)) {
		return error;
	}

	if (error instanceof Error) {
		return new errorHandler(KnownErrorCode.INTERNAL_SERVER_ERROR, {
			originalMessage: error.message,
			stack: error.stack,
		});
	}

	return new errorHandler(KnownErrorCode.UNKNOWN_ERROR, {
		originalError: error,
	});
}
