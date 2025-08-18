import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  Palette,
  Eye,
  BarChart3,
  TrendingUp,
  Flame,
  Target,
  Award,
  Zap,
  RotateCcw
} from 'lucide-react'
import { useHeatmapSettings, HeatmapSettings } from '@/hooks/useHeatmapSettings'

interface ContributionData {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}



interface ContributionHeatmapProps {
  data: ContributionData[]
  year?: number
  className?: string
  onYearChange?: (year: number) => void
  availableYears?: number[]
}

const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  data,
  year = new Date().getFullYear(),
  className = '',
  onYearChange,
  availableYears = []
}) => {
  const [selectedYear, setSelectedYear] = useState(year)
  const [showSettings, setShowSettings] = useState(false)
  const { settings, updateSettings, resetSettings } = useHeatmapSettings()


  // Update selected year when prop changes
  useEffect(() => {
    setSelectedYear(year)
  }, [year])

  // Generate available years if not provided
  const years = useMemo(() => {
    if (availableYears.length > 0) return availableYears
    const currentYear = new Date().getFullYear()
    const startYear = Math.max(2020, currentYear - 5) // Show last 5 years or from 2020
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse()
  }, [availableYears])

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear)
    onYearChange?.(newYear)
  }

  const { weeks, months, stats } = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1)
    const endDate = new Date(selectedYear, 11, 31)

    // Adjust start date to Sunday
    const startDay = startDate.getDay()
    if (startDay !== 0) {
      startDate.setDate(startDate.getDate() - startDay)
    }
    
    const weeks: ContributionData[][] = []
    const months: { name: string; weeks: number }[] = []
    
    let currentWeek: ContributionData[] = []
    let currentDate = new Date(startDate)
    let currentMonth = currentDate.getMonth()
    let monthWeekCount = 0
    
    const dataMap = new Map(data.map(d => [d.date, d]))
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const contribution = dataMap.get(dateStr) || {
        date: dateStr,
        count: 0,
        level: 0 as const
      }
      
      currentWeek.push(contribution)
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
        monthWeekCount++
      }

      // Check if month changed
      if (currentDate.getMonth() !== currentMonth) {
        months.push({
          name: new Date(selectedYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }),
          weeks: monthWeekCount
        })
        currentMonth = currentDate.getMonth()
        monthWeekCount = 0
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Add remaining week if exists
    if (currentWeek.length > 0) {
      // Fill remaining days with empty contributions
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0
        })
      }
      weeks.push(currentWeek)
      monthWeekCount++
    }
    
    // Add final month
    if (monthWeekCount > 0) {
      months.push({
        name: new Date(selectedYear, currentMonth).toLocaleDateString('en-US', { month: 'short' }),
        weeks: monthWeekCount
      })
    }
    
    // Calculate stats
    const totalContributions = data.reduce((sum, d) => sum + d.count, 0)
    const maxStreak = calculateMaxStreak(data)
    const currentStreak = calculateCurrentStreak(data)
    
    return {
      weeks,
      months,
      stats: {
        total: totalContributions,
        maxStreak,
        currentStreak,
        averagePerDay: Math.round((totalContributions / 365) * 10) / 10
      }
    }
  }, [data, selectedYear])

  const getColorScheme = (scheme: string) => {
    const schemes = {
      github: [
        'bg-gray-100 dark:bg-gray-800', // Level 0
        'bg-green-200 dark:bg-green-900', // Level 1
        'bg-green-400 dark:bg-green-700', // Level 2
        'bg-green-600 dark:bg-green-500', // Level 3
        'bg-green-800 dark:bg-green-300'  // Level 4
      ],
      ocean: [
        'bg-gray-100 dark:bg-gray-800',
        'bg-blue-200 dark:bg-blue-900',
        'bg-blue-400 dark:bg-blue-700',
        'bg-blue-600 dark:bg-blue-500',
        'bg-blue-800 dark:bg-blue-300'
      ],
      fire: [
        'bg-gray-100 dark:bg-gray-800',
        'bg-orange-200 dark:bg-orange-900',
        'bg-orange-400 dark:bg-orange-700',
        'bg-red-500 dark:bg-red-600',
        'bg-red-700 dark:bg-red-400'
      ],
      forest: [
        'bg-gray-100 dark:bg-gray-800',
        'bg-emerald-200 dark:bg-emerald-900',
        'bg-emerald-400 dark:bg-emerald-700',
        'bg-emerald-600 dark:bg-emerald-500',
        'bg-emerald-800 dark:bg-emerald-300'
      ],
      purple: [
        'bg-gray-100 dark:bg-gray-800',
        'bg-purple-200 dark:bg-purple-900',
        'bg-purple-400 dark:bg-purple-700',
        'bg-purple-600 dark:bg-purple-500',
        'bg-purple-800 dark:bg-purple-300'
      ],
      sunset: [
        'bg-gray-100 dark:bg-gray-800',
        'bg-yellow-200 dark:bg-yellow-900',
        'bg-orange-400 dark:bg-orange-700',
        'bg-red-500 dark:bg-red-600',
        'bg-pink-700 dark:bg-pink-400'
      ]
    }
    return schemes[scheme as keyof typeof schemes] || schemes.github
  }

  const getLevelColor = (level: number) => {
    const colors = getColorScheme(settings.colorScheme)
    return colors[level] || colors[0]
  }

  const getCellSize = () => {
    const sizes = {
      small: 'w-2.5 h-2.5',
      medium: 'w-3 h-3',
      large: 'w-4 h-4'
    }
    return sizes[settings.cellSize]
  }

  const getAnimationDelay = (weekIndex: number, dayIndex: number) => {
    const speeds = {
      slow: 0.003,
      normal: 0.001,
      fast: 0.0005
    }
    return (weekIndex * 7 + dayIndex) * speeds[settings.animationSpeed]
  }

  const getLevelIntensity = (count: number) => {
    if (count === 0) return 0
    if (count <= 3) return 1
    if (count <= 6) return 2
    if (count <= 9) return 3
    return 4
  }

  const formatTooltip = (contribution: ContributionData) => {
    if (!contribution.date) return ''
    const date = new Date(contribution.date)
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return `${contribution.count} contributions on ${formattedDate}`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Year Selection and Settings */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Contribution Activity
          </h3>

          {/* Year Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const currentIndex = years.indexOf(selectedYear)
                if (currentIndex < years.length - 1) {
                  handleYearChange(years[currentIndex + 1])
                }
              }}
              disabled={years.indexOf(selectedYear) >= years.length - 1}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              onClick={() => {
                const currentIndex = years.indexOf(selectedYear)
                if (currentIndex > 0) {
                  handleYearChange(years[currentIndex - 1])
                }
              }}
              disabled={years.indexOf(selectedYear) <= 0}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Customize</span>
        </button>
      </div>

      {/* Enhanced Stats Summary */}
      {settings.showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-sm text-blue-700">Total contributions</div>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.maxStreak}</div>
                <div className="text-sm text-green-700">Longest streak</div>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">{stats.currentStreak}</div>
                <div className="text-sm text-orange-700">Current streak</div>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">{stats.averagePerDay}</div>
                <div className="text-sm text-purple-700">Average per day</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Heatmap Settings
              </h4>
              <button
                onClick={resetSettings}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Scheme</label>
                <select
                  value={settings.colorScheme}
                  onChange={(e) => updateSettings({ colorScheme: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="github">GitHub Green</option>
                  <option value="ocean">Ocean Blue</option>
                  <option value="fire">Fire Orange</option>
                  <option value="forest">Forest Green</option>
                  <option value="purple">Purple</option>
                  <option value="sunset">Sunset</option>
                </select>
              </div>

              {/* Cell Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cell Size</label>
                <select
                  value={settings.cellSize}
                  onChange={(e) => updateSettings({ cellSize: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Animation Speed</label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) => updateSettings({ animationSpeed: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {/* Toggle Options */}
              {[
                { key: 'showStats', label: 'Show Statistics', icon: BarChart3 },
                { key: 'showWeekdays', label: 'Show Weekdays', icon: Calendar },
                { key: 'showTooltips', label: 'Show Tooltips', icon: Eye },
                { key: 'highlightWeekends', label: 'Highlight Weekends', icon: Target }
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof HeatmapSettings] as boolean}
                    onChange={(e) => updateSettings({ [key]: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heatmap */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">{selectedYear} Activity</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`${getCellSize()} rounded-sm ${getLevelColor(level)} transition-colors`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            {settings.showMonths && (
              <div className="flex mb-3">
                <div className="w-8"></div> {/* Space for day labels */}
                {months.map((month, index) => (
                  <div
                    key={index}
                    className="text-xs font-medium text-gray-700 text-center"
                    style={{ width: `${month.weeks * (settings.cellSize === 'small' ? 14 : settings.cellSize === 'medium' ? 16 : 20)}px` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
            )}

            {/* Day labels and heatmap */}
            <div className="flex">
              {/* Day labels */}
              {settings.showWeekdays && (
                <div className="flex flex-col justify-between text-xs font-medium text-gray-700 mr-3">
                  <div className={getCellSize().split(' ')[1]}></div>
                  <div>Mon</div>
                  <div className={getCellSize().split(' ')[1]}></div>
                  <div>Wed</div>
                  <div className={getCellSize().split(' ')[1]}></div>
                  <div>Fri</div>
                  <div className={getCellSize().split(' ')[1]}></div>
                </div>
              )}

              {/* Heatmap grid */}
              <div className="flex space-x-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col space-y-1">
                    {week.map((day, dayIndex) => {
                      const isWeekend = settings.highlightWeekends && (dayIndex === 0 || dayIndex === 6)
                      return (
                        <motion.div
                          key={`${weekIndex}-${dayIndex}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: getAnimationDelay(weekIndex, dayIndex),
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }}
                          className={`
                            ${getCellSize()}
                            rounded-sm cursor-pointer transition-all duration-200
                            hover:scale-110 hover:shadow-lg hover:z-10 relative
                            ${day.date ? getLevelColor(getLevelIntensity(day.count)) : 'bg-transparent'}
                            ${isWeekend ? 'ring-1 ring-blue-200' : ''}
                          `}
                          title={settings.showTooltips && day.date ? formatTooltip(day) : ''}
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Learn how we count contributions</span>
            <div className="flex items-center space-x-2">
              <span>Color scheme:</span>
              <span className="font-medium capitalize">{settings.colorScheme}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Total days: {weeks.length * 7}</span>
            <span>•</span>
            <span>Active days: {data.filter(d => d.count > 0).length}</span>
            <span>•</span>
            <span>Completion: {Math.round((data.filter(d => d.count > 0).length / (weeks.length * 7)) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function calculateMaxStreak(data: ContributionData[]): number {
  let maxStreak = 0
  let currentStreak = 0
  
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  for (const contribution of sortedData) {
    if (contribution.count > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return maxStreak
}

function calculateCurrentStreak(data: ContributionData[]): number {
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  let streak = 0
  for (const contribution of sortedData) {
    if (contribution.count > 0) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

export default ContributionHeatmap
