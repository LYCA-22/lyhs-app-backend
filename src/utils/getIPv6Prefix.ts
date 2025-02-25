export function getIPv6Prefix(ip: string, groups: number = 4): string {
	const parts = ip.split(':');
	return parts.slice(0, groups).join(':');
}
