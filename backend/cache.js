// Simple in-memory cache with TTL and max size (LRU-ish eviction by insertion order)
class SimpleCache {
  constructor({ maxEntries = 100, defaultTtlMs = 15000 } = {}) {
    this.store = new Map(); // key -> { value, expiresAt }
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  _evictIfNeeded() {
    while (this.store.size > this.maxEntries) {
      // Evict oldest entry (Map preserves insertion order)
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
  }

  set(key, value, ttlMs) {
    const expiresAt = Date.now() + (ttlMs != null ? ttlMs : this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
    this._evictIfNeeded();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) != null;
  }

  clear() {
    this.store.clear();
  }
}

module.exports = {
  SimpleCache,
};
