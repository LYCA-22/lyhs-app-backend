const encoder = new TextEncoder();
const decoder = new TextDecoder();

const AES_KEY_BASE64 = 'u6s9OcXmfwb7jrk16pQ1/TDvbnejs3eZFO7b0dlwOms=';
const IV_LENGTH = 12;

async function getKey() {
	const rawKey = Uint8Array.from(atob(AES_KEY_BASE64), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken(token: string): Promise<string> {
	const key = await getKey();
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(token));
	return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decryptToken(encryptedToken: string): Promise<string> {
	const [ivBase64, encryptedBase64] = encryptedToken.split('.');
	const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
	const encrypted = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
	const key = await getKey();
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
	return decoder.decode(decrypted);
}
