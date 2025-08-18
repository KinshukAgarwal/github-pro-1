import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, MoreVertical } from 'lucide-react'

interface RoadmapItem {
  id: string
  name: string
  type: 'technology' | 'project' | 'certification' | 'milestone'
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  progress: { percent: number; completedSteps: string[] }
  meta: {
    learning_path?: Array<{ title: string; description?: string; estimated_hours?: number }>
    time_to_proficiency?: string
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    prerequisites?: string[]
  }
  dependencies?: string[]
  milestones?: Array<{ title: string; date: string; completed: boolean }>
  created_at: string
  updated_at: string
  target_date?: string
}

interface RoadmapKanbanProps {
  items: RoadmapItem[]
  onUpdateItem: (id: string, updates: any) => void
  onRemoveItem: (id: string) => void
}

const RoadmapKanban = ({ items, onUpdateItem, onRemoveItem }: RoadmapKanbanProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const columns = [
    { id: 'not-started', title: 'Not Started', color: 'bg-gray-100', icon: Circle },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100', icon: Clock },
    { id: 'blocked', title: 'Blocked', color: 'bg-red-100', icon: AlertTriangle },
    { id: 'completed', title: 'Completed', color: 'bg-green-100', icon: CheckCircle2 }
  ]

  const getItemsByStatus = (status: string) => {
    return items.filter(item => item.status === status)
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedItem) {
      onUpdateItem(draggedItem, { status: newStatus })
      setDraggedItem(null)
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technology':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'project':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'certification':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'milestone':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnItems = getItemsByStatus(column.id)
        const IconComponent = column.icon

        return (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={`${column.color} rounded-lg p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                </div>
                <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                  {columnItems.length}
                </span>
              </div>
            </div>

            {/* Column Items */}
            <div className="space-y-3 flex-1">
              {columnItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, item.id)}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded border ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        {item.meta.difficulty && (
                          <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(item.meta.difficulty)}`}>
                            {item.meta.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{item.progress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="space-y-2 text-xs text-gray-600">
                    {item.meta.time_to_proficiency && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.meta.time_to_proficiency}</span>
                      </div>
                    )}
                    
                    {item.target_date && (
                      <div className="flex items-center justify-between">
                        <span>Target:</span>
                        <span className="font-medium">{formatDate(item.target_date)}</span>
                      </div>
                    )}

                    {item.dependencies && item.dependencies.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Dependencies:</span>
                        <span className="font-medium">{item.dependencies.length}</span>
                      </div>
                    )}

                    {item.meta.learning_path && (
                      <div className="flex items-center justify-between">
                        <span>Steps:</span>
                        <span className="font-medium">
                          {item.progress.completedSteps.length}/{item.meta.learning_path.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Milestones */}
                  {item.milestones && item.milestones.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-600 mb-2">Next Milestone:</div>
                      {(() => {
                        const nextMilestone = item.milestones.find(m => !m.completed)
                        return nextMilestone ? (
                          <div className="text-xs">
                            <div className="font-medium text-gray-900">{nextMilestone.title}</div>
                            <div className="text-gray-600">{formatDate(nextMilestone.date)}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-green-600 font-medium">All milestones completed!</div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                    <button
                      onClick={() => onUpdateItem(item.id, { 
                        status: item.status === 'completed' ? 'in-progress' : 'completed',
                        progress: { ...item.progress, percent: item.status === 'completed' ? 0 : 100 }
                      })}
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === 'completed' 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {item.status === 'completed' ? 'Reopen' : 'Complete'}
                    </button>
                    
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Add Item Button */}
              {columnItems.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Plus className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Drop items here or add new ones
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoadmapKanban
