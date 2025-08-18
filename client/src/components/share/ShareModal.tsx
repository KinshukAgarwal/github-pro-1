import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Copy, 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Github,
  Mail,
  Link2,
  QrCode,
  Download,
  Eye,
  Globe,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useGenerateShareLink } from '@/hooks/useExport'
import { useAuth } from '@/hooks/useAuth'
import QRCode from 'qrcode'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'link' | 'social' | 'embed' | 'qr'>('link')
  const [shareOptions, setShareOptions] = useState({
    includePrivateRepos: false,
    includeContributions: true,
    includeAnalytics: true,
    includeRecommendations: false,
    customMessage: '',
    expiresIn: '30d' as '1d' | '7d' | '30d' | '90d' | 'never',
    allowComments: false,
    trackViews: true,
    requireAuth: false
  })
  const [shareLink, setShareLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareStats] = useState({ views: 0, shares: 0 })

  const generateShareLink = useGenerateShareLink()

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      const result = await generateShareLink.mutateAsync({
        expiresIn: shareOptions.expiresIn
      })

      setShareLink(result.share_url)

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(result.share_url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(qrUrl)
      
      toast.success('Share link generated successfully!')
    } catch (error) {
      toast.error('Failed to generate share link')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const shareToSocial = (platform: string) => {
    const message = shareOptions.customMessage || `Check out my GitHub profile analytics!`
    const url = shareLink || `${window.location.origin}/profile/${user?.login}`
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('GitHub Profile Analytics')}&body=${encodeURIComponent(`${message}\n\n${url}`)}`
    }
    
    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400')
    }
  }

  const getEmbedCode = () => {
    const embedUrl = shareLink.replace('/share/', '/embed/')
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`
  }

  const tabs = [
    { id: 'link', label: 'Share Link', icon: Link2 },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'embed', label: 'Embed', icon: Globe },
    { id: 'qr', label: 'QR Code', icon: QrCode }
  ]

  const socialPlatforms = [
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-500', textColor: 'text-white' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', textColor: 'text-white' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', textColor: 'text-white' },
    { id: 'reddit', name: 'Reddit', icon: Github, color: 'bg-orange-500', textColor: 'text-white' },
    { id: 'email', name: 'Email', icon: Mail, color: 'bg-gray-600', textColor: 'text-white' }
  ]

  useEffect(() => {
    if (isOpen && !shareLink) {
      handleGenerateLink()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Share Your Profile</h2>
                  <p className="text-sm text-gray-600">Share your GitHub analytics with the world</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 p-6">
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Share Options */}
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Share Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeContributions}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, includeContributions: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include contributions</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeAnalytics}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Include analytics</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={shareOptions.trackViews}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, trackViews: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Track views</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires in
                    </label>
                    <select
                      value={shareOptions.expiresIn}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, expiresIn: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="90d">90 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                {/* Stats */}
                {shareLink && (
                  <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Share Stats</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Views</span>
                        <span className="text-sm font-medium text-gray-900">{shareStats.views}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Shares</span>
                        <span className="text-sm font-medium text-gray-900">{shareStats.shares}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                {activeTab === 'link' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Link</h3>
                      
                      {isGenerating ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-3 text-gray-600">Generating share link...</span>
                        </div>
                      ) : shareLink ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={shareLink}
                              readOnly
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                            />
                            <button
                              onClick={() => copyToClipboard(shareLink)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => window.open(shareLink, '_blank')}
                              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Preview</span>
                            </button>
                            
                            <button
                              onClick={handleGenerateLink}
                              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-4">No share link generated yet</p>
                          <button
                            onClick={handleGenerateLink}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Generate Link
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={shareOptions.customMessage}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, customMessage: e.target.value }))}
                        placeholder="Add a personal message to your shared profile..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {socialPlatforms.map((platform) => {
                          const Icon = platform.icon
                          return (
                            <button
                              key={platform.id}
                              onClick={() => shareToSocial(platform.id)}
                              disabled={!shareLink}
                              className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${platform.color} ${platform.textColor} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">Share on {platform.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'embed' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Embed Code</h3>
                      {shareLink ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              HTML Embed Code
                            </label>
                            <div className="relative">
                              <textarea
                                value={getEmbedCode()}
                                readOnly
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(getEmbedCode())}
                                className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
                            <div className="bg-white border border-gray-200 rounded p-4">
                              <iframe
                                src={shareLink.replace('/share/', '/embed/')}
                                width="100%"
                                height="300"
                                frameBorder="0"
                                className="rounded"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">Generate a share link first to get the embed code.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'qr' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
                      {qrCodeUrl ? (
                        <div className="text-center space-y-4">
                          <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                          </div>
                          <p className="text-sm text-gray-600">Scan this QR code to view your profile</p>
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              link.download = `${user?.login}-profile-qr.png`
                              link.href = qrCodeUrl
                              link.click()
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download QR Code</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-center">Generate a share link first to create a QR code.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ShareModal
