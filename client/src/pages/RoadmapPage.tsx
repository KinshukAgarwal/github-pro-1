import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  BookOpen,
  Code,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  CheckCircle,
  Play
} from 'lucide-react'
import { useRoadmap, useRoadmapStats } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import RoadmapDashboard from '@/components/roadmap/RoadmapDashboard'
import ProjectWizard from '@/components/project/ProjectWizard'
import LearningPathWizard from '@/components/learning/LearningPathWizard'

const RoadmapPage = () => {
  const [showProjectWizard, setShowProjectWizard] = useState(false)
  const [showLearningWizard, setShowLearningWizard] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'learning'>('overview')

  const { data: roadmapData, isLoading: roadmapLoading, error: roadmapError } = useRoadmap()
  const { data: statsData } = useRoadmapStats()

  const roadmapItems = roadmapData?.data?.items || []
  const stats = statsData?.data || {
    totalItems: 0,
    completedItems: 0,
    inProgressItems: 0,
    averageProgress: 0,
    streak: 0,
    completionRate: 0
  }

  const projects = roadmapItems.filter((item: any) => item.type === 'project')
  const technologies = roadmapItems.filter((item: any) => item.type === 'technology')

  if (roadmapLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (roadmapError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Target className="h-12 w-12 mx-auto mb-2" />
            <p>Failed to load roadmap data</p>
          </div>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Roadmap</h1>
                <p className="text-sm text-gray-600">Track your learning journey and projects</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLearningWizard(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Learning</span>
              </button>

              <button
                onClick={() => setShowProjectWizard(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Code className="h-4 w-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressItems}</p>
              </div>
              <Play className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange-600">{stats.streak}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</p>
              </div>
              <Award className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3, count: roadmapItems.length },
                { id: 'projects', label: 'Projects', icon: Code, count: projects.length },
                { id: 'learning', label: 'Learning', icon: BookOpen, count: technologies.length }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <RoadmapDashboard />
        </motion.div>
      </div>

      {/* Wizards */}
      <ProjectWizard
        isOpen={showProjectWizard}
        onClose={() => setShowProjectWizard(false)}
      />

      <LearningPathWizard
        isOpen={showLearningWizard}
        onClose={() => setShowLearningWizard(false)}
      />
    </div>
  )
}

export default RoadmapPage
