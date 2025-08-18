import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Github,
  Star,
  GitFork,
  MapPin,
  Building,
  ExternalLink,
  TrendingUp,
  Code
} from 'lucide-react'

interface EmbedProfile {
  user: {
    login: string
    name: string
    bio: string
    avatar_url: string
    company: string
    location: string
    public_repos: number
    followers: number
    following: number
    created_at: string
  }
  analytics?: {
    overall_score: number
    activity_score: number
    quality_score: number
    impact_score: number
    consistency_score: number
  }
  repositories?: Array<{
    name: string
    description: string
    language: string
    stargazers_count: number
    forks_count: number
  }>
  settings: {
    includeAnalytics: boolean
  }
}

const EmbedProfilePage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [profile, setProfile] = useState<EmbedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmbedProfile = async () => {
      try {
        const response = await fetch(`/api/share/${shareToken}?embed=true`)
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        const data = await response.json()
        setProfile(data.data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (shareToken) {
      fetchEmbedProfile()
    }
  }, [shareToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="text-4xl mb-2">🔗</div>
          <p className="text-gray-600 text-sm">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white h-full overflow-auto">
      <div className="p-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start space-x-4 mb-6"
        >
          <img
            src={profile.user.avatar_url}
            alt={profile.user.name || profile.user.login}
            className="w-16 h-16 rounded-full border-2 border-gray-200"
          />
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {profile.user.name || profile.user.login}
            </h1>
            <p className="text-gray-600 text-sm mb-2">@{profile.user.login}</p>
            
            {profile.user.bio && (
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">{profile.user.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              {profile.user.company && (
                <div className="flex items-center space-x-1">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{profile.user.company}</span>
                </div>
              )}
              {profile.user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{profile.user.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <a
            href={`https://github.com/${profile.user.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 transition-colors"
          >
            <Github className="h-3 w-3" />
            <span>GitHub</span>
            <ExternalLink className="h-2 w-2" />
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{profile.user.public_repos}</div>
            <div className="text-xs text-gray-600">Repos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{profile.user.followers}</div>
            <div className="text-xs text-gray-600">Followers</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{profile.user.following}</div>
            <div className="text-xs text-gray-600">Following</div>
          </div>
        </motion.div>

        {/* Analytics */}
        {profile.settings.includeAnalytics && profile.analytics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Analytics
            </h3>
            
            <div className="space-y-3">
              {[
                { label: 'Overall', value: profile.analytics.overall_score, color: 'bg-blue-500' },
                { label: 'Activity', value: profile.analytics.activity_score, color: 'bg-green-500' },
                { label: 'Quality', value: profile.analytics.quality_score, color: 'bg-purple-500' },
                { label: 'Impact', value: profile.analytics.impact_score, color: 'bg-orange-500' },
                { label: 'Consistency', value: profile.analytics.consistency_score, color: 'bg-red-500' }
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 w-20">{metric.label}</span>
                  <div className="flex-1 mx-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${metric.color} h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-8 text-right">{metric.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Repositories */}
        {profile.repositories && profile.repositories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Code className="h-4 w-4 mr-1" />
              Top Repositories
            </h3>
            
            <div className="space-y-3">
              {profile.repositories.slice(0, 4).map((repo, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{repo.name}</h4>
                  {repo.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      {repo.language && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{repo.language}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{repo.stargazers_count}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <GitFork className="h-3 w-3" />
                        <span>{repo.forks_count}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <span>Powered by</span>
            <Github className="h-3 w-3" />
            <span>GitHub Analytics</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmbedProfilePage
