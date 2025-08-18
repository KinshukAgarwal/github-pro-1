import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Target,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Play,
  Star,
  Users,
  FileText,
  Video,
  Code,
  Brain
} from 'lucide-react'
import { useAddRoadmapItem } from '@/hooks/useApi'
import { handleAsyncOperation, createRoadmapErrorHandler } from '@/utils/errorHandling'

interface LearningPathWizardProps {
  isOpen: boolean
  onClose: () => void
  technologyData?: any
}

interface LearningConfig {
  technology: string
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  timeCommitment: 'casual' | 'regular' | 'intensive'
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed'
  goals: string[]
  schedule: {
    hoursPerWeek: number
    preferredDays: string[]
    preferredTime: string
  }
  resources: {
    includeVideos: boolean
    includeBooks: boolean
    includeProjects: boolean
    includeCommunity: boolean
  }
}

const LearningPathWizard: React.FC<LearningPathWizardProps> = ({ isOpen, onClose, technologyData }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const addRoadmapItem = useAddRoadmapItem()
  const [config, setConfig] = useState<LearningConfig>({
    technology: technologyData?.name || '',
    currentLevel: 'none',
    targetLevel: 'intermediate',
    timeCommitment: 'regular',
    learningStyle: 'mixed',
    goals: [],
    schedule: {
      hoursPerWeek: 5,
      preferredDays: [],
      preferredTime: 'evening'
    },
    resources: {
      includeVideos: true,
      includeBooks: true,
      includeProjects: true,
      includeCommunity: true
    }
  })

  const steps = [
    { title: 'Technology & Level', icon: Target },
    { title: 'Learning Goals', icon: Star },
    { title: 'Schedule', icon: Clock },
    { title: 'Resources', icon: BookOpen },
    { title: 'Review', icon: Check }
  ]

  const learningGoals = [
    'Get a job in this technology',
    'Build personal projects',
    'Contribute to open source',
    'Improve current skills',
    'Learn for fun/hobby',
    'Prepare for certification',
    'Switch career paths',
    'Stay current with trends'
  ]

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculateEstimatedTime = () => {
    const levelMultipliers = {
      'none-beginner': 8,
      'none-intermediate': 16,
      'none-advanced': 24,
      'none-expert': 32,
      'beginner-intermediate': 12,
      'beginner-advanced': 20,
      'beginner-expert': 28,
      'intermediate-advanced': 10,
      'intermediate-expert': 18,
      'advanced-expert': 8
    }

    const key = `${config.currentLevel}-${config.targetLevel}` as keyof typeof levelMultipliers
    const baseWeeks = levelMultipliers[key] || 12
    const weeklyHours = config.schedule.hoursPerWeek
    
    return Math.ceil(baseWeeks * (5 / weeklyHours)) // Assuming 5 hours/week as baseline
  }

  const generateLearningPath = () => {
    const estimatedWeeks = calculateEstimatedTime()
    const modules = []

    // Basic structure based on technology and levels
    if (config.currentLevel === 'none') {
      modules.push(
        { name: 'Fundamentals', weeks: Math.ceil(estimatedWeeks * 0.3), description: 'Core concepts and syntax' },
        { name: 'Practical Application', weeks: Math.ceil(estimatedWeeks * 0.4), description: 'Hands-on projects and exercises' },
        { name: 'Advanced Topics', weeks: Math.ceil(estimatedWeeks * 0.2), description: 'Complex features and patterns' },
        { name: 'Real-world Projects', weeks: Math.ceil(estimatedWeeks * 0.1), description: 'Portfolio-worthy applications' }
      )
    } else {
      modules.push(
        { name: 'Skill Assessment', weeks: 1, description: 'Evaluate current knowledge gaps' },
        { name: 'Targeted Learning', weeks: Math.ceil(estimatedWeeks * 0.6), description: 'Focus on specific improvement areas' },
        { name: 'Advanced Practice', weeks: Math.ceil(estimatedWeeks * 0.3), description: 'Complex projects and challenges' },
        { name: 'Mastery & Teaching', weeks: Math.ceil(estimatedWeeks * 0.1), description: 'Share knowledge and mentor others' }
      )
    }

    return modules
  }

  const handleCreateLearningPath = async () => {
    const learningPath = generateLearningPath()

    await handleAsyncOperation(
      () => addRoadmapItem.mutateAsync({
        type: 'technology',
        name: config.technology,
        status: 'not-started',
        meta: {
          current_level: config.currentLevel,
          target_level: config.targetLevel,
          time_commitment: config.timeCommitment,
          learning_style: config.learningStyle,
          goals: config.goals,
          schedule: config.schedule,
          resources: config.resources,
          learning_path: learningPath,
          estimated_completion: `${calculateEstimatedTime()} weeks`,
          created_at: new Date().toISOString(),
          progress: 0,
          modules_completed: 0,
          total_modules: learningPath.length,
          streak_days: 0,
          last_activity: null
        }
      }),
      {
        ...createRoadmapErrorHandler('create'),
        loadingMessage: 'Creating your learning path...',
        successMessage: '🎉 Learning path created successfully! Ready to start your journey?',
        onSuccess: () => onClose()
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Learning Path Creator</h2>
                <p className="text-green-100">Design your personalized learning journey</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isActive ? 'bg-white text-green-600 border-white' : 
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        'border-green-300 text-green-300'}
                    `}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-green-300'}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <p className={`text-xs ${index === currentStep ? 'text-white font-medium' : 'text-green-200'}`}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 0: Technology & Level */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Technology to Learn</label>
                    <input
                      type="text"
                      value={config.technology}
                      onChange={(e) => setConfig(prev => ({ ...prev, technology: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., React, Python, Docker"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Level</label>
                      <select
                        value={config.currentLevel}
                        onChange={(e) => setConfig(prev => ({ ...prev, currentLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="none">Complete Beginner</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Level</label>
                      <select
                        value={config.targetLevel}
                        onChange={(e) => setConfig(prev => ({ ...prev, targetLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Commitment</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'casual', label: 'Casual', desc: '1-3 hours/week' },
                        { value: 'regular', label: 'Regular', desc: '4-8 hours/week' },
                        { value: 'intensive', label: 'Intensive', desc: '9+ hours/week' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setConfig(prev => ({ ...prev, timeCommitment: option.value as any }))}
                          className={`
                            p-3 rounded-lg border-2 text-center transition-all
                            ${config.timeCommitment === option.value
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }
                          `}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'visual', label: 'Visual', icon: Video },
                        { value: 'hands-on', label: 'Hands-on', icon: Code },
                        { value: 'reading', label: 'Reading', icon: FileText },
                        { value: 'mixed', label: 'Mixed', icon: Star }
                      ].map((style) => {
                        const Icon = style.icon
                        return (
                          <button
                            key={style.value}
                            onClick={() => setConfig(prev => ({ ...prev, learningStyle: style.value as any }))}
                            className={`
                              p-3 rounded-lg border-2 text-center transition-all
                              ${config.learningStyle === style.value
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }
                            `}
                          >
                            <Icon className="h-6 w-6 mx-auto mb-1" />
                            <div className="text-sm font-medium">{style.label}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Learning Goals */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What are your learning goals?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {learningGoals.map((goal) => (
                        <label
                          key={goal}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={config.goals.includes(goal)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig(prev => ({ ...prev, goals: [...prev.goals, goal] }))
                              } else {
                                setConfig(prev => ({ ...prev, goals: prev.goals.filter(g => g !== goal) }))
                              }
                            }}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{goal}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Schedule */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Your Learning Schedule</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hours per week: {config.schedule.hoursPerWeek}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={config.schedule.hoursPerWeek}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule, hoursPerWeek: parseInt(e.target.value) }
                          }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 hour</span>
                          <span>20 hours</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Days</label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {weekDays.map((day) => (
                            <button
                              key={day}
                              onClick={() => {
                                const isSelected = config.schedule.preferredDays.includes(day)
                                setConfig(prev => ({
                                  ...prev,
                                  schedule: {
                                    ...prev.schedule,
                                    preferredDays: isSelected
                                      ? prev.schedule.preferredDays.filter(d => d !== day)
                                      : [...prev.schedule.preferredDays, day]
                                  }
                                }))
                              }}
                              className={`
                                p-2 rounded-lg border-2 text-xs font-medium transition-all
                                ${config.schedule.preferredDays.includes(day)
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }
                              `}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                        <select
                          value={config.schedule.preferredTime}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule, preferredTime: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="morning">Morning (6AM - 12PM)</option>
                          <option value="afternoon">Afternoon (12PM - 6PM)</option>
                          <option value="evening">Evening (6PM - 10PM)</option>
                          <option value="night">Night (10PM - 12AM)</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Estimated Completion Time</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Based on your schedule, you'll complete this learning path in approximately{' '}
                          <span className="font-semibold">{calculateEstimatedTime()} weeks</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Resources */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Learning Resources</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.resources.includeVideos}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            resources: { ...prev.resources, includeVideos: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Video className="h-6 w-6 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Video Tutorials</div>
                          <div className="text-xs text-gray-500">YouTube, Udemy, Coursera</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.resources.includeBooks}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            resources: { ...prev.resources, includeBooks: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <BookOpen className="h-6 w-6 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Books & Documentation</div>
                          <div className="text-xs text-gray-500">Official docs, eBooks</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.resources.includeProjects}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            resources: { ...prev.resources, includeProjects: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Code className="h-6 w-6 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Hands-on Projects</div>
                          <div className="text-xs text-gray-500">Coding exercises, challenges</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.resources.includeCommunity}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            resources: { ...prev.resources, includeCommunity: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <Users className="h-6 w-6 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">Community Support</div>
                          <div className="text-xs text-gray-500">Forums, Discord, Reddit</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Learning Path</h3>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 text-lg">{config.technology} Learning Path</h4>
                        <p className="text-sm text-gray-600">
                          {config.currentLevel === 'none' ? 'Complete beginner' : config.currentLevel} → {config.targetLevel}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Time Commitment:</span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">{config.timeCommitment}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Learning Style:</span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">{config.learningStyle}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Hours per Week:</span>
                          <span className="ml-2 text-sm text-gray-600">{config.schedule.hoursPerWeek}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Estimated Duration:</span>
                          <span className="ml-2 text-sm text-gray-600">{calculateEstimatedTime()} weeks</span>
                        </div>
                      </div>

                      {config.goals.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Goals:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {config.goals.map((goal) => (
                              <span
                                key={goal}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-sm font-medium text-gray-700">Learning Modules:</span>
                        <div className="mt-2 space-y-2">
                          {generateLearningPath().map((module, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{module.name}</div>
                                <div className="text-xs text-gray-500">{module.description}</div>
                              </div>
                              <div className="text-xs text-gray-500">{module.weeks} weeks</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleCreateLearningPath}
              disabled={addRoadmapItem.isLoading}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {addRoadmapItem.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Learning</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default LearningPathWizard
