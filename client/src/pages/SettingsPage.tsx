import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Download, Trash2 } from 'lucide-react'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import ExportModal from '@/components/export/ExportModal'
import { toast } from 'react-hot-toast'

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></span>
  </label>
)

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'Profile' | 'Notifications' | 'Privacy' | 'Export Data'>('Profile')
  const [showExport, setShowExport] = useState(false)

  const { data, isLoading, isError } = useUserSettings()
  const updateSettings = useUpdateUserSettings()

  const [profile, setProfile] = useState({ name: '', email: '', bio: '' })
  const [prefs, setPrefs] = useState({
    auto_refresh: true,
    include_private: false,
    ai_recommendations: true,
    notifications: { email_enabled: true, weekly_digest: true },
    privacy: { show_email: false },
  })

  useEffect(() => {
    if (data?.data) {
      setProfile(data.data.profile || { name: '', email: '', bio: '' })
      setPrefs({
        auto_refresh: true,
        include_private: false,
        ai_recommendations: true,
        notifications: { email_enabled: true, weekly_digest: true },
        privacy: { show_email: false },
        ...(data.data.preferences || {}),
      })
    }
  }, [data])

  const handleSaveProfile = () => {
    updateSettings.mutate(
      { overrides: { name: profile.name, email: profile.email, bio: profile.bio } },
      {
        onSuccess: () => { toast.success('Profile updated') },
        onError: () => { toast.error('Failed to update profile') },
      }
    )
  }

  const handleSavePrefs = () => {
    updateSettings.mutate(
      { preferences: prefs },
      {
        onSuccess: () => { toast.success('Preferences saved') },
        onError: () => { toast.error('Failed to save preferences') },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !data?.data) {
    return <div className="text-red-600">Failed to load settings</div>
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {[
            { icon: User, label: 'Profile' },
            { icon: Bell, label: 'Notifications' },
            { icon: Shield, label: 'Privacy' },
            { icon: Download, label: 'Export Data' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === item.label ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Settings Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Display Name</label>
                <input type="text" className="input mt-1" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input mt-1" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input mt-1 h-20 resize-none" value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
              </div>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={updateSettings.isLoading}>
                {updateSettings.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Analytics Preferences */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Auto-refresh Data</h4>
                  <p className="text-sm text-gray-600">Automatically update your analytics data daily</p>
                </div>
                <Toggle checked={!!prefs.auto_refresh} onChange={(v) => setPrefs((p) => ({ ...p, auto_refresh: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Include Private Repos</h4>
                  <p className="text-sm text-gray-600">Include private repositories in analytics</p>
                </div>
                <Toggle checked={!!prefs.include_private} onChange={(v) => setPrefs((p) => ({ ...p, include_private: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">AI Recommendations</h4>
                  <p className="text-sm text-gray-600">Enable AI-powered project and skill recommendations</p>
                </div>
                <Toggle checked={!!prefs.ai_recommendations} onChange={(v) => setPrefs((p) => ({ ...p, ai_recommendations: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive updates and weekly digest by email</p>
                </div>
                <Toggle checked={!!prefs.notifications?.email_enabled} onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...(p.notifications || {}), email_enabled: v } }))} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Email on Profile</h4>
                  <p className="text-sm text-gray-600">Control whether your email appears in app profile</p>
                </div>
                <Toggle checked={!!prefs.privacy?.show_email} onChange={(v) => setPrefs((p) => ({ ...p, privacy: { ...(p.privacy || {}), show_email: v } }))} />
              </div>
          {/* Notifications Settings */}
          {activeTab === 'Notifications' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates and weekly digest by email</p>
                  </div>
                  <Toggle checked={!!prefs.notifications?.email_enabled} onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...(p.notifications || {}), email_enabled: v } }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                    <p className="text-sm text-gray-600">Summary of your analytics every Monday</p>
                  </div>
                  <Toggle checked={!!prefs.notifications?.weekly_digest} onChange={(v) => setPrefs((p) => ({ ...p, notifications: { ...(p.notifications || {}), weekly_digest: v } }))} />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={handleSavePrefs} disabled={updateSettings.isLoading}>
                    {updateSettings.isLoading ? 'Saving...' : 'Save Notifications'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'Privacy' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Show Email on Profile</h4>
                    <p className="text-sm text-gray-600">Control whether your email appears in app profile</p>
                  </div>
                  <Toggle checked={!!prefs.privacy?.show_email} onChange={(v) => setPrefs((p) => ({ ...p, privacy: { ...(p.privacy || {}), show_email: v } }))} />
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={handleSavePrefs} disabled={updateSettings.isLoading}>
                    {updateSettings.isLoading ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Data */}
          {activeTab === 'Export Data' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
              <p className="text-sm text-gray-600 mb-4">Download your data in JSON, CSV, or PDF formats.</p>
              <button className="btn-primary" onClick={() => setShowExport(true)}>Open Export</button>
              <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
            </div>
          )}


              <div className="flex justify-end">
                <button className="btn-primary" onClick={handleSavePrefs} disabled={updateSettings.isLoading}>
                  {updateSettings.isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingsPage
