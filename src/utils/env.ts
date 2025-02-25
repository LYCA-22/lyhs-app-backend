export interface EnvConfig {
	DATABASE: D1Database;
	JWT_SECRET: string;
	RESNED_APIKEY: string;
	sessionKV: KVNamespace;
	mailKV: KVNamespace;
	googleClientId: string;
	googleClientSecret: string;
}
