import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  Star,
  GitBranch,
  Activity,
  Code,
  Target,
  Zap,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Share2
} from 'lucide-react'
import {
  useUserProfile,
  useUserRepositories,
  useProfileScore,
  useRepositoryAnalysis,
  useLanguageDistribution,
  useTechnologyTrends,
  useContributionPatterns,
} from '@/hooks/useApi'
import ProfileScoreChart from '@/components/charts/ProfileScoreChart'
import LanguageChart from '@/components/charts/LanguageChart'
import ContributionHeatmap from '@/components/charts/ContributionHeatmap'
import TechnologyTrendChart from '@/components/charts/TechnologyTrendChart'
import RepositoryMetricsChart from '@/components/charts/RepositoryMetricsChart'
import ExportModal from '@/components/export/ExportModal'
import ShareModal from '@/components/share/ShareModal'
import MarketTrendsExplorer from '@/components/MarketTrendsExplorer'

import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'react-hot-toast'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('6m')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [refreshing, setRefreshing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const { data: userProfile, isLoading: profileLoading } = useUserProfile()
  const { data: repositories, isLoading: reposLoading } = useUserRepositories()
  const { data: profileScore, isLoading: scoreLoading, refetch: refetchScore } = useProfileScore()
  const { data: repoAnalysis, isLoading: analysisLoading } = useRepositoryAnalysis()
  const { data: languages, isLoading: languagesLoading } = useLanguageDistribution()
  const { data: techTrends, isLoading: trendsLoading } = useTechnologyTrends()
  const { data: contributions } = useContributionPatterns(selectedYear)

  const handleRefreshAll = async () => {
    setRefreshing(true)
    try {
      await refetchScore()
      toast.success('Dashboard refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  const stats = [
    {
      name: 'Total Repositories',
      value: repositories?.data?.length?.toString() || '0',
      icon: GitBranch,
      color: 'text-blue-600',
      loading: reposLoading
    },
    {
      name: 'Total Stars',
      value: repoAnalysis?.data?.total_stars?.toLocaleString() || '0',
      icon: Star,
      color: 'text-yellow-600',
      loading: analysisLoading
    },
    {
      name: 'Profile Score',
      value: profileScore?.data?.overall_score?.toString() || '0',
      icon: TrendingUp,
      color: 'text-green-600',
      loading: scoreLoading
    },
    {
      name: 'Followers',
      value: userProfile?.data?.followers?.toLocaleString() || '0',
      icon: Users,
      color: 'text-purple-600',
      loading: profileLoading
    }
  ]

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your GitHub profile analytics and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-outline flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="btn-ghost"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                {stat.loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                )}
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Profile Score Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Profile Score Breakdown
          </h3>
          <div className="flex items-center space-x-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>
        {scoreLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : profileScore?.data ? (
          <ProfileScoreChart data={profileScore.data} type="bar" />
        ) : (
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No profile score data available</p>
          </div>
        )}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card min-w-0"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2" />
            Language Distribution
          </h3>
          {languagesLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : languages?.data?.length > 0 ? (
            <LanguageChart data={languages!.data as any} />
          ) : (
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">No language data available</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card min-w-0"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Repository Metrics
          </h3>
          {reposLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : repositories?.data?.length > 0 ? (
              <RepositoryMetricsChart
                repositories={(repositories!.data as any[]).map((repo: any) => ({
                  name: repo.name,
                  stars: repo.stargazers_count || 0,
                  forks: repo.forks_count || 0,
                  watchers: repo.watchers_count || 0,
                  size: repo.size || 0,
                  language: repo.language || 'Unknown',
                  created_at: repo.created_at,
                  updated_at: repo.updated_at,
                  topics: repo.topics || []
                }))}
                showTopN={5}
              />
          ) : (
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">No repository data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Contribution Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <ContributionHeatmap
          data={(contributions?.data?.daily || []).map((d: any) => ({
            date: d.date,
            count: d.count,
            level: d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 4 ? 2 : d.count <= 6 ? 3 : 4,
          }))}
          year={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={[2020, 2021, 2022, 2023, 2024, 2025].filter(y => y <= new Date().getFullYear())}
        />
      </motion.div>

      {/* Technology Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {trendsLoading ? (
          <div className="flex items-center justify-center h-80 bg-white rounded-lg border">
            <LoadingSpinner size="lg" />
          </div>
        ) : techTrends?.data?.length ? (
          <TechnologyTrendChart trends={techTrends.data} timeRange="6m" showGrowthRates={true} />
        ) : (
          <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No trend data available</p>
          </div>
        )}
      </motion.div>
      {/* Market Trends Explorer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Trends Explorer</h3>
        <MarketTrendsExplorer />
      </motion.div>


      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Download className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-900">Export Report</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Eye className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-900">View Insights</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-900">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  )
}

export default DashboardPage
