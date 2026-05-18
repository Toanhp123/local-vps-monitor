-- VPS Monitor Database Schema
-- SQLite database for metrics, incidents, and scan history

-- Server metrics time-series data
CREATE TABLE IF NOT EXISTS server_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id TEXT NOT NULL,
  server_name TEXT NOT NULL,
  observed_at TEXT NOT NULL,

  -- Host metrics
  cpu_count INTEGER,
  load_average_1m REAL,
  load_average_5m REAL,
  load_average_15m REAL,
  memory_total_bytes INTEGER,
  memory_used_bytes INTEGER,
  memory_free_bytes INTEGER,

  -- Disk metrics
  disk_total_bytes INTEGER,
  disk_used_bytes INTEGER,
  disk_used_percent REAL,
  disk_filesystem TEXT,
  disk_mount TEXT,

  -- App aggregates
  app_cpu_percent REAL,
  app_count INTEGER,
  restart_count INTEGER,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_server_metrics_server_time
  ON server_metrics(server_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_observed_at
  ON server_metrics(observed_at DESC);

-- Incident events
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  server_name TEXT NOT NULL,
  app_id TEXT,
  app_name TEXT,

  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  occurred_at TEXT NOT NULL,

  -- Incident context
  current_health TEXT,
  previous_health TEXT,
  current_value REAL,
  previous_value REAL,

  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_server_time
  ON incidents(server_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_app_time
  ON incidents(app_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at
  ON incidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity
  ON incidents(severity, occurred_at DESC);

-- Database metadata
CREATE TABLE IF NOT EXISTS db_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('schema_version', '2');
INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('created_at', datetime('now'));
