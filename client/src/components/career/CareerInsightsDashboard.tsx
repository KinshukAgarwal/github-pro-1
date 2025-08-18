import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Users, BookOpen, ExternalLink, Star } from 'lucide-react'

interface CareerInsight {
  current_level: string
  experience_years: number
  primary_technologies: string[]
  skill_distribution: Record<string, number>
  career_paths: Array<{
    title: string
    level: string
    salary_range: { min: number; max: number; currency: string }
    required_skills: string[]
    growth_potential: number
    market_demand: number
  }>
  skill_gaps: Array<{
    skill: string
    priority: 'high' | 'medium' | 'low'
    estimated_time: string
  }>
  market_trends: Array<{
    technology: string
    trend: 'rising' | 'stable' | 'declining'
    demand_score: number
    salary_impact: number
  }>
  salary_insights: {
    current_estimate: { min: number; max: number; currency: string }
    potential_with_recommendations: { min: number; max: number; currency: string }
    top_paying_skills: string[]
  }
  next_steps: string[]
  certifications: Array<{ name: string; provider: string; value: number; url: string }>
  networking_opportunities: Array<{ type: string; description: string; value: number }>
  reasoning: string
}

interface CareerInsightsDashboardProps {
  insights: CareerInsight
  isLoading?: boolean
}

const CareerInsightsDashboard = ({ insights, isLoading }: CareerInsightsDashboardProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSalary = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header with current level and experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{insights.current_level}</h2>
            <p className="text-blue-100">{insights.experience_years} years of experience</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Primary Technologies</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {insights.primary_technologies.slice(0, 3).map((tech, index) => (
                <span key={index} className="px-2 py-1 bg-white/20 rounded text-xs">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Skill Distribution</h3>
        <div className="space-y-3">
          {Object.entries(insights.skill_distribution).slice(0, 5).map(([skill, percentage]) => (
            <div key={skill}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{skill}</span>
                <span className="text-gray-600">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="bg-blue-600 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Career Paths and Salary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Recommended Career Paths
          </h3>
          <div className="space-y-4">
            {insights.career_paths.slice(0, 3).map((path, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{path.title}</h4>
                  <div className="flex space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {path.growth_potential}% growth
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {path.market_demand}% demand
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {formatSalary(path.salary_range.min, path.salary_range.currency)} - {formatSalary(path.salary_range.max, path.salary_range.currency)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {path.required_skills.slice(0, 4).map((skill, skillIndex) => (
                    <span key={skillIndex} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Salary Insights
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Current Estimate</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatSalary(insights.salary_insights.current_estimate.min, insights.salary_insights.current_estimate.currency)} - {formatSalary(insights.salary_insights.current_estimate.max, insights.salary_insights.current_estimate.currency)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">Potential with Recommendations</div>
              <div className="text-2xl font-bold text-green-700">
                {formatSalary(insights.salary_insights.potential_with_recommendations.min, insights.salary_insights.potential_with_recommendations.currency)} - {formatSalary(insights.salary_insights.potential_with_recommendations.max, insights.salary_insights.potential_with_recommendations.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Top Paying Skills</div>
              <div className="flex flex-wrap gap-2">
                {insights.salary_insights.top_paying_skills.map((skill, index) => (
                  <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Market Trends and Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Trends</h3>
          <div className="space-y-3">
            {insights.market_trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(trend.trend)}
                  <span className="font-medium">{trend.technology}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{trend.demand_score}% demand</div>
                  <div className="text-xs text-gray-600">+{trend.salary_impact}% salary impact</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Skill Gaps</h3>
          <div className="space-y-3">
            {insights.skill_gaps.map((gap, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{gap.skill}</div>
                  <div className="text-sm text-gray-600">{gap.estimated_time}</div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(gap.priority)}`}>
                  {gap.priority}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Next Steps and Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Next Steps
          </h3>
          <div className="space-y-3">
            {insights.next_steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Recommended Certifications
          </h3>
          <div className="space-y-3">
            {insights.certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-sm text-gray-600">{cert.provider}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-600">{cert.value}% value</span>
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Networking Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Networking Opportunities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.networking_opportunities.map((opportunity, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">{opportunity.type}</div>
              <div className="text-sm text-gray-600 mb-2">{opportunity.description}</div>
              <div className="text-sm font-medium text-blue-600">{opportunity.value}% networking value</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reasoning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card bg-blue-50"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Summary</h3>
        <p className="text-gray-700">{insights.reasoning}</p>
      </motion.div>
    </div>
  )
}

export default CareerInsightsDashboard
