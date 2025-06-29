import { Context } from 'hono';
import { AppContext } from '..';
import { errorHandler, KnownErrorCode, handleUnknownError, isErrorHandler, httpReturn } from './error';

/**
 * Global error handler for LYHS Plus application
 */
export async function globalErrorHandler(error: Error | errorHandler, ctx: Context): Promise<Response> {
	// Log the error
	console.error('Global error handler:', error);

	// Handle errorHandler errors
	if (isErrorHandler(error)) {
		return ctx.json(error.toJSON(), error.statusCode);
	}

	// Handle unknown errors
	const errorHandlerError = handleUnknownError(error);
	return ctx.json(errorHandlerError.toJSON(), errorHandlerError.statusCode);
}

/**
 * Middleware to wrap route handlers with error handling
 */
export function withErrorHandler<T extends AppContext>(handler: (ctx: T) => Promise<Response>) {
	return async (ctx: T): Promise<Response> => {
		try {
			return await handler(ctx);
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	};
}

/**
 * Validation helpers
 */
export class ValidationHelper {
	/**
	 * Validate required fields
	 */
	static validateRequiredFields(data: Record<string, any>, requiredFields: string[], ctx: AppContext) {
		const missingFields = requiredFields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');

		if (missingFields.length > 0) {
			return httpReturn(ctx, KnownErrorCode.MISSING_REQUIRED_FIELDS, {
				missingFields,
			});
		}
	}

	/**
	 * Validate email format
	 */
	static validateEmail(email: string, ctx: AppContext) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return httpReturn(ctx, KnownErrorCode.INVALID_EMAIL_FORMAT, { email });
		}
	}

	/**
	 * Validate class format
	 */
	static validateClass(classValue: string, ctx: AppContext) {
		// Assuming class format like "101", "201", etc.
		const classRegex = /^[1-3]\d{2}$/;
		if (!classRegex.test(classValue)) {
			return httpReturn(ctx, KnownErrorCode.INVALID_CLASS_FORMAT, { class: classValue });
		}
	}

	/**
	 * Validate level value
	 */
	static validateLevel(level: string, ctx: AppContext) {
		const validLevels = ['A1', 'L1', 'L2', 'L3', 'S1', 'S2', 'S3'];
		if (!validLevels.includes(level)) {
			return httpReturn(ctx, KnownErrorCode.INVALID_LEVEL_VALUE, {
				level,
				validLevels,
			});
		}
	}

	/**
	 * Validate login type
	 */
	static validateLoginType(loginType: string): void {
		const validTypes = ['APP', 'WEB'];
		if (!validTypes.includes(loginType)) {
			throw new errorHandler(KnownErrorCode.INVALID_LOGIN_TYPE, {
				loginType,
				validTypes,
			});
		}
	}

	/**
	 * Validate file type
	 */
	static validateFileType(filename: string, allowedTypes: string[]): void {
		const extension = filename.split('.').pop()?.toLowerCase();
		if (!extension || !allowedTypes.includes(extension)) {
			throw new errorHandler(KnownErrorCode.INVALID_FILE_TYPE, {
				filename,
				extension,
				allowedTypes,
			});
		}
	}

	/**
	 * Validate file size
	 */
	static validateFileSize(fileSize: number, maxSize: number): void {
		if (fileSize > maxSize) {
			throw new errorHandler(KnownErrorCode.FILE_SIZE_TOO_LARGE, {
				fileSize,
				maxSize,
			});
		}
	}
}

/**
 * Database operation helpers
 */
export class DatabaseHelper {
	/**
	 * Handle database query with proper error handling
	 */
	static async executeQuery<T>(queryPromise: Promise<T>, notFoundError?: KnownErrorCode): Promise<T> {
		try {
			const result = await queryPromise;

			// Check if result is null/undefined and throw not found error if specified
			if (notFoundError && (result === null || result === undefined)) {
				throw new errorHandler(notFoundError);
			}

			return result;
		} catch (error) {
			// If it's already an errorHandler error, re-throw it
			if (isErrorHandler(error)) {
				throw error;
			}

			// Handle database-specific errors
			if (error instanceof Error) {
				const message = error.message.toLowerCase();

				if (message.includes('timeout')) {
					throw new errorHandler(KnownErrorCode.DATABASE_TIMEOUT, {
						originalError: error.message,
					});
				}

				if (message.includes('connection')) {
					throw new errorHandler(KnownErrorCode.DATABASE_CONNECTION_FAILED, {
						originalError: error.message,
					});
				}

				if (message.includes('duplicate') || message.includes('unique')) {
					throw new errorHandler(KnownErrorCode.DUPLICATE_ENTRY, {
						originalError: error.message,
					});
				}

				if (message.includes('foreign key')) {
					throw new errorHandler(KnownErrorCode.FOREIGN_KEY_CONSTRAINT, {
						originalError: error.message,
					});
				}
			}

			// Default database error
			throw new errorHandler(KnownErrorCode.DATABASE_QUERY_FAILED, {
				originalError: error,
			});
		}
	}

