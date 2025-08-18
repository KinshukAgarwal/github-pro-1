import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Github, 
  Star, 
  GitFork, 
  Calendar, 
  MapPin, 
  Building, 
  Link as LinkIcon, 
  Eye,
  Share2,
  Heart,
  MessageCircle,
  ExternalLink,
  TrendingUp,
  Code
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SharedProfile {
  user: {
    login: string
    name: string
    bio: string
    avatar_url: string
    company: string
    location: string
    blog: string
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
    updated_at: string
  }>
  contributions?: any
  customMessage?: string
  settings: {
    includePrivateRepos: boolean
    includeContributions: boolean
    includeAnalytics: boolean
    includeRecommendations: boolean
    allowComments: boolean
    trackViews: boolean
  }
  shareStats: {
    views: number
    shares: number
  }
}

const SharedProfilePage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [profile, setProfile] = useState<SharedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    const fetchSharedProfile = async () => {
      try {
        const response = await fetch(`/api/share/${shareToken}`)
        if (!response.ok) {
          throw new Error('Failed to load shared profile')
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
      fetchSharedProfile()
    }
  }, [shareToken])

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${profile?.user.name || profile?.user.login}'s GitHub Profile`,
        text: profile?.customMessage || 'Check out this awesome GitHub profile!',
        url: window.location.href
      })
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    toast.success(liked ? 'Removed from favorites' : 'Added to favorites!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This shared profile link may have expired or been removed.'}</p>
          <a href="/" className="btn-primary">
            Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Github className="h-8 w-8 text-gray-900" />
              <span className="text-xl font-bold text-gray-900">GitHub Analytics</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  liked ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Custom Message */}
        {profile.customMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
          >
            <p className="text-blue-800 text-center font-medium">{profile.customMessage}</p>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <img
              src={profile.user.avatar_url}
              alt={profile.user.name || profile.user.login}
              className="w-32 h-32 rounded-full border-4 border-gray-200"
            />
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.user.name || profile.user.login}
              </h1>
              <p className="text-xl text-gray-600 mb-4">@{profile.user.login}</p>
              
              {profile.user.bio && (
                <p className="text-gray-700 mb-4">{profile.user.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.user.company && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{profile.user.company}</span>
                  </div>
                )}
                {profile.user.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.user.location}</span>
                  </div>
                )}
                {profile.user.blog && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profile.user.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.user.blog}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.user.public_repos}</div>
              <div className="text-sm text-gray-600">Repositories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.user.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.user.following}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </motion.div>

        {/* Analytics */}
        {profile.settings.includeAnalytics && profile.analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Analytics
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: 'Overall', value: profile.analytics.overall_score, color: 'blue' },
                { label: 'Activity', value: profile.analytics.activity_score, color: 'green' },
                { label: 'Quality', value: profile.analytics.quality_score, color: 'purple' },
                { label: 'Impact', value: profile.analytics.impact_score, color: 'orange' },
                { label: 'Consistency', value: profile.analytics.consistency_score, color: 'red' }
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className={`text-3xl font-bold text-${metric.color}-600 mb-1`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`bg-${metric.color}-600 h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Repositories */}
        {profile.repositories && profile.repositories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Top Repositories
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.repositories.slice(0, 6).map((repo, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{repo.name}</h3>
                  {repo.description && (
                    <p className="text-sm text-gray-600 mb-3">{repo.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      {repo.language && (
                        <span className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
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
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Share Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Eye className="h-4 w-4" />
                <span>{profile.shareStats.views} views</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Share2 className="h-4 w-4" />
                <span>{profile.shareStats.shares} shares</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {profile.settings.allowComments && (
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Comments</span>
                </button>
              )}
              
              <a
                href={`https://github.com/${profile.user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>View on GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        {showComments && profile.settings.allowComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Comments feature coming soon!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SharedProfilePage
