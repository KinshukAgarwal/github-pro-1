import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code,
  GitBranch,
  Target,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  FileText,
  Globe
} from 'lucide-react'
import apiService from '@/services/api'
import { handleAsyncOperation, createRoadmapErrorHandler } from '@/utils/errorHandling'

interface ProjectWizardProps {
  isOpen: boolean
  onClose: () => void
  projectData?: any
}

interface ProjectConfig {
  name: string
  description: string
  techStack: string[]
  projectType: 'web' | 'mobile' | 'api' | 'desktop' | 'data-science'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  features: string[]
  repository: {
    createRepo: boolean
    repoName: string
    isPrivate: boolean
    includeReadme: boolean
    includeLicense: boolean
    licenseType: string
  }
  deployment: {
    platform: string
    autoSetup: boolean
  }
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ isOpen, onClose, projectData }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [config, setConfig] = useState<ProjectConfig>({
    name: projectData?.title || '',
    description: projectData?.description || '',
    techStack: projectData?.technologies || [],
    projectType: 'web',
    difficulty: projectData?.difficulty || 'intermediate',
    estimatedTime: projectData?.estimated_time || '2-3 weeks',
    features: [],
    repository: {
      createRepo: true,
      repoName: '',
      isPrivate: false,
      includeReadme: true,
      includeLicense: true,
      licenseType: 'MIT'
    },
    deployment: {
      platform: 'vercel',
      autoSetup: false
    }
  })

  const steps = [
    { title: 'Project Details', icon: FileText },
    { title: 'Tech Stack', icon: Code },
    { title: 'Features', icon: Target },
    { title: 'Repository', icon: GitBranch },
    { title: 'Deployment', icon: Globe },
    { title: 'Review', icon: Check }
  ]

  const techStackOptions = {
    web: ['React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Node.js', 'Express.js'],
    mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin'],
    api: ['Node.js', 'Express.js', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'GraphQL'],
    desktop: ['Electron', 'Tauri', 'Qt', 'WPF', 'JavaFX', 'Tkinter'],
    'data-science': ['Python', 'Jupyter', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'R']
  }

  const projectFeatures = {
    web: ['Authentication', 'Database Integration', 'Real-time Updates', 'File Upload', 'Search Functionality', 'Admin Dashboard', 'Payment Integration', 'Email Notifications'],
    mobile: ['Push Notifications', 'Offline Support', 'Camera Integration', 'GPS/Location', 'Biometric Auth', 'In-App Purchases'],
    api: ['REST Endpoints', 'GraphQL Schema', 'Authentication', 'Rate Limiting', 'Documentation', 'Testing Suite', 'Monitoring'],
    desktop: ['File System Access', 'System Tray', 'Auto Updates', 'Cross Platform', 'Native Integrations'],
    'data-science': ['Data Visualization', 'Machine Learning', 'Data Processing', 'Statistical Analysis', 'Report Generation']
  }

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

  const handleCreateProject = async () => {
    setIsCreating(true)

    try {
      await handleAsyncOperation(
        () => apiService.addRoadmapItem({
          type: 'project',
          name: config.name,
          status: 'in-progress',
          meta: {
            description: config.description,
            tech_stack: config.techStack,
            project_type: config.projectType,
            difficulty: config.difficulty,
            estimated_time: config.estimatedTime,
            features: config.features,
            repository: config.repository,
            deployment: config.deployment,
            created_at: new Date().toISOString(),
            progress: 0,
            milestones: generateMilestones(config),
            tasks: generateTasks(config)
          }
        }),
        {
          ...createRoadmapErrorHandler('create'),
          loadingMessage: 'Creating your project...',
          successMessage: '🚀 Project created successfully! Time to start building!',
          onSuccess: () => onClose()
        }
      )
    } finally {
      setIsCreating(false)
    }
  }

  const generateMilestones = (config: ProjectConfig) => {
    const baseMilestones = [
      { name: 'Project Setup', description: 'Initialize project structure and dependencies', progress: 0 },
      { name: 'Core Development', description: 'Implement main functionality', progress: 0 },
      { name: 'Testing & Debugging', description: 'Test features and fix issues', progress: 0 },
      { name: 'Deployment', description: 'Deploy to production environment', progress: 0 }
    ]

    if (config.repository.createRepo) {
      baseMilestones.unshift({ name: 'Repository Setup', description: 'Create and configure Git repository', progress: 0 })
    }

    return baseMilestones
  }

  const generateTasks = (config: ProjectConfig) => {
    const tasks = [
      'Set up development environment',
      'Initialize project structure',
      'Install dependencies',
      'Configure build tools',
      'Implement basic UI/structure',
      'Add core functionality',
      'Implement selected features',
      'Write tests',
      'Create documentation',
      'Deploy to production'
    ]

    if (config.repository.createRepo) {
      tasks.unshift('Create Git repository', 'Set up version control')
    }

    return tasks.map((task, index) => ({
      id: `task-${index}`,
      name: task,
      completed: false,
      priority: index < 3 ? 'high' : index < 7 ? 'medium' : 'low'
    }))
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Project Wizard</h2>
                <p className="text-blue-100">Create your next amazing project</p>
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
                      ${isActive ? 'bg-white text-blue-600 border-white' : 
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                        'border-blue-300 text-blue-300'}
                    `}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-blue-300'}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <p className={`text-xs ${index === currentStep ? 'text-white font-medium' : 'text-blue-200'}`}>
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
              {/* Step 0: Project Details */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="My Awesome Project"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={config.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe what your project will do..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                      <select
                        value={config.projectType}
                        onChange={(e) => setConfig(prev => ({ ...prev, projectType: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="web">Web Application</option>
                        <option value="mobile">Mobile App</option>
                        <option value="api">API/Backend</option>
                        <option value="desktop">Desktop App</option>
                        <option value="data-science">Data Science</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={config.difficulty}
                        onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time</label>
                    <input
                      type="text"
                      value={config.estimatedTime}
                      onChange={(e) => setConfig(prev => ({ ...prev, estimatedTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Tech Stack */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Tech Stack</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {techStackOptions[config.projectType].map((tech) => (
                        <button
                          key={tech}
                          onClick={() => {
                            const isSelected = config.techStack.includes(tech)
                            setConfig(prev => ({
                              ...prev,
                              techStack: isSelected
                                ? prev.techStack.filter(t => t !== tech)
                                : [...prev.techStack, tech]
                            }))
                          }}
                          className={`
                            p-3 rounded-lg border-2 text-sm font-medium transition-all
                            ${config.techStack.includes(tech)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }
                          `}
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.techStack.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {config.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Features */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Features to Include</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectFeatures[config.projectType].map((feature) => (
                        <label
                          key={feature}
                          className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={config.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig(prev => ({ ...prev, features: [...prev.features, feature] }))
                              } else {
                                setConfig(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Repository */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Configuration</h3>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.repository.createRepo}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            repository: { ...prev.repository, createRepo: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Create Git repository</span>
                      </label>

                      {config.repository.createRepo && (
                        <div className="ml-6 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Repository Name</label>
                            <input
                              type="text"
                              value={config.repository.repoName || config.name.toLowerCase().replace(/\s+/g, '-')}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                repository: { ...prev.repository, repoName: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={config.repository.isPrivate}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  repository: { ...prev.repository, isPrivate: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Private repository</span>
                            </label>

                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={config.repository.includeReadme}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  repository: { ...prev.repository, includeReadme: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Include README</span>
                            </label>
                          </div>

                          <div>
                            <label className="flex items-center space-x-3 mb-2">
                              <input
                                type="checkbox"
                                checked={config.repository.includeLicense}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  repository: { ...prev.repository, includeLicense: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Include License</span>
                            </label>

                            {config.repository.includeLicense && (
                              <select
                                value={config.repository.licenseType}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  repository: { ...prev.repository, licenseType: e.target.value }
                                }))}
                                className="ml-6 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="MIT">MIT License</option>
                                <option value="Apache-2.0">Apache 2.0</option>
                                <option value="GPL-3.0">GPL 3.0</option>
                                <option value="BSD-3-Clause">BSD 3-Clause</option>
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Deployment */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Configuration</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Platform</label>
                        <select
                          value={config.deployment.platform}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            deployment: { ...prev.deployment, platform: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="vercel">Vercel</option>
                          <option value="netlify">Netlify</option>
                          <option value="heroku">Heroku</option>
                          <option value="aws">AWS</option>
                          <option value="digitalocean">DigitalOcean</option>
                          <option value="none">No deployment setup</option>
                        </select>
                      </div>

                      {config.deployment.platform !== 'none' && (
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.deployment.autoSetup}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              deployment: { ...prev.deployment, autoSetup: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Auto-setup deployment configuration</span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Project</h3>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{config.name}</h4>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Type:</span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">{config.projectType.replace('-', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                          <span className="ml-2 text-sm text-gray-600 capitalize">{config.difficulty}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Estimated Time:</span>
                          <span className="ml-2 text-sm text-gray-600">{config.estimatedTime}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Repository:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {config.repository.createRepo ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {config.techStack.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tech Stack:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {config.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {config.features.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {config.features.map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
              onClick={handleCreateProject}
              disabled={isCreating}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

export default ProjectWizard
