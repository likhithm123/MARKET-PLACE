import { Injectable, OnModuleDestroy } from '@nestjs/common'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  private read(key: string) {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async onModuleDestroy() { this.store.clear() }
  async get(key: string) { return this.read(key) }
  async set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined })
    return 'OK'
  }
  async del(key: string) { return this.store.delete(key) ? 1 : 0 }
  async exists(key: string) { return this.read(key) !== null ? 1 : 0 }
  async ttl(key: string) {
    const item = this.store.get(key)
    if (!item) return -2
    if (!item.expiresAt) return -1
    const seconds = Math.ceil((item.expiresAt - Date.now()) / 1000)
    if (seconds <= 0) { this.store.delete(key); return -2 }
    return seconds
  }
  async incrWithExpiry(key: string, ttlSeconds: number) {
    const current = Number(this.read(key) ?? '0') + 1
    await this.set(key, String(current), current === 1 ? ttlSeconds : Math.max(await this.ttl(key), 1))
    return current
  }
}