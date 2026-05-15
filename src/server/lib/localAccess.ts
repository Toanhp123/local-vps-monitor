const localHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const hostnameFromHostHeader = (value: string | undefined) => {
	if (!value) return undefined;

	try {
		return new URL(`http://${value}`).hostname.toLowerCase();
	} catch {
		return undefined;
	}
};

const hostnameFromOrigin = (value: string | undefined) => {
	if (!value) return undefined;

	try {
		return new URL(value).hostname.toLowerCase();
	} catch {
		return undefined;
	}
};

export const isLocalHostname = (hostname: string | undefined) => {
	return Boolean(hostname && localHostnames.has(hostname));
};

export const validateLocalAccessHeaders = (headers: {
	host?: string;
	origin?: string;
}) => {
	const host = hostnameFromHostHeader(headers.host);
	if (!isLocalHostname(host)) {
		return "Local access only";
	}

	if (
		headers.origin &&
		!isLocalHostname(hostnameFromOrigin(headers.origin))
	) {
		return "Local origin required";
	}

	return undefined;
};
