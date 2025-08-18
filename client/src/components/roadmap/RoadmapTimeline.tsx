import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, Target, ArrowRight, Calendar, Trophy, BookOpen } from 'lucide-react'
import RoadmapKanban from './RoadmapKanban'
import RoadmapDependencies from './RoadmapDependencies'

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

interface RoadmapTimelineProps {
  items: RoadmapItem[]
  onUpdateItem: (id: string, updates: any) => void
  onRemoveItem: (id: string) => void
}

const RoadmapTimeline = ({ items, onUpdateItem, onRemoveItem }: RoadmapTimelineProps) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'dependencies'>('timeline')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'in-progress':
        return <Clock className="h-6 w-6 text-blue-600" />
      case 'blocked':
        return <Circle className="h-6 w-6 text-red-600" />
      default:
        return <Circle className="h-6 w-6 text-gray-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technology':
        return <BookOpen className="h-4 w-4" />
      case 'project':
        return <Target className="h-4 w-4" />
      case 'certification':
        return <Trophy className="h-4 w-4" />
      case 'milestone':
        return <Calendar className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
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

  const sortedItems = [...items].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const renderTimelineView = () => (
    <div className="space-y-6">
      {sortedItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative pl-8 ${selectedItem === item.id ? 'bg-blue-50 rounded-lg p-4' : ''}`}
        >
          {/* Timeline line */}
          {index < sortedItems.length - 1 && (
            <div className="absolute left-3 top-8 w-0.5 h-16 bg-gray-200" />
          )}
          
          {/* Status icon */}
          <div className="absolute left-0 top-2">
            {getStatusIcon(item.status)}
          </div>

          <div className="card cursor-pointer" onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getTypeIcon(item.type)}
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(item.meta.difficulty)}`}>
                    {item.meta.difficulty || 'intermediate'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
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

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {item.meta.time_to_proficiency && (
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.meta.time_to_proficiency}</span>
                    </span>
                  )}
                  {item.target_date && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Target: {new Date(item.target_date).toLocaleDateString()}</span>
                    </span>
                  )}
                  {item.dependencies && item.dependencies.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <ArrowRight className="h-4 w-4" />
                      <span>{item.dependencies.length} dependencies</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateItem(item.id, { 
                      status: item.status === 'completed' ? 'in-progress' : 'completed',
                      progress: { ...item.progress, percent: item.status === 'completed' ? 0 : 100 }
                    })
                  }}
                  className={`px-3 py-1 text-xs rounded ${
                    item.status === 'completed' 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.status === 'completed' ? 'Reopen' : 'Complete'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveItem(item.id)
                  }}
                  className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {selectedItem === item.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                {/* Learning path */}
                {item.meta.learning_path && item.meta.learning_path.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Learning Path</h4>
                    <div className="space-y-2">
                      {item.meta.learning_path.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.progress.completedSteps.includes(step.title)}
                            onChange={(e) => {
                              const completedSteps = e.target.checked
                                ? [...item.progress.completedSteps, step.title]
                                : item.progress.completedSteps.filter(s => s !== step.title)
                              const percent = Math.round((completedSteps.length / item.meta.learning_path!.length) * 100)
                              onUpdateItem(item.id, { progress: { completedSteps, percent } })
                            }}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-sm">{step.title}</div>
                            {step.description && (
                              <div className="text-xs text-gray-600">{step.description}</div>
                            )}
                            {step.estimated_hours && (
                              <div className="text-xs text-gray-500">{step.estimated_hours}h estimated</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {item.meta.prerequisites && item.meta.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Prerequisites</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.meta.prerequisites.map((prereq, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {item.milestones && item.milestones.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Milestones</h4>
                    <div className="space-y-2">
                      {item.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={(e) => {
                              const updatedMilestones = [...item.milestones!]
                              updatedMilestones[index] = { ...milestone, completed: e.target.checked }
                              onUpdateItem(item.id, { milestones: updatedMilestones })
                            }}
                          />
                          <div className="flex-1">
                            <span className={milestone.completed ? 'line-through text-gray-500' : ''}>{milestone.title}</span>
                            <span className="text-xs text-gray-500 ml-2">{milestone.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* View mode selector */}
      <div className="flex space-x-2">
        {['timeline', 'kanban', 'dependencies'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 text-sm rounded ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'kanban' && (
        <RoadmapKanban
          items={items}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
        />
      )}
      {viewMode === 'dependencies' && (
        <RoadmapDependencies
          items={items}
          onUpdateItem={onUpdateItem}
          onRemoveItem={onRemoveItem}
        />
      )}
    </div>
  )
}

export default RoadmapTimeline
