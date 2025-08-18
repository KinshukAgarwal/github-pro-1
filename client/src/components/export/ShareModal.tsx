import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Share2, 
  Link as LinkIcon, 
  Twitter, 
  Linkedin, 
  Facebook,
  Copy,
  Check,
  Globe,
  Lock,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { useGenerateShareLink, useShareToSocial, useSocialShare, copyToClipboard } from '@/hooks/useExport'
import { toast } from 'react-hot-toast'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [shareOptions, setShareOptions] = useState({
    includePrivateData: false,
    expiresIn: '7d',
    allowedDomains: [] as string[]
  })
  const [copiedLink, setCopiedLink] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  const generateShareLinkMutation = useGenerateShareLink()
  const shareToSocialMutation = useShareToSocial()
  const { data: socialShareData } = useSocialShare('twitter')

  const handleGenerateLink = async () => {
    try {
      const result = await generateShareLinkMutation.mutateAsync(shareOptions)
      setGeneratedLink(result.share_url)
    } catch (error) {
      console.error('Failed to generate share link:', error)
    }
  }

  const handleCopyLink = async (link: string) => {
    const success = await copyToClipboard(link)
    if (success) {
      setCopiedLink(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      toast.error('Failed to copy link')
    }
  }

  const handleSocialShare = (platform: string, url?: string) => {
    shareToSocialMutation.mutate({ platform, url })
  }

  const socialPlatforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: socialShareData?.share_urls?.twitter
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: socialShareData?.share_urls?.linkedin
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: socialShareData?.share_urls?.facebook
    }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Share2 className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Share Profile</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Social Media Sharing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Share on Social Media</h3>
                <div className="grid grid-cols-3 gap-3">
                  {socialPlatforms.map((platform) => {
                    const Icon = platform.icon
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleSocialShare(platform.id, platform.url)}
                        className={`flex flex-col items-center p-4 rounded-lg text-white transition-colors ${platform.color}`}
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">{platform.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate Shareable Link */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Generate Shareable Link</h3>
                
                {/* Share Options */}
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">Public Profile</div>
                        <div className="text-sm text-gray-500">Anyone with the link can view</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!shareOptions.includePrivateData}
                        onChange={(e) => setShareOptions(prev => ({ 
                          ...prev, 
                          includePrivateData: !e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">Include Private Data</div>
                        <div className="text-sm text-gray-500">Include sensitive information</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareOptions.includePrivateData}
                        onChange={(e) => setShareOptions(prev => ({ 
                          ...prev, 
                          includePrivateData: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Link Expiration
                    </label>
                    <select
                      value={shareOptions.expiresIn}
                      onChange={(e) => setShareOptions(prev => ({ 
                        ...prev, 
                        expiresIn: e.target.value 
                      }))}
                      className="input"
                    >
                      <option value="1h">1 Hour</option>
                      <option value="1d">1 Day</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button */}
                {!generatedLink ? (
                  <button
                    onClick={handleGenerateLink}
                    disabled={generateShareLinkMutation.isLoading}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    {generateShareLinkMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4" />
                        <span>Generate Shareable Link</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 mb-1">Shareable Link</div>
                          <div className="text-sm text-gray-600 truncate">{generatedLink}</div>
                        </div>
                        <button
                          onClick={() => handleCopyLink(generatedLink)}
                          className="ml-3 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          {copiedLink ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(generatedLink, '_blank')}
                        className="flex-1 btn-outline flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => setGeneratedLink(null)}
                        className="flex-1 btn-ghost"
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Share Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCopyLink(window.location.href)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 text-left"
                  >
                    <Copy className="h-5 w-5 text-gray-400 mb-2" />
                    <div className="font-medium text-gray-900">Copy Current URL</div>
                    <div className="text-sm text-gray-500">Share this page directly</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const text = `Check out my GitHub profile analytics!`
                      const url = window.location.href
                      if (navigator.share) {
                        navigator.share({ title: 'GitHub Profile Analytics', text, url })
                      } else {
                        handleCopyLink(`${text} ${url}`)
                      }
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 text-left"
                  >
                    <Share2 className="h-5 w-5 text-gray-400 mb-2" />
                    <div className="font-medium text-gray-900">Native Share</div>
                    <div className="text-sm text-gray-500">Use device share menu</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 text-center">
                Shared profiles respect your privacy settings and GitHub permissions
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default ShareModal
