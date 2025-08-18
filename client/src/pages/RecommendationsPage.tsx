import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Code, RefreshCw, Sparkles, Target } from 'lucide-react'
import { useProjectRecommendations, useTechnologyRecommendations, useCareerInsights, useGenerateRecommendations } from '@/hooks/useApi'
import ProjectRecommendationCard from '@/components/recommendations/ProjectRecommendationCard'
import TechnologyRecommendationCard from '@/components/recommendations/TechnologyRecommendationCard'
import CareerInsightsDashboard from '@/components/career/CareerInsightsDashboard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'react-hot-toast'

const RecommendationsPage = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'technologies' | 'career'>('projects')
  const [preferences] = useState({
    difficulty: '',
    time_commitment: '',
    focus_areas: ''
  })

  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useProjectRecommendations()

  const {
    data: techData,
    isLoading: techLoading,
    error: techError,
    refetch: refetchTech
  } = useTechnologyRecommendations()

  const {
    data: careerData,
    isLoading: careerLoading,
    error: careerError,
    refetch: refetchCareer
  } = useCareerInsights()

  const generateRecommendations = useGenerateRecommendations()

  const handleRefreshRecommendations = () => {
    generateRecommendations.mutate(preferences, {
      onSuccess: () => {
        refetchProjects()
        refetchTech()
        refetchCareer()
      }
    })
  }

  const tabs = [
    { id: 'projects', label: 'Project Ideas', icon: Code, count: projectsData?.data?.recommendations?.length || 0 },
    { id: 'technologies', label: 'Technologies', icon: TrendingUp, count: techData?.data?.recommendations?.length || 0 },
    { id: 'career', label: 'Career Insights', icon: Target, count: careerData?.data ? 1 : 0 }
  ]

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-8 w-8 text-primary-600 mr-3" />
            AI Recommendations
          </h1>
          <p className="text-gray-600 mt-2">
            Personalized suggestions to enhance your skills and career
          </p>
        </div>
        <button
          onClick={handleRefreshRecommendations}
          disabled={generateRecommendations.isLoading}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${generateRecommendations.isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="mt-8">
        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : projectsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load project recommendations</p>
                <button onClick={() => refetchProjects()} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : projectsData?.data?.recommendations?.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Project Recommendations
                  </h2>
                  {(projectsData!.data as any).ai_enabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      AI-Powered
                    </span>
                  )}
                </div>
                <div className="grid gap-6">
                  {((projectsData!.data as any).recommendations as any[]).map((recommendation: any) => (
                    <ProjectRecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onStartProject={(id) => toast.success(`Starting project: ${id}`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No project recommendations available</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'technologies' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {techLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : techError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load technology recommendations</p>
                <button onClick={() => refetchTech()} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : techData?.data?.recommendations?.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Technology Recommendations
                  </h2>
                  {(techData!.data as any).ai_enabled && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      AI-Powered
                    </span>
                  )}
                </div>
                <div className="grid gap-6">
                  {((techData!.data as any).recommendations as any[]).map((recommendation: any) => (
                    <TechnologyRecommendationCard
                      key={recommendation.name}
                      recommendation={recommendation}
                      onStartLearning={(name) => window.open(`https://www.google.com/search?q=${encodeURIComponent(name + ' official docs')}`, '_blank')}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No technology recommendations available</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'career' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {careerLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : careerError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load career insights</p>
                <button onClick={() => refetchCareer()} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : careerData?.data ? (
              <CareerInsightsDashboard insights={careerData.data} isLoading={careerLoading} />
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No career insights available</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default RecommendationsPage
