import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles,
  Settings,
  Eye,
  Download,
  Upload,
  CheckCircle
} from 'lucide-react'
import { useReadmeTemplates, useGenerateReadme, usePublishReadme } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface ReadmeGeneratorProps {
  repositoryId: number
  repositoryName: string
  onClose?: () => void
}

const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({
  repositoryId,
  repositoryName,
  onClose
}) => {
  const { user } = useAuth()
  const [step, setStep] = useState<'configure' | 'preview' | 'publish'>('configure')
  const [generatedReadme, setGeneratedReadme] = useState('')
  const [publishResult, setPublishResult] = useState<any>(null)
  const [configuration, setConfiguration] = useState({
    template_id: '',
    project_description: '',
    technologies: '',
    include_badges: true,
    include_installation: true,
    include_usage: true,
    include_contributing: true,
    include_license: true,
    custom_sections: ''
  })

  const { data: templatesData, isLoading: templatesLoading } = useReadmeTemplates()
  const generateReadme = useGenerateReadme()
  const publishReadme = usePublishReadme()

  const handleGenerate = async () => {
    try {
      const result = await generateReadme.mutateAsync({
        repository_id: repositoryId,
        ...configuration,
        technologies: configuration.technologies.split(',').map(t => t.trim()).filter(Boolean)
      })

      setGeneratedReadme(((result as any)?.data as any)?.readme_content || '')
      setStep('preview')
    } catch (error: any) {
      toast.error(error.error || 'Failed to generate README')
    }
  }

  const handlePublish = async () => {
    try {
      if (!generatedReadme.trim()) {
        toast.error('Cannot publish empty README content')
        return
      }

      const result = await publishReadme.mutateAsync({
        repository_name: repositoryName,
        readme_content: generatedReadme,
        commit_message: 'Add/Update README.md via GitHub Analytics Platform'
      })

      setPublishResult(result.data)
      setStep('publish')
      toast.success('README published successfully!')
    } catch (error: any) {
      console.error('Publish error:', error)

      // Handle specific error types
      if (error.response) {
        const { status, data } = error.response
        switch (status) {
          case 401:
            toast.error('Authentication failed. Please log in again.')
            break
          case 403:
            toast.error('Permission denied. You may not have write access to this repository.')
            break
          case 404:
            toast.error('Repository not found or you do not have access to it.')
            break
          case 422:
            toast.error('Invalid request. Please check the repository status.')
            break
          case 429:
            toast.error('Rate limit exceeded. Please try again later.')
            break
          default:
            toast.error(data?.error || `Failed to publish README (${status})`)
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Failed to publish README. Please try again.')
      }
    }
  }

  const handleDownload = () => {
    const blob = new Blob([generatedReadme], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('README downloaded!')
  }

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-6 w-6 text-primary-600 mr-2" />
            README Generator
          </h2>
          <p className="text-gray-600 mt-1">
            Generate a professional README for <span className="font-medium">{repositoryName}</span>
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { id: 'configure', label: 'Configure', icon: Settings },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'publish', label: 'Publish', icon: Upload }
          ].map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === stepItem.id 
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : index < ['configure', 'preview', 'publish'].indexOf(step)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-400'
              }`}>
                <stepItem.icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === stepItem.id ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {stepItem.label}
              </span>
              {index < 2 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  index < ['configure', 'preview', 'publish'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {step === 'configure' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configure README Generation
            </h3>

            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="label">Template</label>
                <select
                  value={configuration.template_id}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, template_id: e.target.value }))}
                  className="input mt-1"
                >
                  <option value="">AI-Generated (Recommended)</option>
                  {templatesData?.data?.templates?.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a template or let AI generate a custom README
                </p>
              </div>

              {/* Project Description */}
              <div>
                <label className="label">Project Description</label>
                <textarea
                  value={configuration.project_description}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, project_description: e.target.value }))}
                  className="input mt-1 h-20 resize-none"
                  placeholder="Describe what your project does and its key features..."
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="label">Technologies Used</label>
                <input
                  type="text"
                  value={configuration.technologies}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, technologies: e.target.value }))}
                  className="input mt-1"
                  placeholder="React, TypeScript, Node.js, Express (comma-separated)"
                />
              </div>

              {/* Sections to Include */}
              <div>
                <label className="label">Sections to Include</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { key: 'include_badges', label: 'Status Badges' },
                    { key: 'include_installation', label: 'Installation Instructions' },
                    { key: 'include_usage', label: 'Usage Examples' },
                    { key: 'include_contributing', label: 'Contributing Guidelines' },
                    { key: 'include_license', label: 'License Information' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={configuration[option.key as keyof typeof configuration] as boolean}
                        onChange={(e) => setConfiguration(prev => ({ 
                          ...prev, 
                          [option.key]: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Sections */}
              <div>
                <label className="label">Custom Sections (Optional)</label>
                <input
                  type="text"
                  value={configuration.custom_sections}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, custom_sections: e.target.value }))}
                  className="input mt-1"
                  placeholder="API Reference, Deployment, Testing (comma-separated)"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleGenerate}
                disabled={generateReadme.isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                {generateReadme.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Generate README</span>
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preview Generated README
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownload}
                    className="btn-outline text-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setStep('configure')}
                    className="btn-ghost text-sm"
                  >
                    Back to Edit
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {generatedReadme}
                </pre>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('configure')}
                className="btn-outline"
              >
                Back to Configure
              </button>
              <button
                onClick={handlePublish}
                disabled={publishReadme.isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                {publishReadme.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Publish to GitHub</span>
              </button>
            </div>
          </div>
        )}

        {step === 'publish' && (
          <div className="card text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              README Published Successfully!
            </h3>
            <p className="text-gray-600 mb-6">
              Your README has been published to the <span className="font-medium">{repositoryName}</span> repository.
            </p>

            {publishResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-2">
                    README {publishResult.action === 'created' ? 'created' : 'updated'} successfully!
                  </p>
                  <div className="space-y-1">
                    <p>Repository: {user?.login}/{repositoryName}</p>
                    <p>Commit: {publishResult.commit?.sha?.substring(0, 7)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.open(
                  publishResult?.repository_url || `https://github.com/${user?.login}/${repositoryName}`,
                  '_blank'
                )}
                className="btn-outline"
              >
                View Repository
              </button>
              <button
                onClick={() => window.open(
                  publishResult?.readme_url || `https://github.com/${user?.login}/${repositoryName}/blob/main/README.md`,
                  '_blank'
                )}
                className="btn-outline"
              >
                View README
              </button>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ReadmeGenerator
