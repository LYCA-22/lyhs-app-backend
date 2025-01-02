export interface Env {
	DATABASE: D1Database;
	JWT_SECRET: string;
}
export interface UserRegisterData {
	email: string;
	password: string;
	name: string;
	admin_access: boolean;
	user_level: string;
	user_class: string;
	user_grade: string;
	user_role: string;
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
