import fs from "node:fs";
import path from "node:path";
import type { StoredServer } from "../../shared/types";

interface MonitorState {
  servers: Record<string, StoredServer>;
}

const emptyState = (): MonitorState => ({ servers: {} });

export class MonitorStateStore {
  private state: MonitorState;

  constructor(private readonly filePath: string) {
    this.state = this.load();
  }

  getServer(serverId: string) {
    return this.state.servers[serverId];
  }

  listServers() {
    return Object.values(this.state.servers);
  }

  upsertServer(server: StoredServer) {
    this.state.servers[server.serverId] = server;
    this.save();

    return server;
  }

  private load(): MonitorState {
    if (!fs.existsSync(this.filePath)) return emptyState();

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as MonitorState;
      return parsed && parsed.servers ? parsed : emptyState();
    } catch (error) {
      console.warn(`Cannot read monitor state at ${this.filePath}:`, error);
      return emptyState();
    }
  }

  private save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2));
    fs.renameSync(tempPath, this.filePath);
  }
}
