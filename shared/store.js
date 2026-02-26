/* ═══════════════════════════════════════════════
   NEXUS — Shared localStorage Manager
   Cross-tool data store with reactive subscriptions
   ═══════════════════════════════════════════════ */

const Store = (() => {
    const KEYS = {
        COT_LATEST: 'nexus_cot_latest',
        WEEKLY_BIAS: 'nexus_weekly_bias',
        DAILY_BIAS: 'nexus_daily_bias',
        TRADES: 'nexus_trades',
        INTEREST_RATES: 'nexus_rates',
        ALERT_HISTORY: 'nexus_alerts',
        SETTINGS: 'nexus_settings',
        CALC_HISTORY: 'nexus_calc_history',
        GITHUB_CONFIG: 'nexus_github_config',
        MATRIX_CACHE: 'nexus_matrix_cache',
    };

    const _listeners = {};

    function get(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('[Store] Failed to parse', key, e);
            return null;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            _notify(key, value);
            // Trigger sync dirty flag if SyncEngine is loaded
            if (typeof SyncEngine !== 'undefined' && SyncEngine.markDirty) {
                SyncEngine.markDirty();
            }
        } catch (e) {
            console.error('[Store] Failed to save', key, e);
        }
    }

    function remove(key) {
        localStorage.removeItem(key);
        _notify(key, null);
        if (typeof SyncEngine !== 'undefined' && SyncEngine.markDirty) {
            SyncEngine.markDirty();
        }
    }

    // Subscribe to changes — returns unsubscribe function
    function subscribe(key, callback) {
        if (!_listeners[key]) _listeners[key] = [];
        _listeners[key].push(callback);
        return () => {
            _listeners[key] = _listeners[key].filter(fn => fn !== callback);
        };
    }

    function _notify(key, value) {
        if (_listeners[key]) {
            _listeners[key].forEach(fn => {
                try { fn(value); } catch (e) { console.error('[Store] Listener error', e); }
            });
        }
    }

    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key && _listeners[e.key]) {
            let newValue = null;
            try { newValue = e.newValue ? JSON.parse(e.newValue) : null; } catch (_) { }
            _listeners[e.key].forEach(fn => {
                try { fn(newValue); } catch (err) { console.error('[Store] Cross-tab listener error', err); }
            });
        }
    });

    return { KEYS, get, set, remove, subscribe };
})();
