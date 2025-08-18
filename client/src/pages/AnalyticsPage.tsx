import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Code,
  Star,
  GitBranch,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react'
import {
  useProfileScore,
  useRepositoryAnalysis,
  useContributionPatterns,
  useLanguageDistribution,
  useUserRepositories,
  useRefreshAnalytics,
  useMarketTrends,
} from '@/hooks/useApi'
import ProfileScoreChart from '@/components/charts/ProfileScoreChart'
import LanguageChart from '@/components/charts/LanguageChart'
import TechnologyTrendChart from '@/components/charts/TechnologyTrendChart'

import ContributionHeatmap from '@/components/charts/ContributionHeatmap'
import RepositoryMetricsChart from '@/components/charts/RepositoryMetricsChart'
import LoadingSpinner from '@/components/LoadingSpinner'

const AnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | '2y'>('6m')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMetric, setSelectedMetric] = useState<'stars' | 'forks' | 'watchers' | 'size'>('stars')
  const [chartType, setChartType] = useState<'bar' | 'doughnut'>('bar')
  const [trendQuery, setTrendQuery] = useState('TypeScript')
  const { data: marketTrends, isLoading: marketTrendsLoading } = useMarketTrends(trendQuery, 6)


  const { data: profileScore, isLoading: scoreLoading, refetch: refetchScore } = useProfileScore()
  const { data: repoAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useRepositoryAnalysis()
  const { data: contributions } = useContributionPatterns(selectedYear)
  const { data: languages, isLoading: languagesLoading } = useLanguageDistribution()

  const { data: repositories, isLoading: reposLoading } = useUserRepositories()
  const refreshAnalytics = useRefreshAnalytics()

  const handleRefreshAll = async () => {
    try {
      await refreshAnalytics.mutateAsync()
      await Promise.all([refetchScore(), refetchAnalysis()])
    } catch (error) {
      // Error handling is done in the mutation
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Deep insights into your GitHub profile and development patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshAll}
            disabled={refreshAnalytics.isLoading}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshAnalytics.isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Profile Score',
            value: profileScore?.data?.overall_score || 0,
            suffix: '/100',
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            loading: scoreLoading
          },
          {
            title: 'Total Repositories',
            value: repoAnalysis?.data?.total_repos || 0,
            suffix: '',
            icon: GitBranch,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            loading: analysisLoading
          },
          {
            title: 'Total Stars',
            value: repoAnalysis?.data?.total_stars || 0,
            suffix: '',
            icon: Star,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            loading: analysisLoading
          },
          {
            title: 'Languages Used',
            value: languages?.data?.length || 0,
            suffix: '',
            icon: Code,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            loading: languagesLoading
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                {stat.loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    {stat.suffix}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="2y">Last 2 Years</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Chart Type:</span>
              <div className="flex rounded border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-sm ${
                    chartType === 'bar'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('doughnut')}
                  className={`px-3 py-1 text-sm ${
                    chartType === 'doughnut'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >

	      {/* Language Market Trends Search */}
	      <div className="bg-white p-6 rounded-lg border">
	        <div className="flex items-center justify-between mb-4">
	          <div className="flex items-center space-x-2">
	            <TrendingUp className="h-5 w-5 text-primary-600" />
	            <h3 className="text-lg font-semibold text-gray-900">Language Market Trends</h3>
	          </div>
	          <div className="flex items-center space-x-2">
	            <input
	              value={trendQuery}
	              onChange={(e) => setTrendQuery(e.target.value)}
	              placeholder="e.g., TypeScript, Python, Go"
	              className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
	            />
	          </div>
	        </div>
	        {marketTrendsLoading ? (
	          <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
	        ) : (Array.isArray(marketTrends?.data) && marketTrends!.data.length) ? (
	          <TechnologyTrendChart
	            trends={[{
	              technology: trendQuery,
	              trend: 'rising',
	              demand_score: Math.round((marketTrends!.data as any[])[(marketTrends!.data as any[]).length - 1].value),
	              growth_rate: Math.round((marketTrends!.data as any[])[(marketTrends!.data as any[]).length - 1].value - (marketTrends!.data as any[])[0].value),
	              data_points: (marketTrends!.data as any[]).map((d: any) => ({ month: d.month, value: d.value }))
	            }]}
	            timeRange="6m"
	            showGrowthRates={false}
	          />
	        ) : (
	          <div className="text-gray-500">No trend data found for "{trendQuery}"</div>
	        )}
	      </div>

                  Pie
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="watchers">Watchers</option>
              <option value="size">Size</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Profile Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Profile Score Breakdown
        </h3>
        {scoreLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : profileScore?.data ? (
          <ProfileScoreChart data={profileScore.data} type={chartType} />
        ) : (
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No profile score data available</p>
          </div>
        )}
      </motion.div>

      {/* Repository Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Repository Metrics
        </h3>
        {reposLoading ? (
          <div className="flex items-center justify-center h-96">
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

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
            chartType={chartType}
            metric={selectedMetric}
            showTopN={10}
          />
        ) : (
          <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">No repository data available</p>
          </div>
        )}
      </motion.div>

      {/* Language Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
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

      {/* Contribution Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
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
    </div>
  )
}

export default AnalyticsPage
