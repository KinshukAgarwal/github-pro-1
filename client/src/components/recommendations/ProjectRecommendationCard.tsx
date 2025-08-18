import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  TrendingUp,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  BookOpen,
  Play
} from 'lucide-react'
import { ProjectRecommendation } from '@/types'
import apiService from '@/services/api'

import ProjectWizard from '@/components/project/ProjectWizard'
import { safeRoadmapOperation } from '@/utils/errorHandling'

interface ProjectRecommendationCardProps {
  recommendation: ProjectRecommendation
  onStartProject?: (id: string) => void
}

const ProjectRecommendationCard: React.FC<ProjectRecommendationCardProps> = ({
  recommendation,
  onStartProject: _onStartProject
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const handleSaveRoadmap = async () => {
    await safeRoadmapOperation(
      () => apiService.addRoadmapItem({
        type: 'project',
        name: recommendation.title,
        meta: { description: recommendation.description }
      }),
      'create'
    )
  }


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  const getMarketDemandColor = (demand: string) => {
    switch (demand) {
      case 'high':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {recommendation.title}
          </h3>
          <p className="text-gray-600 mb-3">
            {recommendation.description}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
            {recommendation.difficulty}
          </span>
          <div className="flex items-center text-yellow-500">
            <Star className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{recommendation.career_impact}/10</span>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>{recommendation.estimated_time}</span>
        </div>
        <div className="flex items-center text-sm">
          <TrendingUp className={`h-4 w-4 mr-2 ${getMarketDemandColor(recommendation.market_demand)}`} />
          <span className={getMarketDemandColor(recommendation.market_demand)}>
            {recommendation.market_demand} demand
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Target className="h-4 w-4 mr-2" />
          <span>Career Impact</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Lightbulb className="h-4 w-4 mr-2" />
          <span>{recommendation.technologies.length} techs</span>
        </div>
      </div>

      {/* Technologies */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {recommendation.technologies.map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
            >
              {tech}
            </span>
          ))}
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
            Show Details
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
            {/* Learning Objectives */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Learning Objectives
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {recommendation.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {recommendation.resources.tutorials.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Tutorials</h5>
                    <ul className="space-y-1">
                      {recommendation.resources.tutorials.map((tutorial, index) => (
                        <li key={index} className="text-gray-600 flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {tutorial}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.resources.documentation.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Documentation</h5>
                    <ul className="space-y-1">
                      {recommendation.resources.documentation.map((doc, index) => (
                        <li key={index} className="text-gray-600 flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.resources.examples.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Examples</h5>
                    <ul className="space-y-1">
                      {recommendation.resources.examples.map((example, index) => (
                        <li key={index} className="text-gray-600 flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* AI Reasoning */}
            {recommendation.reasoning && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Why This Project?
                </h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
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
          Career Impact: {recommendation.career_impact}/10
        </div>
        <div className="flex space-x-2">
          <button onClick={handleSaveRoadmap} className="btn-outline text-sm">Save to Roadmap</button>
          <button
            onClick={() => setShowWizard(true)}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Project</span>
          </button>
        </div>
      </div>

      {/* Project Wizard */}
      <ProjectWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        projectData={recommendation}
      />
    </motion.div>
  )
}

export default ProjectRecommendationCard
