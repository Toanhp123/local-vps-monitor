import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const defaultApiPort = 3101;
const defaultDashboardPort = 5173;

const proxyHost = (host: string | undefined) => {
  const normalized = host?.trim();

  if (!normalized || normalized === "0.0.0.0" || normalized === "::") {
    return "127.0.0.1";
  }

  return normalized;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiHost = proxyHost(env.HOST);
  const apiPort = Number(env.PORT) || defaultApiPort;
  const dashboardPort = Number(env.DASHBOARD_PORT) || defaultDashboardPort;

  return {
    root: "src/client",
    plugins: [tailwindcss(), react()],
    build: {
      outDir: "../../dist/client",
      emptyOutDir: true
    },
    server: {
      host: "127.0.0.1",
      port: dashboardPort,
      proxy: {
        "/api": {
          target: `http://${apiHost}:${apiPort}`
        },
        "/ws": {
          target: `ws://${apiHost}:${apiPort}`,
          ws: true
        }
      }
    }
  };
});
