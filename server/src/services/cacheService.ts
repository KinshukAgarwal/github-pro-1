// Load environment variables FIRST
import '@/config/env'

import { createClient, RedisClientType } from 'redis'
import logger from '@/utils/logger'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

export class CacheService {
  private client: RedisClientType | null = null
  private isConnected = false
  private defaultTTL: number
  private lastErrorLog = 0
  private errorLogInterval = 30000 // Log errors at most every 30 seconds

  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL || '300') // 5 minutes default
    this.connect()
  }

  private logError(message: string, error?: any) {
    const now = Date.now()
    if (now - this.lastErrorLog > this.errorLogInterval) {
      logger.warn(message, error)
      this.lastErrorLog = now
    }
  }

  private async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.client = createClient({ url: redisUrl })

      this.client.on('error', (err) => {
        this.logError('Redis Client Error (continuing without cache)', err.message)
        this.isConnected = false
        this.client = null
      })

      this.client.on('connect', () => {
        logger.info('Connected to Redis')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        logger.warn('Disconnected from Redis')
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      const err = error as any
      logger.warn('Failed to connect to Redis (continuing without cache):', err?.message || String(err))
      this.client = null
      this.isConnected = false
    }
  }

  private generateKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || 'github-analytics'
    return `${keyPrefix}:${key}`
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const value = await this.client.get(cacheKey)
      
      if (value) {
        logger.debug(`Cache hit for key: ${cacheKey}`)
        return JSON.parse(value)
      }
      
      logger.debug(`Cache miss for key: ${cacheKey}`)
      return null
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const ttl = options.ttl || this.defaultTTL
      const serializedValue = JSON.stringify(value)
      
      await this.client.setEx(cacheKey, ttl, serializedValue)
      logger.debug(`Cache set for key: ${cacheKey}, TTL: ${ttl}s`)
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const result = await this.client.del(cacheKey)
      logger.debug(`Cache delete for key: ${cacheKey}`)
      return result > 0
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const result = await this.client.exists(cacheKey)
      return result > 0
    } catch (error) {
      logger.error('Cache exists error:', error)
      return false
    }
  }

  async flush(pattern?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      if (pattern) {
        const keys = await this.client.keys(pattern)
        if (keys.length > 0) {
          await this.client.del(keys)
        }
        logger.info(`Flushed ${keys.length} keys matching pattern: ${pattern}`)
      } else {
        await this.client.flushAll()
        logger.info('Flushed all cache')
      }
      return true
    } catch (error) {
      logger.error('Cache flush error:', error)
      return false
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    try {
      // Fetch fresh data
      const freshData = await fetchFunction()
      
      // Store in cache
      await this.set(key, freshData, options)
      
      return freshData
    } catch (error) {
      logger.error('Cache getOrSet error:', error)
      return null
    }
  }

  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    if (!this.isConnected || !this.client) {
      return keys.map(() => null)
    }

    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options.prefix))
      const values = await this.client.mGet(cacheKeys)
      
      return values.map(value => {
        if (value) {
          try {
            return JSON.parse(value)
          } catch {
            return null
          }
        }
        return null
      })
    } catch (error) {
      logger.error('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const ttl = options.ttl || this.defaultTTL
      
      // Use pipeline for better performance
      const pipeline = this.client.multi()
      
      keyValuePairs.forEach(({ key, value }) => {
        const cacheKey = this.generateKey(key, options.prefix)
        const serializedValue = JSON.stringify(value)
        pipeline.setEx(cacheKey, ttl, serializedValue)
      })
      
      await pipeline.exec()
      logger.debug(`Cache mset for ${keyValuePairs.length} keys`)
      return true
    } catch (error) {
      logger.error('Cache mset error:', error)
      return false
    }
  }

  async increment(key: string, amount = 1, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isConnected || !this.client) {
      return null
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const result = await this.client.incrBy(cacheKey, amount)
      
      // Set expiration if it's a new key
      const ttl = options.ttl || this.defaultTTL
      await this.client.expire(cacheKey, ttl)
      
      return result
    } catch (error) {
      logger.error('Cache increment error:', error)
      return null
    }
  }

  async getTTL(key: string, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isConnected || !this.client) {
      return null
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix)
      const ttl = await this.client.ttl(cacheKey)
      return ttl
    } catch (error) {
      logger.error('Cache getTTL error:', error)
      return null
    }
  }

  isHealthy(): boolean {
    return this.isConnected
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect()
      this.isConnected = false
      logger.info('Disconnected from Redis')
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()
