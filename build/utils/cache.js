export class Cache {
    store = new Map();
    ttl;
    constructor(ttlMs) {
        this.ttl = ttlMs;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.ttl) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    set(key, value) {
        this.store.set(key, {
            value,
            timestamp: Date.now(),
        });
    }
    clear() {
        this.store.clear();
    }
}
