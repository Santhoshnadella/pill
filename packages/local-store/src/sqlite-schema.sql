-- PILL Local Vault Schema (SQLite + FTS5)
-- Strict identity isolation via owner_id

PRAGMA foreign_keys = ON;

-- Pills Metadata & Payload
CREATE TABLE IF NOT EXISTS pills (
    id TEXT PRIMARY KEY NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    owner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    payload_format TEXT NOT NULL,
    payload_content TEXT NOT NULL,
    payload_language TEXT,
    payload_blob_id TEXT,
    source_kind TEXT NOT NULL,
    source_url TEXT,
    source_title TEXT,
    source_captured_at TEXT NOT NULL,
    trust_label TEXT NOT NULL DEFAULT 'user_authored',
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pills_owner ON pills(owner_id);
CREATE INDEX IF NOT EXISTS idx_pills_updated ON pills(owner_id, updated_at DESC);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#2DD4BF',
    icon TEXT NOT NULL DEFAULT 'folder',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections(owner_id);

-- Pill <-> Collection Membership
CREATE TABLE IF NOT EXISTS pill_collections (
    pill_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    PRIMARY KEY (pill_id, collection_id),
    FOREIGN KEY (pill_id) REFERENCES pills(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Pill Tags
CREATE TABLE IF NOT EXISTS pill_tags (
    pill_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (pill_id, tag),
    FOREIGN KEY (pill_id) REFERENCES pills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pill_tags_tag ON pill_tags(tag);

-- Pill Graph Relationships
CREATE TABLE IF NOT EXISTS pill_relationships (
    id TEXT PRIMARY KEY NOT NULL,
    source_pill_id TEXT NOT NULL,
    target_pill_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (source_pill_id) REFERENCES pills(id) ON DELETE CASCADE
);

-- FTS5 Full-Text Search Virtual Table
CREATE VIRTUAL TABLE IF NOT EXISTS pills_fts USING fts5(
    pill_id UNINDEXED,
    owner_id UNINDEXED,
    title,
    content,
    tags,
    tokenize = 'porter unicode61'
);

-- Triggers to synchronize FTS index with pills table
CREATE TRIGGER IF NOT EXISTS pills_ai AFTER INSERT ON pills BEGIN
    INSERT INTO pills_fts(pill_id, owner_id, title, content, tags)
    VALUES (new.id, new.owner_id, new.title, new.payload_content, '');
END;

CREATE TRIGGER IF NOT EXISTS pills_ad AFTER DELETE ON pills BEGIN
    DELETE FROM pills_fts WHERE pill_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS pills_au AFTER UPDATE ON pills BEGIN
    DELETE FROM pills_fts WHERE pill_id = old.id;
    INSERT INTO pills_fts(pill_id, owner_id, title, content, tags)
    VALUES (new.id, new.owner_id, new.title, new.payload_content, '');
END;
