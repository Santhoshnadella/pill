-- Cloudflare D1 Initial Migration for PILL Sync Relay
-- Strictly partitions all data by owner_id

-- Enrolled Devices
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    enrolled_at TEXT NOT NULL,
    revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);

-- Append-Only Sync Journal
CREATE TABLE IF NOT EXISTS sync_events (
    cursor INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    revision INTEGER NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_events_owner_cursor ON sync_events(owner_id, cursor);
CREATE INDEX IF NOT EXISTS idx_sync_events_entity ON sync_events(entity_id);

-- Encrypted Blob Metadata
CREATE TABLE IF NOT EXISTS blobs (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blobs_owner ON blobs(owner_id);
