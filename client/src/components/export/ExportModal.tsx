import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Download, 
  FileText, 
  Database, 
  FileImage,
  Settings,
  Loader2
} from 'lucide-react'
import { useExportProfile, useExportFormats, ExportOptions } from '@/hooks/useExport'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf' | 'xlsx' | 'xml'>('json')
  const [options, setOptions] = useState<Partial<ExportOptions>>({
    includeRecommendations: true,
    includeAnalytics: true,
    includeRepositories: true,
    includeContributions: false
  })
  const [showAdvanced, setShowAdvanced] = useState(false)


  const { data: exportFormats, isLoading: formatsLoading, error: formatsError } = useExportFormats()
  const exportMutation = useExportProfile()

  // Debug: Log authentication status
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token')
    console.log('Export Modal - Auth token exists:', !!token)
    console.log('Export Modal - Formats error:', formatsError)
    console.log('Export Modal - Export formats:', exportFormats)
  }, [formatsError, exportFormats])

  const formatIcons = {
    json: Database,
    csv: FileText,
    pdf: FileImage,
    xlsx: FileText,
    xml: Database
  }

  // Default formats to show if API fails
  const defaultFormats = [
    { id: 'json', name: 'JSON', description: 'Raw data format', mime_type: 'application/json', file_extension: 'json' },
    { id: 'csv', name: 'CSV', description: 'Spreadsheet format', mime_type: 'text/csv', file_extension: 'csv' },
    { id: 'pdf', name: 'PDF', description: 'Document format', mime_type: 'application/pdf', file_extension: 'pdf' },
    { id: 'xlsx', name: 'Excel', description: 'Excel workbook', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file_extension: 'xlsx' },
    { id: 'xml', name: 'XML', description: 'Structured data', mime_type: 'application/xml', file_extension: 'xml' }
  ]

  // Use API formats if available, otherwise use defaults
  const availableFormats = exportFormats?.formats || defaultFormats

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync({
        format: selectedFormat,
        ...options
      })
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

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
            className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Export Profile Data</h2>
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
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                {formatsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : formatsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Failed to load export formats</p>
                    <p className="text-sm text-gray-600">Using default formats</p>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { id: 'json', name: 'JSON', description: 'Raw data format' },
                        { id: 'csv', name: 'CSV', description: 'Spreadsheet format' },
                        { id: 'pdf', name: 'PDF', description: 'Document format' },
                        { id: 'xlsx', name: 'Excel', description: 'Excel workbook' },
                        { id: 'xml', name: 'XML', description: 'Structured data' }
                      ].map((format) => {
                        const Icon = formatIcons[format.id as keyof typeof formatIcons]
                        const isSelected = selectedFormat === format.id

                        return (
                          <button
                            key={format.id}
                            onClick={() => setSelectedFormat(format.id as any)}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <Icon className="h-8 w-8 mx-auto mb-2" />
                            <div className="font-medium">{format.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {format.description}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableFormats.map((format) => {
                      const Icon = formatIcons[format.id as keyof typeof formatIcons]
                      const isSelected = selectedFormat === format.id
                      
                      return (
                        <button
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id as any)}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Icon className="h-8 w-8 mx-auto mb-2" />
                          <div className="font-medium">{format.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {format.description}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Include Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Include in Export
                </label>
                <div className="space-y-3">
                  {[
                    { key: 'includeAnalytics', label: 'Profile Analytics', description: 'Scores, metrics, and insights' },
                    { key: 'includeRepositories', label: 'Repository Data', description: 'Repository information and statistics' },
                    { key: 'includeRecommendations', label: 'AI Recommendations', description: 'Project and technology suggestions' },
                    { key: 'includeContributions', label: 'Contribution History', description: 'Daily contribution data (slower)' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options[option.key as keyof typeof options] as boolean}
                          onChange={(e) => handleOptionChange(option.key as keyof ExportOptions, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  <span>Advanced Options</span>
                  <motion.div
                    animate={{ rotate: showAdvanced ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-4"
                    >
                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date Range (Optional)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                            <input
                              type="date"
                              className="input text-sm"
                              onChange={(e) => handleOptionChange('dateRange', {
                                ...options.dateRange,
                                start: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Date</label>
                            <input
                              type="date"
                              className="input text-sm"
                              onChange={(e) => handleOptionChange('dateRange', {
                                ...options.dateRange,
                                end: e.target.value
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Export Preview</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Format: <span className="font-medium">{selectedFormat.toUpperCase()}</span></div>
                  <div>
                    Includes: {Object.entries(options)
                      .filter(([key, value]) => key.startsWith('include') && value)
                      .map(([key]) => key.replace('include', '').toLowerCase())
                      .join(', ') || 'Basic profile data'}
                  </div>
                  {options.dateRange?.start && options.dateRange?.end && (
                    <div>
                      Date Range: {options.dateRange.start} to {options.dateRange.end}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Export will be downloaded to your device
              </div>

              {/* Error Display */}
              {exportMutation.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    {exportMutation.error.message || 'Export failed. Please try again.'}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="btn-ghost"
                  disabled={exportMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportMutation.isLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {exportMutation.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export {selectedFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default ExportModal
