import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OverviewResponse } from "@shared/types";
import { fetchOverview } from "@/shared/api/monitorApi";
import {
	parseRealtimeMessage,
	reconnectDelay,
	realtimeUrl,
	type RealtimeStatus,
} from "@/shared/api/realtime";
import { filterServers } from "./filterServers";

type RequestStatus = "idle" | "loading" | "error";

const FALLBACK_POLL_MS = 5_000;
const STALE_SOCKET_MS = 16_000;
const STALE_CHECK_MS = 4_000;
const INITIAL_CONNECT_DELAY_MS = 100;

const closeSocketSafely = (socket: WebSocket | null) => {
	if (!socket) return;

	socket.onclose = null;
	socket.onerror = null;
	socket.onmessage = null;

	if (socket.readyState === WebSocket.CONNECTING) {
		socket.onopen = () => {
			socket.close();
		};
		return;
	}

	socket.onopen = null;

	if (socket.readyState === WebSocket.OPEN) {
		socket.close();
	}
};

export function useMonitorOverview() {
	const [overview, setOverview] = useState<OverviewResponse | null>(null);
	const [query, setQuery] = useState("");
	const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
	const [realtimeStatus, setRealtimeStatus] =
		useState<RealtimeStatus>("connecting");
	const socketRef = useRef<WebSocket | null>(null);

	const applyOverview = useCallback((nextOverview: OverviewResponse) => {
		setOverview(nextOverview);
		setRequestStatus("idle");
	}, []);

	const loadOverview = useCallback(async () => {
		setRequestStatus((current) =>
			current === "idle" ? "loading" : current,
		);

		try {
			applyOverview(await fetchOverview());
		} catch {
			setRequestStatus("error");
		}
	}, [applyOverview]);

	useEffect(() => {
		let disposed = false;
		let initialConnectTimer: number | undefined;
		let reconnectTimer: number | undefined;
		let retryAttempt = 0;
		let lastMessageAt = 0;

		const clearInitialConnectTimer = () => {
			if (initialConnectTimer) {
				window.clearTimeout(initialConnectTimer);
				initialConnectTimer = undefined;
			}
		};

		const clearReconnectTimer = () => {
			if (reconnectTimer) {
				window.clearTimeout(reconnectTimer);
				reconnectTimer = undefined;
			}
		};

		const scheduleReconnect = () => {
			if (disposed) return;

			const delay = reconnectDelay(retryAttempt);
			retryAttempt += 1;
			setRealtimeStatus(retryAttempt > 2 ? "fallback" : "reconnecting");
			clearReconnectTimer();
			reconnectTimer = window.setTimeout(connect, delay);
		};

		const connect = () => {
			if (disposed) return;

			closeSocketSafely(socketRef.current);
			setRealtimeStatus(
				retryAttempt === 0 ? "connecting" : "reconnecting",
			);

			const socket = new WebSocket(realtimeUrl());
			socketRef.current = socket;

			socket.onopen = () => {
				retryAttempt = 0;
				lastMessageAt = Date.now();
				setRealtimeStatus("live");
			};

			socket.onmessage = (event) => {
				const message = parseRealtimeMessage(event.data);
				if (!message) return;

				lastMessageAt = Date.now();
				setRealtimeStatus("live");
				applyOverview(message.payload);
			};

			socket.onerror = () => {
				setRealtimeStatus("fallback");
			};

			socket.onclose = () => {
				if (disposed || socketRef.current !== socket) return;

				socketRef.current = null;
				scheduleReconnect();
			};
		};

		loadOverview();
		initialConnectTimer = window.setTimeout(
			connect,
			INITIAL_CONNECT_DELAY_MS,
		);

		const fallbackInterval = window.setInterval(() => {
			if (socketRef.current?.readyState !== WebSocket.OPEN) {
				loadOverview();
			}
		}, FALLBACK_POLL_MS);

		const staleSocketInterval = window.setInterval(() => {
			const socket = socketRef.current;
			if (!socket || socket.readyState !== WebSocket.OPEN) return;

			if (Date.now() - lastMessageAt > STALE_SOCKET_MS) {
				setRealtimeStatus("fallback");
				socket.close();
			}
		}, STALE_CHECK_MS);

		return () => {
			disposed = true;
			clearInitialConnectTimer();
			clearReconnectTimer();
			window.clearInterval(fallbackInterval);
			window.clearInterval(staleSocketInterval);
			closeSocketSafely(socketRef.current);
			socketRef.current = null;
		};
	}, [applyOverview, loadOverview]);

	const filteredServers = useMemo(() => {
		return filterServers(overview?.servers || [], query);
	}, [overview, query]);

	return {
		filteredServers,
		loadOverview,
		overview,
		query,
		realtimeStatus,
		requestStatus,
		setQuery,
	};
}
