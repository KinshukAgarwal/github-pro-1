import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  CheckCircle,
  Circle,
  Play,
  Pause,
  MoreHorizontal,
  Search,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Trash2,
  BookOpen,
  Code,
  AlertCircle
} from 'lucide-react'
import { useRoadmap, useUpdateRoadmapItem, useRemoveRoadmapItem } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'

interface RoadmapItem {
  id: string
  type: 'project' | 'technology'
  name: string
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  meta: any
  created_at: string
  updated_at: string
}

interface GroupedItems {
  [key: string]: RoadmapItem[]
}

const RoadmapDashboard: React.FC = () => {
  const { data: roadmapData, isLoading, error, refetch } = useRoadmap()
  const updateItem = useUpdateRoadmapItem()
  const removeItem = useRemoveRoadmapItem()
  
  const [filter, setFilter] = useState<'all' | 'project' | 'technology'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed' | 'paused'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showItemMenu, setShowItemMenu] = useState<string | null>(null)

  const roadmapItems: RoadmapItem[] = roadmapData?.data?.items || []

  // Group items by name
  const groupedItems = roadmapItems.reduce((groups: GroupedItems, item) => {
    const groupName = item.name
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(item)
    return groups
  }, {})

  const filteredGroups = Object.entries(groupedItems).filter(([groupName, items]) => {
    const matchesSearch = groupName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filter === 'all' || items.some(item => item.type === filter)
    const matchesStatus = statusFilter === 'all' || items.some(item => item.status === statusFilter)
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: roadmapItems.length,
    totalGroups: Object.keys(groupedItems).length,
    inProgress: roadmapItems.filter(item => item.status === 'in-progress').length,
    completed: roadmapItems.filter(item => item.status === 'completed').length
  }

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await updateItem.mutateAsync({ itemId, updates: { status: newStatus } })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId)
      setShowDeleteConfirm(null)
      setShowItemMenu(null)
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'project' ? 
      <Code className="h-4 w-4 text-blue-500" /> : 
      <BookOpen className="h-4 w-4 text-green-500" />
  }

  const getGroupProgress = (items: RoadmapItem[]) => {
    const completed = items.filter(item => item.status === 'completed').length
    return Math.round((completed / items.length) * 100)
  }

  const getGroupStatus = (items: RoadmapItem[]) => {
    const hasInProgress = items.some(item => item.status === 'in-progress')
    const allCompleted = items.every(item => item.status === 'completed')
    
    if (allCompleted) return 'completed'
    if (hasInProgress) return 'in-progress'
    return 'not-started'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          <p>Failed to load roadmap data</p>
        </div>
        <button onClick={() => refetch()} className="btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Learning Paths</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGroups}</p>
            </div>
            <Target className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <Play className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search learning paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="technology">Technologies</option>
              <option value="project">Projects</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start your learning journey by creating your first learning path.'
              }
            </p>
          </div>
        ) : (
          filteredGroups.map(([groupName, items]) => {
            const isExpanded = expandedGroups.has(groupName)
            const groupProgress = getGroupProgress(items)
            const groupStatus = getGroupStatus(items)
            const primaryItem = items[0]

            return (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        {getTypeIcon(primaryItem.type)}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(groupStatus)}`}>
                            {groupStatus.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Progress Bar */}
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${groupProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{groupProgress}%</span>
                      </div>

                      {getStatusIcon(groupStatus)}
                    </div>
                  </div>
                </div>

                {/* Expanded Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-4 space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-500 w-8">
                                #{index + 1}
                              </span>
                              {getStatusIcon(item.status)}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.meta?.title || `${item.name} Module ${index + 1}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.meta?.description || `Learn ${item.name} fundamentals`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Updated {formatTimeAgo(item.updated_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Status Selector */}
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="not-started">Not Started</option>
                                <option value="in-progress">In Progress</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                              </select>

                              {/* Item Menu */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowItemMenu(showItemMenu === item.id ? null : item.id)
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {showItemMenu === item.id && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDeleteConfirm(item.id)
                                        setShowItemMenu(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Item</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showItemMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowItemMenu(null)}
        />
      )}
    </div>
  )
}

export default RoadmapDashboard
