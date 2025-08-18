import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Clock,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Play
} from 'lucide-react'
import { TechnologyRecommendation } from '@/types'
import apiService from '@/services/api'

import LearningPathWizard from '@/components/learning/LearningPathWizard'
import { safeRoadmapOperation } from '@/utils/errorHandling'

interface TechnologyRecommendationCardProps {
  recommendation: TechnologyRecommendation
  onStartLearning?: (name: string) => void
}

const TechnologyRecommendationCard: React.FC<TechnologyRecommendationCardProps> = ({
  recommendation,
  onStartLearning: _onStartLearning
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const handleAddToRoadmap = async () => {
    await safeRoadmapOperation(
      () => apiService.addRoadmapItem({
        type: 'technology',
        name: recommendation.name,
        meta: {
          time_to_proficiency: recommendation.time_to_proficiency,
          learning_path: recommendation.learning_path
        }
      }),
      'create'
    )
  }


  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'language':
        return 'bg-blue-100 text-blue-800'
      case 'framework':
        return 'bg-green-100 text-green-800'
      case 'tool':
        return 'bg-purple-100 text-purple-800'
      case 'database':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLearningCurveColor = (curve: string) => {
    switch (curve) {
      case 'easy':
        return 'text-green-600'
      case 'moderate':
        return 'text-yellow-600'
      case 'steep':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'none':
        return 'bg-gray-100 text-gray-800'
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {recommendation.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(recommendation.category)}`}>
              {recommendation.category}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded ${getSkillLevelColor(recommendation.current_skill_level)}`}>
              Current: {recommendation.current_skill_level}
            </span>
            <span className="text-gray-400">→</span>
            <span className={`px-2 py-1 rounded ${getSkillLevelColor(recommendation.recommended_level)}`}>
              Target: {recommendation.recommended_level}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.min(100, Math.max(0, Math.round(Number(recommendation.market_demand) || 0)))}%
            </div>
            <div className="text-xs text-gray-500">Market Demand</div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>{recommendation.time_to_proficiency}</span>
        </div>
        <div className="flex items-center text-sm">
          <TrendingUp className={`h-4 w-4 mr-2 ${getLearningCurveColor(recommendation.learning_curve)}`} />
          <span className={getLearningCurveColor(recommendation.learning_curve)}>
            {recommendation.learning_curve} curve
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Briefcase className="h-4 w-4 mr-2" />
          <span>{Math.min(100, Math.max(0, Math.round(Number(recommendation.job_opportunities) || 0)))}% jobs</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          <span>+{Math.min(100, Math.max(0, Math.round(Number(recommendation.salary_impact) || 0)))}% salary</span>
        </div>
      </div>

      {/* Related Technologies */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Related Technologies</h4>
        <div className="flex flex-wrap gap-2">
          {recommendation.related_technologies.slice(0, 5).map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {tech}
            </span>
          ))}
          {recommendation.related_technologies.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm">
              +{recommendation.related_technologies.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium mb-4"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Show Learning Path
          </>
        )}
      </button>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Learning Path */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Learning Path
              </h4>
              <div className="space-y-3">
                {(Array.isArray(recommendation.learning_path) ? recommendation.learning_path : []).map((step: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {step?.step || index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{step?.title || `Step ${index + 1}`}</h5>
                      {step?.description && <p className="text-sm text-gray-600 mb-2">{step.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(step?.resources) ? step.resources : []).map((resource: any, resourceIndex: number) => (
                            <span
                              key={resourceIndex}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              {typeof resource === 'string' ? resource : (resource?.title || resource?.url || 'Resource')}
                            </span>
                          ))}
                        </div>
                        {step?.estimated_time && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {step.estimated_time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Reasoning */}
            {recommendation.reasoning && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Why Learn This?
                </h4>
                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                  {recommendation.reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Salary Impact: +{recommendation.salary_impact}%
        </div>
        <div className="flex space-x-2">
          <button onClick={handleAddToRoadmap} className="btn-outline text-sm">
            Add to Roadmap
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Learning</span>
          </button>
        </div>
      </div>

      {/* Learning Path Wizard */}
      <LearningPathWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        technologyData={recommendation}
      />
    </motion.div>
  )
}

export default TechnologyRecommendationCard
