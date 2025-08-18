import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Code,
  Sparkles,
  Eye,
  Edit3
} from 'lucide-react'
import { ReadmeAnalysis } from '@/types'

interface RepositoryAnalysisCardProps {
  analysis: ReadmeAnalysis
  onGenerateReadme?: (repositoryId: number) => void
  onImproveReadme?: (repositoryId: number) => void
  onViewReadme?: (repositoryId: number) => void
}

const RepositoryAnalysisCard: React.FC<RepositoryAnalysisCardProps> = ({
  analysis,
  onGenerateReadme,
  onImproveReadme,
  onViewReadme
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // kept for potential future use; currently not used to avoid TS unused warnings
  // const getQualityBgColor = (score: number) => {
  //   if (score >= 80) return 'bg-green-100'
  //   if (score >= 60) return 'bg-yellow-100'
  //   if (score >= 40) return 'bg-orange-100'
  //   return 'bg-red-100'
  // }

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-blue-100 text-blue-800',
      'Python': 'bg-green-100 text-green-800',
      'Java': 'bg-red-100 text-red-800',
      'Go': 'bg-cyan-100 text-cyan-800',
      'Rust': 'bg-orange-100 text-orange-800',
      'C++': 'bg-purple-100 text-purple-800',
      'C#': 'bg-indigo-100 text-indigo-800',
    }
    return colors[language] || 'bg-gray-100 text-gray-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card hover:shadow-lg transition-all duration-300 border-l-4 ${
        analysis.has_readme 
          ? analysis.quality_score >= 70 
            ? 'border-l-green-500' 
            : 'border-l-yellow-500'
          : 'border-l-red-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {analysis.repository_name}
            </h3>
            {analysis.language && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getLanguageColor(analysis.language)}`}>
                {analysis.language}
              </span>
            )}
          </div>
          
          {analysis.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {analysis.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(analysis.last_analyzed).toLocaleDateString()}
            </span>
            {analysis.topics.length > 0 && (
              <span className="flex items-center">
                <Code className="h-3 w-3 mr-1" />
                {analysis.topics.length} topics
              </span>
            )}
          </div>
        </div>

        {/* README Status & Quality Score */}
        <div className="flex items-center space-x-3 ml-4">
          <div className="text-center">
            {analysis.has_readme ? (
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            )}
            <div className="text-xs text-gray-500">
              {analysis.has_readme ? 'Has README' : 'No README'}
            </div>
          </div>

          {analysis.has_readme && (
            <div className="text-center">
              <div className={`text-lg font-bold ${getQualityColor(analysis.quality_score)}`}>
                {analysis.quality_score}%
              </div>
              <div className="text-xs text-gray-500">Quality</div>
            </div>
          )}
        </div>
      </div>

      {/* Topics */}
      {analysis.topics.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {analysis.topics.slice(0, 5).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
              >
                {topic}
              </span>
            ))}
            {analysis.topics.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{analysis.topics.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quality Indicators */}
      {analysis.has_readme && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">README Quality</span>
            <span className={`text-sm font-medium ${getQualityColor(analysis.quality_score)}`}>
              {analysis.quality_score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                analysis.quality_score >= 80 ? 'bg-green-500' :
                analysis.quality_score >= 60 ? 'bg-yellow-500' :
                analysis.quality_score >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${analysis.quality_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Missing Sections & Suggestions */}
      {(analysis.missing_sections.length > 0 || analysis.suggestions.length > 0) && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Eye className="h-4 w-4 mr-1" />
            {isExpanded ? 'Hide Details' : 'Show Issues & Suggestions'}
          </button>

          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {isExpanded && (
              <div className="mt-3 space-y-3">
                {analysis.missing_sections.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Sections</h4>
                    <div className="space-y-1">
                      {analysis.missing_sections.map((section, index) => (
                        <div key={index} className="flex items-center text-sm text-red-600">
                          <AlertCircle className="h-3 w-3 mr-2" />
                          {section}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
                    <div className="space-y-1">
                      {analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="flex items-start text-sm text-gray-600">
                          <Sparkles className="h-3 w-3 mr-2 mt-0.5 text-yellow-500" />
                          {suggestion}
                        </div>
                      ))}
                      {analysis.suggestions.length > 3 && (
                        <div className="text-xs text-gray-500 ml-5">
                          +{analysis.suggestions.length - 3} more suggestions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Last analyzed: {new Date(analysis.last_analyzed).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          {analysis.has_readme && (
            <button
              onClick={() => onViewReadme?.(analysis.repository_id)}
              className="btn-ghost text-sm flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>View</span>
            </button>
          )}
          
          {analysis.has_readme ? (
            <button
              onClick={() => onImproveReadme?.(analysis.repository_id)}
              className="btn-outline text-sm flex items-center space-x-1"
            >
              <Edit3 className="h-3 w-3" />
              <span>Improve</span>
            </button>
          ) : (
            <button
              onClick={() => onGenerateReadme?.(analysis.repository_id)}
              className="btn-primary text-sm flex items-center space-x-1"
            >
              <FileText className="h-3 w-3" />
              <span>Generate</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RepositoryAnalysisCard
