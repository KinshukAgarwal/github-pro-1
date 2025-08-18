import React, { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { BarChart3, PieChart, Star, GitFork, Eye } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface RepositoryMetric {
  name: string
  stars: number
  forks: number
  watchers: number
  size: number
  language: string
  created_at: string
  updated_at: string
  topics: string[]
}

interface RepositoryMetricsChartProps {
  repositories: RepositoryMetric[]
  chartType?: 'bar' | 'doughnut'
  metric?: 'stars' | 'forks' | 'watchers' | 'size'
  showTopN?: number
}

const RepositoryMetricsChart: React.FC<RepositoryMetricsChartProps> = ({
  repositories,
  chartType = 'bar',
  metric = 'stars',
  showTopN = 10
}) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'doughnut'>(chartType)
  const [activeMetric, setActiveMetric] = useState<'stars' | 'forks' | 'watchers' | 'size'>(metric)

  // Sort repositories by the selected metric and take top N
  const sortedRepos = repositories
    .sort((a, b) => b[activeMetric] - a[activeMetric])
    .slice(0, showTopN)

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(132, 204, 22, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ]

  const borderColors = colors.map(color => color.replace('0.8', '1'))

  const chartData = {
    labels: sortedRepos.map(repo => repo.name.length > 15 ? repo.name.substring(0, 15) + '...' : repo.name),
    datasets: [
      {
        label: activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1),
        data: sortedRepos.map(repo => repo[activeMetric]),
        backgroundColor: colors.slice(0, sortedRepos.length),
        borderColor: borderColors.slice(0, sortedRepos.length),
        borderWidth: 2,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Top ${showTopN} Repositories by ${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          afterLabel: function(context: any) {
            const repo = sortedRepos[context.dataIndex]
            return [
              `Language: ${repo.language || 'Unknown'}`,
              `Created: ${new Date(repo.created_at).toLocaleDateString()}`,
              `Topics: ${repo.topics.slice(0, 3).join(', ')}${repo.topics.length > 3 ? '...' : ''}`
            ]
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            if (activeMetric === 'size') {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'MB' : value + 'KB'
            }
            return value
          }
        }
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: (typeof window !== 'undefined' && window.innerWidth < 1024) ? 'bottom' as const : 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `Repository Distribution by ${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const repo = sortedRepos[context.dataIndex]
            const percentage = ((context.parsed / sortedRepos.reduce((sum, r) => sum + r[activeMetric], 0)) * 100).toFixed(1)
            return `${repo.name}: ${context.parsed} (${percentage}%)`
          }
        }
      },
    },
  }

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'stars':
        return <Star className="h-4 w-4" />
      case 'forks':
        return <GitFork className="h-4 w-4" />
      case 'watchers':
        return <Eye className="h-4 w-4" />
      case 'size':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const formatMetricValue = (value: number, metricType: string) => {
    if (metricType === 'size') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}MB` : `${value}KB`
    }
    return value.toLocaleString()
  }

  const totalMetricValue = repositories.reduce((sum, repo) => sum + repo[activeMetric], 0)
  const averageMetricValue = repositories.length > 0 ? totalMetricValue / repositories.length : 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Metric:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['stars', 'forks', 'watchers', 'size'] as const).map((metricOption) => (
              <button
                key={metricOption}
                onClick={() => setActiveMetric(metricOption)}
                className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                  activeMetric === metricOption
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {getMetricIcon(metricOption)}
                <span>{metricOption.charAt(0).toUpperCase() + metricOption.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                activeChart === 'bar'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Bar</span>
            </button>
            <button
              onClick={() => setActiveChart('doughnut')}
              className={`px-3 py-2 text-sm font-medium flex items-center space-x-1 ${
                activeChart === 'doughnut'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PieChart className="h-4 w-4" />
              <span>Pie</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(totalMetricValue, activeMetric)}
          </div>
          <div className="text-sm text-gray-600">Total {activeMetric}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatMetricValue(Math.round(averageMetricValue), activeMetric)}
          </div>
          <div className="text-sm text-gray-600">Average {activeMetric}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">
            {repositories.length}
          </div>
          <div className="text-sm text-gray-600">Total Repositories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">
            {sortedRepos[0] ? formatMetricValue(sortedRepos[0][activeMetric], activeMetric) : '0'}
          </div>
          <div className="text-sm text-gray-600">Top Repository</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="h-80 min-w-0">
          {activeChart === 'bar' ? (
            <Bar data={chartData} options={barOptions} />
          ) : (
            <Doughnut data={chartData} options={doughnutOptions} />
          )}
        </div>
      </div>

      {/* Top Repositories Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Top {showTopN} Repositories
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stars
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRepos.map((repo, index) => (
                <tr key={repo.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: colors[index] }} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{repo.name}</div>
                        <div className="text-sm text-gray-500">
                          {repo.topics.slice(0, 2).join(', ')}
                          {repo.topics.length > 2 && '...'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repo.language || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repo.stars.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {repo.forks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RepositoryMetricsChart
