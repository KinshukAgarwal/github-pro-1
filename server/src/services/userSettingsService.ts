import logger from '../utils/logger'

interface UserSetting {
  userId: string
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

// In-memory storage for user settings (in production, this would be a database)
const userSettings = new Map<string, Map<string, any>>()

class UserSettingsService {
  private getUserSettings(userId: string): Map<string, any> {
    if (!userSettings.has(userId)) {
      userSettings.set(userId, new Map())
    }
    return userSettings.get(userId)!
  }

  async getSetting(userId: string, key: string): Promise<any> {
    try {
      const settings = this.getUserSettings(userId)
      return settings.get(key) || null
    } catch (error) {
      logger.error('Error getting user setting:', error)
      return null
    }
  }

  async setSetting(userId: string, key: string, value: any): Promise<void> {
    try {
      const settings = this.getUserSettings(userId)
      settings.set(key, {
        ...value,
        updatedAt: new Date().toISOString()
      })
      logger.info(`Setting updated for user ${userId}: ${key}`)
    } catch (error) {
      logger.error('Error setting user setting:', error)
      throw error
    }
  }

  async getAllSettings(userId: string): Promise<Record<string, any>> {
    try {
      const settings = this.getUserSettings(userId)
      const result: Record<string, any> = {}
      
      for (const [key, value] of settings.entries()) {
        result[key] = value
      }
      
      return result
    } catch (error) {
      logger.error('Error getting all user settings:', error)
      return {}
    }
  }

  async deleteSetting(userId: string, key: string): Promise<void> {
    try {
      const settings = this.getUserSettings(userId)
      settings.delete(key)
      logger.info(`Setting deleted for user ${userId}: ${key}`)
    } catch (error) {
      logger.error('Error deleting user setting:', error)
      throw error
    }
  }

  async deleteAllSettings(userId: string): Promise<void> {
    try {
      userSettings.delete(userId)
      logger.info(`All settings deleted for user ${userId}`)
    } catch (error) {
      logger.error('Error deleting all user settings:', error)
      throw error
    }
  }

  async updateSetting(userId: string, key: string, updates: Partial<any>): Promise<void> {
    try {
      const settings = this.getUserSettings(userId)
      const currentValue = settings.get(key) || {}
      
      const updatedValue = {
        ...currentValue,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      settings.set(key, updatedValue)
      logger.info(`Setting updated for user ${userId}: ${key}`)
    } catch (error) {
      logger.error('Error updating user setting:', error)
      throw error
    }
  }

  // Utility methods for common settings
  async getUserPreferences(userId: string): Promise<any> {
    return this.getSetting(userId, 'preferences') || {
      theme: 'light',
      notifications: true,
      language: 'en',
      timezone: 'UTC'
    }
  }

  async setUserPreferences(userId: string, preferences: any): Promise<void> {
    return this.setSetting(userId, 'preferences', preferences)
  }

  async getRoadmap(userId: string): Promise<any> {
    return this.getSetting(userId, 'roadmap') || { items: [] }
  }

  async setRoadmap(userId: string, roadmap: any): Promise<void> {
    return this.setSetting(userId, 'roadmap', roadmap)
  }

  async getCareerInsights(userId: string): Promise<any> {
    return this.getSetting(userId, 'career_insights') || {}
  }

  async setCareerInsights(userId: string, insights: any): Promise<void> {
    return this.setSetting(userId, 'career_insights', insights)
  }

  // Backup and restore functionality
  async exportUserData(userId: string): Promise<any> {
    try {
      const allSettings = await this.getAllSettings(userId)
      return {
        userId,
        exportedAt: new Date().toISOString(),
        settings: allSettings
      }
    } catch (error) {
      logger.error('Error exporting user data:', error)
      throw error
    }
  }

  async importUserData(userId: string, data: any): Promise<void> {
    try {
      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
          await this.setSetting(userId, key, value)
        }
      }
      logger.info(`User data imported for user ${userId}`)
    } catch (error) {
      logger.error('Error importing user data:', error)
      throw error
    }
  }

  // Analytics and insights
  async getUserStats(userId: string): Promise<any> {
    try {
      const settings = this.getUserSettings(userId)
      const roadmap = await this.getRoadmap(userId)
      const preferences = await this.getUserPreferences(userId)
      
      return {
        totalSettings: settings.size,
        roadmapItems: roadmap.items?.length || 0,
        lastActivity: this.getLastActivityDate(userId),
        accountAge: this.getAccountAge(userId)
      }
    } catch (error) {
      logger.error('Error getting user stats:', error)
      return {}
    }
  }

  private getLastActivityDate(userId: string): string | null {
    try {
      const settings = this.getUserSettings(userId)
      let lastActivity: Date | null = null
      
      for (const [, value] of settings.entries()) {
        if (value.updatedAt) {
          const date = new Date(value.updatedAt)
          if (!lastActivity || date > lastActivity) {
            lastActivity = date
          }
        }
      }
      
      return lastActivity ? lastActivity.toISOString() : null
    } catch (error) {
      return null
    }
  }

  private getAccountAge(userId: string): number {
    try {
      const settings = this.getUserSettings(userId)
      let earliestDate: Date | null = null
      
      for (const [, value] of settings.entries()) {
        if (value.createdAt) {
          const date = new Date(value.createdAt)
          if (!earliestDate || date < earliestDate) {
            earliestDate = date
          }
        }
      }
      
      if (earliestDate) {
        return Math.floor((Date.now() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      return 0
    } catch (error) {
      return 0
    }
  }
}

// Create singleton instance
export const userSettingsService = new UserSettingsService()
export default userSettingsService
