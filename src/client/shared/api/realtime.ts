import type { RealtimeMessage } from "@shared/types";

export type RealtimeStatus =
	| "connecting"
	| "live"
	| "reconnecting"
	| "fallback";

export const realtimeUrl = () => {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/ws`;
};

export const parseRealtimeMessage = (data: unknown): RealtimeMessage | null => {
	try {
		const message = JSON.parse(String(data)) as RealtimeMessage;

		if (
			message.type === "overview.snapshot" ||
			message.type === "overview.updated"
		) {
			return message;
		}
	} catch {
		return null;
	}

	return null;
};

export const reconnectDelay = (attempt: number) => {
	const baseDelay = Math.min(1_000 * 2 ** attempt, 15_000);
	const jitter = Math.round(Math.random() * 500);

	return baseDelay + jitter;
};
