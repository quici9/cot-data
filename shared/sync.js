/* ═══════════════════════════════════════════════
   NEXUS — GitHub Gist Sync Engine
   Encrypted cloud sync via Secret Gist
   Requires: crypto.js, store.js
   ═══════════════════════════════════════════════ */

const SyncEngine = (() => {
    // ── Config keys in localStorage ─────────────
    const CFG = {
        TOKEN: 'nexus_sync_token',
        GIST_ID: 'nexus_sync_gist_id',
        PASSWORD: 'nexus_sync_password',
        ENABLED: 'nexus_sync_enabled',
        LAST_SYNC: 'nexus_sync_last',
        DIRTY: 'nexus_sync_dirty',
    };

    const GIST_FILENAME = 'nexus-sync.json';
    const GIST_API = 'https://api.github.com/gists';
    const SYNC_VERSION = 1;

    // Keys to sync — important personal data
    const SYNC_KEYS = [
        'nexus_trades',
        'nexus_weekly_bias',
        'nexus_daily_bias',
        'nexus_alerts',
        'nexus_rates',
        'nexus_settings',
        'nexus_prop_settings',
        'cot_history',
    ];

    // Also sync action plans (dynamic keys: cot_actionplan_*)
    function _getAllSyncKeys() {
        const keys = [...SYNC_KEYS];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('cot_actionplan_')) {
                keys.push(k);
            }
        }
        return keys;
    }

    // ── GitHub API helpers ───────────────────────

    function _getToken() {
        return localStorage.getItem(CFG.TOKEN) || '';
    }

    function _getGistId() {
        return localStorage.getItem(CFG.GIST_ID) || '';
    }

    function _headers() {
        return {
            'Authorization': `Bearer ${_getToken()}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
        };
    }

    /**
     * Create a new Secret Gist
     * @returns {Promise<string>} Gist ID
     */
    async function _createGist(content) {
        const res = await fetch(GIST_API, {
            method: 'POST',
            headers: _headers(),
            body: JSON.stringify({
                description: 'NEXUS Encrypted Sync — Do not edit manually',
                public: false,
                files: {
                    [GIST_FILENAME]: { content }
                }
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Tạo Gist thất bại: ${res.status} — ${err.message || ''}`);
        }
        const data = await res.json();
        return data.id;
    }

    /**
     * Update existing Gist
     */
    async function _updateGist(gistId, content) {
        const res = await fetch(`${GIST_API}/${gistId}`, {
            method: 'PATCH',
            headers: _headers(),
            body: JSON.stringify({
                files: {
                    [GIST_FILENAME]: { content }
                }
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Cập nhật Gist thất bại: ${res.status} — ${err.message || ''}`);
        }
    }

    /**
     * Fetch Gist content
     * @returns {Promise<string|null>} File content or null
     */
    async function _fetchGist(gistId) {
        const res = await fetch(`${GIST_API}/${gistId}`, {
            headers: _headers()
        });
        if (res.status === 404) return null;
        if (!res.ok) {
            throw new Error(`Đọc Gist thất bại: ${res.status}`);
        }
        const data = await res.json();
        const file = data.files && data.files[GIST_FILENAME];
        return file ? file.content : null;
    }

    /**
     * Validate token by listing gists
     * @returns {Promise<{valid:boolean, username:string}>}
     */
    async function testConnection() {
        try {
            const res = await fetch('https://api.github.com/user', {
                headers: _headers()
            });
            if (!res.ok) return { valid: false, username: '' };
            const user = await res.json();
            return { valid: true, username: user.login || '' };
        } catch (e) {
            return { valid: false, username: '' };
        }
    }

    // ── Core sync logic ─────────────────────────

    /**
     * Collect all syncable data into an object
     */
    function _collectLocalData() {
        const data = {};
        const keys = _getAllSyncKeys();
        keys.forEach(key => {
            try {
                const raw = localStorage.getItem(key);
                if (raw !== null) {
                    data[key] = {
                        value: JSON.parse(raw),
                        ts: Date.now()
                    };
                }
            } catch (e) {
                // skip corrupted keys
            }
        });
        return data;
    }

    /**
     * Write synced data into localStorage
     */
    function _applyRemoteData(remoteData) {
        Object.keys(remoteData).forEach(key => {
            try {
                const entry = remoteData[key];
                if (entry && entry.value !== undefined) {
                    localStorage.setItem(key, JSON.stringify(entry.value));
                }
            } catch (e) {
                console.warn('[Sync] Failed to apply key:', key, e);
            }
        });
    }

    /**
     * Merge local and remote data using per-key timestamps
     * Returns merged data object
     */
    function _mergeData(localData, remoteData) {
        const merged = {};
        const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);

        allKeys.forEach(key => {
            const local = localData[key];
            const remote = remoteData[key];

            if (local && !remote) {
                merged[key] = local;
            } else if (!local && remote) {
                merged[key] = remote;
            } else if (local && remote) {
                // For nexus_trades: merge arrays by trade id
                if (key === 'nexus_trades') {
                    merged[key] = _mergeTrades(local, remote);
                } else {
                    // Last-write-wins for other keys
                    merged[key] = (local.ts >= remote.ts) ? local : remote;
                }
            }
        });

        return merged;
    }

    /**
     * Smart merge for trades — combine by ID, don't lose entries
     */
    function _mergeTrades(local, remote) {
        const localTrades = Array.isArray(local.value) ? local.value : [];
        const remoteTrades = Array.isArray(remote.value) ? remote.value : [];

        const tradeMap = new Map();

        // Add remote trades first
        remoteTrades.forEach(t => {
            if (t && t.id) tradeMap.set(t.id, t);
        });

        // Local trades overwrite (more recent)
        localTrades.forEach(t => {
            if (t && t.id) tradeMap.set(t.id, t);
        });

        return {
            value: Array.from(tradeMap.values()),
            ts: Math.max(local.ts || 0, remote.ts || 0)
        };
    }

    // ── Public API ──────────────────────────────

    /**
     * Check if sync is configured and enabled
     */
    function isConfigured() {
        return !!(localStorage.getItem(CFG.TOKEN) && localStorage.getItem(CFG.PASSWORD));
    }

    function isEnabled() {
        return localStorage.getItem(CFG.ENABLED) === 'true';
    }

    /**
     * Initialize sync — test connection, create Gist if needed
     * @param {string} token — GitHub PAT
     * @param {string} password — Encryption password
     * @returns {Promise<{success:boolean, message:string}>}
     */
    async function init(token, password) {
        localStorage.setItem(CFG.TOKEN, token);
        localStorage.setItem(CFG.PASSWORD, password);

        // Test connection
        const conn = await testConnection();
        if (!conn.valid) {
            localStorage.removeItem(CFG.TOKEN);
            localStorage.removeItem(CFG.PASSWORD);
            return { success: false, message: 'Token không hợp lệ hoặc không có quyền Gist.' };
        }

        // Check if we already have a Gist ID
        let gistId = _getGistId();
        if (!gistId) {
            // Create initial Gist with empty encrypted payload
            try {
                const payload = JSON.stringify({ v: SYNC_VERSION, ts: new Date().toISOString(), data: {} });
                const encrypted = await NexusCrypto.encrypt(payload, password);
                const content = JSON.stringify({ v: SYNC_VERSION, ts: new Date().toISOString(), encrypted });
                gistId = await _createGist(content);
                localStorage.setItem(CFG.GIST_ID, gistId);
            } catch (e) {
                return { success: false, message: 'Tạo Gist thất bại: ' + e.message };
            }
        }

        localStorage.setItem(CFG.ENABLED, 'true');
        return { success: true, message: `Kết nối thành công! User: ${conn.username}` };
    }

    /**
     * Disconnect sync — remove credentials
     */
    function disconnect() {
        localStorage.removeItem(CFG.TOKEN);
        localStorage.removeItem(CFG.PASSWORD);
        localStorage.removeItem(CFG.ENABLED);
        // Keep GIST_ID so reconnecting can reuse the same Gist
    }

    /**
     * Push local data to Gist (force overwrite remote)
     */
    async function push() {
        if (!isConfigured()) throw new Error('Sync chưa được cấu hình');
        const password = localStorage.getItem(CFG.PASSWORD);
        const gistId = _getGistId();
        if (!gistId) throw new Error('Chưa có Gist ID — hãy kết nối lại');

        const data = _collectLocalData();
        const payload = JSON.stringify(data);
        const encrypted = await NexusCrypto.encrypt(payload, password);
        const content = JSON.stringify({
            v: SYNC_VERSION,
            ts: new Date().toISOString(),
            encrypted
        });

        await _updateGist(gistId, content);
        localStorage.setItem(CFG.LAST_SYNC, new Date().toISOString());
        localStorage.removeItem(CFG.DIRTY);
    }

    /**
     * Pull remote data from Gist (force overwrite local)
     */
    async function pull() {
        if (!isConfigured()) throw new Error('Sync chưa được cấu hình');
        const password = localStorage.getItem(CFG.PASSWORD);
        const gistId = _getGistId();
        if (!gistId) throw new Error('Chưa có Gist ID');

        const raw = await _fetchGist(gistId);
        if (!raw) throw new Error('Không tìm thấy dữ liệu trên Gist');

        const envelope = JSON.parse(raw);
        if (!envelope.encrypted) throw new Error('Dữ liệu Gist không hợp lệ');

        const decrypted = await NexusCrypto.decrypt(envelope.encrypted, password);
        const remoteData = JSON.parse(decrypted);

        _applyRemoteData(remoteData);
        localStorage.setItem(CFG.LAST_SYNC, new Date().toISOString());
        localStorage.removeItem(CFG.DIRTY);
    }

    /**
     * Smart sync — merge local + remote intelligently
     */
    async function sync() {
        if (!isConfigured()) throw new Error('Sync chưa được cấu hình');
        const password = localStorage.getItem(CFG.PASSWORD);
        const gistId = _getGistId();
        if (!gistId) throw new Error('Chưa có Gist ID');

        // Collect local
        const localData = _collectLocalData();

        // Fetch remote
        let remoteData = {};
        const raw = await _fetchGist(gistId);
        if (raw) {
            try {
                const envelope = JSON.parse(raw);
                if (envelope.encrypted) {
                    const decrypted = await NexusCrypto.decrypt(envelope.encrypted, password);
                    remoteData = JSON.parse(decrypted);
                }
            } catch (e) {
                console.warn('[Sync] Could not read remote, will overwrite:', e.message);
            }
        }

        // Merge
        const merged = _mergeData(localData, remoteData);

        // Apply merged data locally
        _applyRemoteData(merged);

        // Push merged data to remote
        const payload = JSON.stringify(merged);
        const encrypted = await NexusCrypto.encrypt(payload, password);
        const content = JSON.stringify({
            v: SYNC_VERSION,
            ts: new Date().toISOString(),
            encrypted
        });
        await _updateGist(gistId, content);

        localStorage.setItem(CFG.LAST_SYNC, new Date().toISOString());
        localStorage.removeItem(CFG.DIRTY);
    }

    /**
     * Mark data as changed (needs sync)
     */
    function markDirty() {
        if (isEnabled()) {
            localStorage.setItem(CFG.DIRTY, 'true');
        }
    }

    /**
     * Get current sync status
     * @returns {'synced'|'pending'|'offline'|'not-configured'}
     */
    function getStatus() {
        if (!isConfigured()) return 'not-configured';
        if (!navigator.onLine) return 'offline';
        if (localStorage.getItem(CFG.DIRTY) === 'true') return 'pending';
        return 'synced';
    }

    /**
     * Get last sync time as ISO string or null
     */
    function getLastSync() {
        return localStorage.getItem(CFG.LAST_SYNC) || null;
    }

    /**
     * Export all syncable data as plain JSON string (for backup)
     */
    function exportAll() {
        const data = {};
        const keys = _getAllSyncKeys();
        keys.forEach(key => {
            try {
                const raw = localStorage.getItem(key);
                if (raw !== null) data[key] = JSON.parse(raw);
            } catch (e) { /* skip */ }
        });
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            version: SYNC_VERSION,
            data
        }, null, 2);
    }

    /**
     * Import data from a backup JSON string
     * @param {string} jsonString
     * @returns {{success:boolean, message:string, count:number}}
     */
    function importAll(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.data || typeof parsed.data !== 'object') {
                return { success: false, message: 'File không hợp lệ — thiếu trường "data"', count: 0 };
            }
            let count = 0;
            Object.keys(parsed.data).forEach(key => {
                try {
                    localStorage.setItem(key, JSON.stringify(parsed.data[key]));
                    count++;
                } catch (e) { /* skip */ }
            });
            return { success: true, message: `Đã import ${count} mục dữ liệu`, count };
        } catch (e) {
            return { success: false, message: 'File JSON không hợp lệ: ' + e.message, count: 0 };
        }
    }

    return {
        CFG,
        isConfigured,
        isEnabled,
        init,
        disconnect,
        push,
        pull,
        sync,
        markDirty,
        getStatus,
        getLastSync,
        testConnection,
        exportAll,
        importAll,
    };
})();
