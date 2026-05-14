import type { RequestHandler } from "express";

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

const isLocalHostname = (hostname: string | undefined) => {
  return Boolean(hostname && localHostnames.has(hostname));
};

export const localAccessGuard = (allowRemoteAccess: boolean): RequestHandler => {
  return (request, response, next) => {
    if (allowRemoteAccess) {
      next();
      return;
    }

    const host = hostnameFromHostHeader(request.header("host"));
    if (!isLocalHostname(host)) {
      response.status(403).json({ error: "Local access only" });
      return;
    }

    const origin = request.header("origin");
    if (origin && !isLocalHostname(hostnameFromOrigin(origin))) {
      response.status(403).json({ error: "Local origin required" });
      return;
    }

    next();
  };
};
