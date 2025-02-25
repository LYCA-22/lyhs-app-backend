import { UserSession } from '../types';

export function cleanupExpiredSessions(sessionList: UserSession[]): UserSession[] {
	const now = new Date();
	return sessionList.filter((session) => new Date(session.expirationTime) > now);
}
