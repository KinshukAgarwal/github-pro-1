import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Circle, Clock, AlertTriangle, Target } from 'lucide-react'

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

interface RoadmapDependenciesProps {
  items: RoadmapItem[]
  onUpdateItem: (id: string, updates: any) => void
  onRemoveItem: (id: string) => void
}

const RoadmapDependencies = ({ items, onUpdateItem, onRemoveItem }: RoadmapDependenciesProps) => {
  // Build dependency graph
  const dependencyGraph = useMemo(() => {
    const graph: Record<string, { item: RoadmapItem; dependents: string[]; dependencies: RoadmapItem[] }> = {}
    
    // Initialize graph nodes
    items.forEach(item => {
      graph[item.id] = {
        item,
        dependents: [],
        dependencies: []
      }
    })
    
    // Build relationships
    items.forEach(item => {
      if (item.dependencies) {
        item.dependencies.forEach(depId => {
          const depItem = items.find(i => i.id === depId)
          if (depItem) {
            graph[item.id].dependencies.push(depItem)
            graph[depId].dependents.push(item.id)
          }
        })
      }
    })
    
    return graph
  }, [items])

  // Calculate levels for layout
  const levels = useMemo(() => {
    const visited = new Set<string>()
    const levels: string[][] = []
    
    const getLevel = (itemId: string, currentLevel = 0): number => {
      if (visited.has(itemId)) return currentLevel
      visited.add(itemId)
      
      const node = dependencyGraph[itemId]
      if (!node) return currentLevel
      
      let maxDepLevel = -1
      node.dependencies.forEach(dep => {
        maxDepLevel = Math.max(maxDepLevel, getLevel(dep.id, currentLevel))
      })
      
      const level = maxDepLevel + 1
      if (!levels[level]) levels[level] = []
      levels[level].push(itemId)
      
      return level
    }
    
    items.forEach(item => getLevel(item.id))
    
    return levels.filter(level => level.length > 0)
  }, [dependencyGraph, items])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in-progress':
        return 'bg-blue-50 border-blue-200'
      case 'blocked':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
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

  const canStart = (itemId: string): boolean => {
    const node = dependencyGraph[itemId]
    if (!node) return true
    return node.dependencies.every(dep => dep.status === 'completed')
  }

  const getBlockedReason = (itemId: string): string | null => {
    const node = dependencyGraph[itemId]
    if (!node) return null
    
    const incompleteDeps = node.dependencies.filter(dep => dep.status !== 'completed')
    if (incompleteDeps.length === 0) return null
    
    return `Waiting for: ${incompleteDeps.map(dep => dep.name).join(', ')}`
  }

  if (levels.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Dependencies</h3>
        <p className="text-gray-600">Your roadmap items don't have any dependencies set up yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Dependency Flow</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Dependencies flow left to right</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span className="text-gray-600">Ready to start</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span className="text-gray-600">Blocked by dependencies</span>
          </div>
        </div>
      </div>

      {/* Dependency Graph */}
      <div className="relative">
        {levels.map((level, levelIndex) => (
          <div key={levelIndex} className="mb-8">
            <div className="text-xs font-medium text-gray-500 mb-4">
              Level {levelIndex + 1}
            </div>
            
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, level.length)}, 1fr)` }}>
              {level.map((itemId, itemIndex) => {
                const node = dependencyGraph[itemId]
                if (!node) return null
                
                const item = node.item
                const isBlocked = !canStart(itemId) && item.status !== 'completed'
                const blockedReason = getBlockedReason(itemId)
                
                return (
                  <motion.div
                    key={itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: levelIndex * 0.1 + itemIndex * 0.05 }}
                    className={`relative border-2 rounded-lg p-4 ${getStatusColor(item.status)} ${
                      isBlocked ? 'border-red-300' : canStart(itemId) ? 'border-green-300' : ''
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600 capitalize">{item.type}</span>
                            {item.meta.difficulty && (
                              <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(item.meta.difficulty)}`}>
                                {item.meta.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
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

                    {/* Dependencies Info */}
                    {node.dependencies.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">Dependencies:</div>
                        <div className="space-y-1">
                          {node.dependencies.map(dep => (
                            <div key={dep.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{dep.name}</span>
                              {getStatusIcon(dep.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blocked Warning */}
                    {isBlocked && blockedReason && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">Blocked</span>
                        </div>
                        <div className="mt-1">{blockedReason}</div>
                      </div>
                    )}

                    {/* Ready to Start */}
                    {canStart(itemId) && item.status === 'not-started' && (
                      <div className="mb-3 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-700">
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="font-medium">Ready to start!</span>
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="text-xs text-gray-600 space-y-1">
                      {item.meta.time_to_proficiency && (
                        <div>Est. time: {item.meta.time_to_proficiency}</div>
                      )}
                      {node.dependents.length > 0 && (
                        <div>Blocks {node.dependents.length} item(s)</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                      <button
                        onClick={() => onUpdateItem(item.id, { 
                          status: item.status === 'completed' ? 'in-progress' : 'completed',
                          progress: { ...item.progress, percent: item.status === 'completed' ? 0 : 100 }
                        })}
                        disabled={isBlocked && item.status === 'not-started'}
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === 'completed' 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : isBlocked 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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

                    {/* Connection Lines */}
                    {levelIndex < levels.length - 1 && node.dependents.length > 0 && (
                      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Dependency Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-700 font-medium">{items.filter(i => canStart(i.id) && i.status === 'not-started').length}</div>
            <div className="text-blue-600">Ready to start</div>
          </div>
          <div>
            <div className="text-blue-700 font-medium">{items.filter(i => !canStart(i.id) && i.status !== 'completed').length}</div>
            <div className="text-blue-600">Blocked</div>
          </div>
          <div>
            <div className="text-blue-700 font-medium">{items.filter(i => i.status === 'in-progress').length}</div>
            <div className="text-blue-600">In progress</div>
          </div>
          <div>
            <div className="text-blue-700 font-medium">{items.filter(i => i.status === 'completed').length}</div>
            <div className="text-blue-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoadmapDependencies
