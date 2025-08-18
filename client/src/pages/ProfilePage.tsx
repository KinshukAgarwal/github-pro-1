import { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Star, GitBranch, BookOpen, Activity, Flame, RefreshCw } from 'lucide-react'
import {
  useUserProfile,
  useProfileScore,
  useRepositoryAnalysis,
  useContributionPatterns,
  useLanguageDistribution,
} from '@/hooks/useApi'
import UserProfileCard from '@/components/profile/UserProfileCard'
import ProfileScoreChart from '@/components/charts/ProfileScoreChart'
import LanguageChart from '@/components/charts/LanguageChart'
import ContributionHeatmap from '@/components/charts/ContributionHeatmap'
import LoadingSpinner from '@/components/LoadingSpinner'

const ProfilePage = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { data: user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUserProfile()
  const { data: score, isLoading: scoreLoading, error: scoreError, refetch: refetchScore } = useProfileScore()
  const { data: repos, isLoading: reposLoading, error: reposError, refetch: refetchRepos } = useRepositoryAnalysis()
  const { data: contributions, isLoading: contribLoading, error: contribError, refetch: refetchContrib } = useContributionPatterns(selectedYear)
  const { data: languages, isLoading: langsLoading, error: langsError, refetch: refetchLangs } = useLanguageDistribution()
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await Promise.all([refetchUser(), refetchScore(), refetchRepos(), refetchContrib(), refetchLangs()])
    } finally {
      setRefreshing(false)
    }
  }

  const userData = (user?.data as any) || null
  const scoreData = (score?.data as any) || null
  const repoData = (repos?.data as any) || null
  const langsData = (languages?.data as any[]) || []

  const totalStars = repoData?.total_stars || 0
  const totalRepos = repoData?.total_repos || userData?.public_repos || 0
  const readmeCoverage = repoData?.readme_coverage || 0

  const anyLoading = userLoading || scoreLoading || reposLoading

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Analysis</h1>
          <p className="text-gray-600 mt-2">Detailed analysis of your GitHub profile and repositories</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-outline flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </motion.div>

      {/* Profile header card */}
      {anyLoading ? (
        <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : userError ? (
        <div className="card text-red-600">Failed to load profile</div>
      ) : userData ? (
        <UserProfileCard
          user={userData}
          profileScore={scoreData?.overall_score}
          totalStars={totalStars}
          totalRepos={totalRepos}
        />
      ) : null}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Profile Score',
            value: scoreData?.overall_score || 0,
            suffix: '/100',
            icon: Target,
            color: 'text-green-600',
            bg: 'bg-green-50',
            loading: scoreLoading || !!scoreError,
          },
          {
            title: 'Total Repositories',
            value: totalRepos,
            suffix: '',
            icon: GitBranch,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            loading: reposLoading || !!reposError,
          },
          {
            title: 'Total Stars',
            value: totalStars,
            suffix: '',
            icon: Star,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            loading: reposLoading || !!reposError,
          },
          {
            title: 'README Coverage',
            value: `${readmeCoverage}%`,
            suffix: '',
            icon: BookOpen,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            loading: reposLoading || !!reposError,
          },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className={`card ${s.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{s.title}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}{s.suffix}</div>
              </div>
              <s.icon className={`h-6 w-6 ${s.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Target className="h-5 w-5 mr-2" />Score Breakdown</h3>
          {scoreLoading ? (
            <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
          ) : scoreError ? (
            <div className="text-red-600">Failed to load score</div>
          ) : scoreData ? (
            <ProfileScoreChart data={scoreData} type="doughnut" />
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Activity className="h-5 w-5 mr-2" />Language Distribution</h3>
          {langsLoading ? (
            <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
          ) : langsError ? (
            <div className="text-red-600">Failed to load languages</div>
          ) : (langsData?.length || 0) > 0 ? (
            <LanguageChart data={langsData} />
          ) : (
            <div className="text-gray-500">No language data</div>
          )}
        </motion.div>
      </div>

      {/* Contributions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Flame className="h-5 w-5 mr-2" />Contributions</h3>
        {contribLoading ? (
          <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
        ) : contribError ? (
          <div className="text-red-600">Failed to load contributions</div>
        ) : (
          <ContributionHeatmap
            data={(contributions?.data?.daily || []).map((d: any) => ({
              date: d.date,
              count: d.count,
              level: d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 4 ? 2 : d.count <= 6 ? 3 : 4
            }))}
            year={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={[2020, 2021, 2022, 2023, 2024, 2025].filter(y => y <= new Date().getFullYear())}
          />
        )}
      </motion.div>

      {/* Repository Highlights */}
      {repoData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Starred Repository</h3>
            {repoData.most_starred_repo ? (
              <div className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <a href={repoData.most_starred_repo.html_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">{repoData.most_starred_repo.name}</a>
                  <div className="inline-flex items-center text-yellow-600"><Star className="h-4 w-4 mr-1" />{repoData.most_starred_repo.stargazers_count}</div>
                </div>
                {repoData.most_starred_repo.description && (<p className="text-sm text-gray-700 mt-2">{repoData.most_starred_repo.description}</p>)}
              </div>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Recent Repository</h3>
            {repoData.most_recent_repo ? (
              <div className="p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <a href={repoData.most_recent_repo.html_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">{repoData.most_recent_repo.name}</a>
                  <div className="inline-flex items-center text-gray-600"><GitBranch className="h-4 w-4 mr-1" />Updated {new Date(repoData.most_recent_repo.updated_at).toLocaleDateString()}</div>
                </div>
                {repoData.most_recent_repo.description && (<p className="text-sm text-gray-700 mt-2">{repoData.most_recent_repo.description}</p>)}
              </div>
            ) : (
              <div className="text-gray-500">No data</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ProfilePage
