import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, AlertCircle, Plus, RefreshCw, BarChart3, TrendingUp } from 'lucide-react'
import { useReadmeAnalysis, useReadmeTemplates } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import RepositoryAnalysisCard from '@/components/readme/RepositoryAnalysisCard'
import ReadmeGenerator from '@/components/readme/ReadmeGenerator'
import LoadingSpinner from '@/components/LoadingSpinner'

const ReadmePage = () => {
  const { user } = useAuth()
  const [selectedRepository, setSelectedRepository] = useState<{
    id: number
    name: string
  } | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  const {
    data: analysisData,
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis
  } = useReadmeAnalysis()

  const { data: templatesData } = useReadmeTemplates()

  const handleGenerateReadme = (repositoryId: number, repositoryName: string) => {
    setSelectedRepository({ id: repositoryId, name: repositoryName })
    setShowGenerator(true)
  }

  const handleImproveReadme = (repositoryId: number) => {
    const analysis = analysisData?.data?.analyses?.find((a: any) => a.repository_id === repositoryId)
    if (analysis) {
      handleGenerateReadme(repositoryId, analysis.repository_name)
    }
  }

  const handleViewReadme = (repositoryId: number) => {
    const analysis = analysisData?.data?.analyses?.find((a: any) => a.repository_id === repositoryId)
    if (analysis && user) {
      // Use the authenticated user's login and the repository name to create the correct URL
      window.open(`https://github.com/${user.login}/${analysis.repository_name}`, '_blank')
    }
  }

  if (showGenerator && selectedRepository) {
    return (
      <ReadmeGenerator
        repositoryId={selectedRepository.id}
        repositoryName={selectedRepository.name}
        onClose={() => {
          setShowGenerator(false)
          setSelectedRepository(null)
          refetchAnalysis()
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">README Enhancement</h1>
          <p className="text-gray-600 mt-2">
            Analyze and improve your repository documentation
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => refetchAnalysis()}
            disabled={analysisLoading}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${analysisLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate README</span>
          </button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {analysisData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Repositories',
              value: analysisData.data.total_repositories.toString(),
              color: 'text-blue-600',
              icon: FileText
            },
            {
              title: 'With README',
              value: analysisData.data.repositories_with_readme.toString(),
              color: 'text-green-600',
              icon: CheckCircle
            },
            {
              title: 'Need Improvement',
              value: (analysisData.data.total_repositories - analysisData.data.repositories_with_readme).toString(),
              color: 'text-orange-600',
              icon: AlertCircle
            },
            {
              title: 'Average Quality',
              value: `${analysisData.data.average_quality_score}%`,
              color: 'text-purple-600',
              icon: BarChart3
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card text-center"
            >
              <div className="flex justify-center mb-2">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.title}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Repository Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          Repository Analysis
        </h3>

        {analysisLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : analysisError ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load repository analysis</p>
            <button onClick={() => refetchAnalysis()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : analysisData?.data?.analyses?.length > 0 ? (

          <div className="grid gap-6">
            {(((analysisData!.data as any).analyses as any[]) || []).map((analysis: any) => (
              <RepositoryAnalysisCard
                key={analysis.repository_id}
                analysis={analysis}
                onGenerateReadme={(id) => handleGenerateReadme(id, analysis.repository_name)}
                onImproveReadme={handleImproveReadme}
                onViewReadme={handleViewReadme}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No repositories found for analysis</p>
            <button onClick={() => refetchAnalysis()} className="btn-primary">
              Refresh Analysis
            </button>
          </div>
        )}
      </motion.div>

      {/* README Templates */}
      {templatesData?.data?.templates && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400 transition-colors cursor-pointer bg-primary-50">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
                <h4 className="font-medium text-primary-900">AI-Generated</h4>
              </div>
              <p className="text-sm text-primary-700">
                Let AI create a custom README based on your repository
              </p>
            </div>
            {templatesData.data.templates.map((template: any) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
              >
                <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {template.category}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ReadmePage
