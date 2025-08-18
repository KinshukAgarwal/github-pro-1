import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar, Target, BookOpen, Trophy, Clock, AlertCircle } from 'lucide-react'
import { useAddRoadmapItem } from '@/hooks/useApi'
import { toast } from 'react-hot-toast'
import { safeRoadmapOperation } from '@/utils/errorHandling'

interface AddRoadmapItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const AddRoadmapItemModal = ({ isOpen, onClose, onSuccess }: AddRoadmapItemModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'technology' as 'technology' | 'project' | 'certification' | 'milestone',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    target_date: '',
    prerequisites: [] as string[],
    custom_learning_path: false,
    learning_steps: [{ title: '', description: '', estimated_hours: 0 }]
  })
  
  const [prerequisiteInput, setPrerequisiteInput] = useState('')
  const addItem = useAddRoadmapItem()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter a name for your roadmap item')
      return
    }

    const itemData = {
      name: formData.name,
      type: formData.type,
      target_date: formData.target_date || null,
      meta: {
        difficulty: formData.difficulty,
        prerequisites: formData.prerequisites,
        ...(formData.custom_learning_path && {
          learning_path: formData.learning_steps.filter(step => step.title.trim())
        })
      }
    }

    const result = await safeRoadmapOperation(
      () => addItem.mutateAsync(itemData),
      'create'
    )

    if (result) {
      onSuccess?.()
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'technology',
      difficulty: 'intermediate',
      target_date: '',
      prerequisites: [],
      custom_learning_path: false,
      learning_steps: [{ title: '', description: '', estimated_hours: 0 }]
    })
    setPrerequisiteInput('')
  }

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !formData.prerequisites.includes(prerequisiteInput.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()]
      }))
      setPrerequisiteInput('')
    }
  }

  const removePrerequisite = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }))
  }

  const addLearningStep = () => {
    setFormData(prev => ({
      ...prev,
      learning_steps: [...prev.learning_steps, { title: '', description: '', estimated_hours: 0 }]
    }))
  }

  const updateLearningStep = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      learning_steps: prev.learning_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  const removeLearningStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learning_steps: prev.learning_steps.filter((_, i) => i !== index)
    }))
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
        return <BookOpen className="h-4 w-4" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add to Roadmap</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., React, Machine Learning Project, AWS Certification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['technology', 'project', 'certification', 'milestone'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type }))}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${
                            formData.type === type
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={prerequisiteInput}
                    onChange={(e) => setPrerequisiteInput(e.target.value)}
                    placeholder="Add a prerequisite"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <button
                    type="button"
                    onClick={addPrerequisite}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {formData.prerequisites.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.prerequisites.map((prereq, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        <span>{prereq}</span>
                        <button
                          type="button"
                          onClick={() => removePrerequisite(index)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Learning Path */}
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.custom_learning_path}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_learning_path: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Create custom learning path</span>
                </label>

                {formData.custom_learning_path && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Define your own learning steps (otherwise we'll generate them automatically)</span>
                    </div>
                    
                    {formData.learning_steps.map((step, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Step {index + 1}</span>
                          {formData.learning_steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLearningStep(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateLearningStep(index, 'title', e.target.value)}
                            placeholder="Step title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          
                          <textarea
                            value={step.description}
                            onChange={(e) => updateLearningStep(index, 'description', e.target.value)}
                            placeholder="Step description (optional)"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              value={step.estimated_hours}
                              onChange={(e) => updateLearningStep(index, 'estimated_hours', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">hours estimated</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={addLearningStep}
                      className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Step</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addItem.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addItem.isLoading ? 'Adding...' : 'Add to Roadmap'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AddRoadmapItemModal