	/**
	 * Handle database transactions
	 */
	static async executeTransaction<T>(transactionFn: () => Promise<T>): Promise<T> {
		try {
			return await transactionFn();
		} catch (error) {
			if (isErrorHandler(error)) {
				throw error;
			}

			throw new errorHandler(KnownErrorCode.DATABASE_TRANSACTION_FAILED, {
				originalError: error,
			});
		}
	}
}

/**
 * Authorization helpers
 */
export class AuthorizationHelper {
	/**
	 * Check if user has required level
	 */
	static requireLevel(userLevel: string, requiredLevel: string): void {
		if (userLevel !== requiredLevel) {
			throw new errorHandler(KnownErrorCode.ACCOUNT_LEVEL_INSUFFICIENT, {
				userLevel,
				requiredLevel,
			});
		}
	}

	/**
	 * Check if user is admin
	 */
	static requireAdmin(userLevel: string): void {
		if (userLevel !== 'A1') {
			throw new errorHandler(KnownErrorCode.ADMIN_REQUIRED, {
				userLevel,
			});
		}
	}

	/**
	 * Check if user is staff
	 */
	static requireStaff(userType: string): void {
		if (userType !== 'staff') {
			throw new errorHandler(KnownErrorCode.STAFF_REQUIRED, {
				userType,
			});
		}
	}

	/**
	 * Check if user exists
	 */
	static requireUser(user: any): void {
		if (!user) {
			throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);
		}
	}

	/**
	 * Check if session is valid
	 */
	static requireValidSession(sessionData: any): void {
		if (!sessionData) {
			throw new errorHandler(KnownErrorCode.SESSION_NOT_FOUND);
		}
	}
}

/**
 * Business logic helpers
 */
export class BusinessLogicHelper {
	/**
	 * Check if registration code exists and is valid
	 */
	static validateRegistrationCode(code: any): void {
		if (!code) {
			throw new errorHandler(KnownErrorCode.REGISTRATION_CODE_NOT_FOUND);
		}

		// Add additional validation logic here
		// e.g., check expiration, usage status, etc.
	}

	/**
	 * Check if repair case exists
	 */
	static requireRepairCase(repairCase: any): void {
		if (!repairCase) {
			throw new errorHandler(KnownErrorCode.REPAIR_CASE_NOT_FOUND);
		}
	}

	/**
	 * Check if calendar event exists
	 */
	static requireCalendarEvent(calendarEvent: any): void {
		if (!calendarEvent) {
			throw new errorHandler(KnownErrorCode.CALENDAR_EVENT_NOT_FOUND);
		}
	}
}

/**
 * External service helpers
 */
export class ExternalServiceHelper {
	/**
	 * Handle Google API errors
	 */
	static handleGoogleApiError(error: any): never {
		throw new errorHandler(KnownErrorCode.GOOGLE_API_ERROR, {
			originalError: error,
		});
	}

	/**
	 * Handle school system errors
	 */
	static handleSchoolSystemError(error: any): never {
		throw new errorHandler(KnownErrorCode.SCHOOL_SYSTEM_UNAVAILABLE, {
			originalError: error,
		});
	}

	/**
	 * Handle email service errors
	 */
	static handleEmailServiceError(error: any): never {
		throw new errorHandler(KnownErrorCode.EMAIL_SERVICE_ERROR, {
			originalError: error,
		});
	}
}

/**
 * Utility function to safely parse JSON
 */
export function safeJsonParse<T>(jsonString: string): T {
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		throw new errorHandler(KnownErrorCode.INVALID_REQUEST_FORMAT, {
			originalError: error,
		});
	}
}

/**
 * Utility function to safely get environment variables
 */
export function getRequiredEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new errorHandler(KnownErrorCode.CONFIGURATION_ERROR, {
			missingEnvVar: name,
		});
	}
	return value;
}
