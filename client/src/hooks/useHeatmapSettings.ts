import { useState, useEffect } from 'react'

export interface HeatmapSettings {
  colorScheme: 'github' | 'ocean' | 'fire' | 'forest' | 'purple' | 'sunset'
  showStats: boolean
  showWeekdays: boolean
  showMonths: boolean
  cellSize: 'small' | 'medium' | 'large'
  animationSpeed: 'slow' | 'normal' | 'fast'
  showTooltips: boolean
  highlightWeekends: boolean
}

const DEFAULT_SETTINGS: HeatmapSettings = {
  colorScheme: 'github',
  showStats: true,
  showWeekdays: true,
  showMonths: true,
  cellSize: 'medium',
  animationSpeed: 'normal',
  showTooltips: true,
  highlightWeekends: false
}

const STORAGE_KEY = 'heatmap-settings'

export const useHeatmapSettings = () => {
  const [settings, setSettings] = useState<HeatmapSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load heatmap settings from localStorage:', error)
    }
    return DEFAULT_SETTINGS
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save heatmap settings to localStorage:', error)
    }
  }, [settings])

  const updateSettings = (updates: Partial<HeatmapSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    setSettings
  }
}

export default useHeatmapSettings
