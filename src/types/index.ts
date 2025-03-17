// 用戶資料設定，用於登入以及註冊
export interface userData {
	code?: string;
	email: string;
	password: string;
	name: string;
	type?: 'faculty' | 'staff' | 'stu';
	level?: string;
	Class: string;
	grade: string;
	role?: string;
}

// 用戶登入資料
export interface userVerifyData {
	email: string;
	password?: string;
	sessionId?: string;
	browser?: string;
	ip?: string;
	os?: string;
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
	registerCode: string;
}

// StaffKV
export interface sessionKVData {
	userId: string;
	email: string;
	loginTime: string;
	expirationTime: string;
	borwser: string;
	ip: string;
	os: string;
}

// mailKV
export interface studentData {
	id: string;
	searchCode: string;
	email: string;
	name: string;
	type: string;
	title: string;
	description: string;
	Class: string;
	number: string;
	solution: string;
	handler?: string;
	status?: string;
	createdTime: string;
	updatedTime: string;
}

export interface TokenResponse {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
	refresh_token?: string;
	id_token?: string;
}

export interface UserInfo {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
}

export interface BrowserInfo {
	name: string;
	version: string;
}

export interface OsInfo {
	name: string;
	version: string;
}

export type UserSession = {
	sessionId?: string;
	loginTime: string;
	expirationTime: string;
	browser?: string;
	ip: string;
	os?: string;
};

export interface Announcement {
	date: string;
	department: string;
	title: string;
	link: string;
}

export interface JWTPayload {
	email: string;
	exp: number | string;
}
