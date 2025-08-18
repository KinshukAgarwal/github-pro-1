import React from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Users, 
  Star, 
  GitBranch,
  Building,
  Mail,
  Twitter,
  ExternalLink,
  TrendingUp
} from 'lucide-react'
import { User } from '@/types'

interface UserProfileCardProps {
  user: User
  profileScore?: number
  totalStars?: number
  totalRepos?: number
  className?: string
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  profileScore,
  totalStars,
  totalRepos,
  className = ''
}) => {
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score?: number) => {
    if (!score) return 'Unrated'
    if (score >= 90) return 'Elite'
    if (score >= 80) return 'Expert'
    if (score >= 70) return 'Advanced'
    if (score >= 60) return 'Intermediate'
    if (score >= 40) return 'Beginner'
    return 'Novice'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${className}`}
    >
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="relative">
          <img
            src={user.avatar_url}
            alt={user.name || user.login}
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
          />
          {profileScore && (
            <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-white shadow-lg border-2 ${
              profileScore >= 80 ? 'border-green-500 text-green-600' :
              profileScore >= 60 ? 'border-yellow-500 text-yellow-600' :
              profileScore >= 40 ? 'border-orange-500 text-orange-600' :
              'border-red-500 text-red-600'
            }`}>
              {profileScore}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {user.name || user.login}
            </h2>
            {profileScore && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profileScore >= 80 ? 'bg-green-100 text-green-800' :
                profileScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                profileScore >= 40 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getScoreBadge(profileScore)}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-lg">@{user.login}</p>
          
          {user.bio && (
            <p className="text-gray-700 mt-2 leading-relaxed">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <GitBranch className="h-5 w-5 text-blue-600 mr-1" />
            <span className="text-xl font-bold text-gray-900">
              {totalRepos?.toLocaleString() || user.public_repos.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">Repositories</p>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Star className="h-5 w-5 text-yellow-600 mr-1" />
            <span className="text-xl font-bold text-gray-900">
              {totalStars?.toLocaleString() || '0'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Stars</p>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-5 w-5 text-purple-600 mr-1" />
            <span className="text-xl font-bold text-gray-900">
              {user.followers.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">Followers</p>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-5 w-5 text-green-600 mr-1" />
            <span className="text-xl font-bold text-gray-900">
              {user.following.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">Following</p>
        </div>
      </div>

      {/* Profile Score Section */}
      {profileScore && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Profile Score
            </h3>
            <span className={`text-2xl font-bold ${getScoreColor(profileScore)}`}>
              {profileScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                profileScore >= 80 ? 'bg-green-500' :
                profileScore >= 60 ? 'bg-yellow-500' :
                profileScore >= 40 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${profileScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Your GitHub profile is rated as <strong>{getScoreBadge(profileScore)}</strong> level
          </p>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact & Links</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user.company && (
            <div className="flex items-center text-gray-600">
              <Building className="h-4 w-4 mr-2" />
              <span className="truncate">{user.company}</span>
            </div>
          )}

          {user.location && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{user.location}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              <a 
                href={`mailto:${user.email}`}
                className="truncate hover:text-blue-600 transition-colors"
              >
                {user.email}
              </a>
            </div>
          )}

          {user.blog && (
            <div className="flex items-center text-gray-600">
              <LinkIcon className="h-4 w-4 mr-2" />
              <a 
                href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-blue-600 transition-colors flex items-center"
              >
                {user.blog}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          {user.twitter_username && (
            <div className="flex items-center text-gray-600">
              <Twitter className="h-4 w-4 mr-2" />
              <a 
                href={`https://twitter.com/${user.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-blue-600 transition-colors flex items-center"
              >
                @{user.twitter_username}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Joined {joinDate}</span>
          </div>
        </div>
      </div>

      {/* GitHub Profile Link */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <a
          href={`https://github.com/${user.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          View on GitHub
          <ExternalLink className="h-4 w-4 ml-2" />
        </a>
      </div>
    </motion.div>
  )
}

export default UserProfileCard
