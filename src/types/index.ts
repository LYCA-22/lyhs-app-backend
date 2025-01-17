// 環境變數類型設定
export interface Env {
	DATABASE: D1Database;
	JWT_SECRET: string;
	RESNED_APIKEY: string;
	KV: KVNamespace;
	StaffKV: KVNamespace;
}

// 用戶資料設定，用於登入以及註冊
export interface userData {
	code?: string;
	email: string;
	password: string;
	name: string;
	type?: userTypes;
	level?: string;
	Class: string;
	grade: string;
	role?: string;
}

enum userTypes {
	Staff = 'staff',
	Normal = 'normal',
}

// 用戶登入資料
export interface userLoginData {
	email: string;
	password: string;
}

//用戶變更密碼資料
export interface UserChangePasswordData {
	oldPassword: string;
	newPassword: string;
}

// Plus官網註冊資料
export interface BetaNewUserData {
	email: string;
	name: string;
}

// 授權碼資料
export interface codeData {
	createUserId: string;
	createUserEmail: string;
	vuli: boolean;
	level: string;
	user_number: number;
	createdTime: string;
}

// StaffKV
export interface sessionKVData {
	userId: string;
	email: string;
	loginTime: string;
	expirationTime: string;
}
