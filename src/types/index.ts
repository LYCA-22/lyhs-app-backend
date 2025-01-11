export interface Env {
	DATABASE: D1Database;
	JWT_SECRET: string;
	RESNED_APIKEY: string;
	KV: KVNamespace;
	StaffKV: KVNamespace;
}
export interface newUserData {
	code?: string;
	email: string;
	password: string;
	name: string;
	admin_access?: boolean;
	level?: string;
	Class: string;
	grade: string;
	role?: string;
}
export interface UserLoginData {
	email: string;
	password: string;
}
export interface UserData {
	id: string;
	email: string;
	name: string;
	admin_access: boolean;
	user_level: string;
	user_class: string;
	user_grade: string;
	user_role: string;
}
export interface UserChangePasswordData {
	oldPassword: string;
	newPassword: string;
}
export interface BetaNewUserData {
	email: string;
	name: string;
}

export interface codeData {
	createUserId: string;
	createUserEmail: string;
	vuli: boolean;
	level: string;
	user_number: number;
	createdTime: string;
}
