import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TechnologyTrend {
  technology: string
  trend: 'rising' | 'stable' | 'declining'
  demand_score: number
  growth_rate: number
  data_points: {
    month: string
    value: number
  }[]
}

interface TechnologyTrendChartProps {
  trends: TechnologyTrend[]
  timeRange?: '6m' | '1y' | '2y'
  showGrowthRates?: boolean
}

const TechnologyTrendChart: React.FC<TechnologyTrendChartProps> = ({
  trends,
  timeRange = '1y',
  showGrowthRates = true
}) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(132, 204, 22, 0.8)',   // Lime
    'rgba(249, 115, 22, 0.8)',   // Orange
  ]

  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(6, 182, 212, 1)',
    'rgba(132, 204, 22, 1)',
    'rgba(249, 115, 22, 1)',
  ]

  // Respect timeRange by slicing to last N months
  const rangeToCount: Record<string, number> = { '6m': 6, '1y': 12, '2y': 24 }
  const monthsCount = rangeToCount[timeRange] || trends[0]?.data_points?.length || 12
  const slicedTrends = trends.map(trend => {
    const pts = trend.data_points.slice(-monthsCount)
    return { ...trend, data_points: pts }
  })

  const labels = slicedTrends[0]?.data_points?.map(point => point.month) || []


  const chartData = {
    labels,
    datasets: slicedTrends.map((trend, index) => ({
      label: trend.technology,
      data: trend.data_points.map(point => point.value),
      borderColor: borderColors[index % borderColors.length],
      backgroundColor: colors[index % colors.length],
      fill: false,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: borderColors[index % borderColors.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    }))
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Technology Demand Trends',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const trend = trends[context.datasetIndex]
            return `${context.dataset.label}: ${context.parsed.y}% (${trend.growth_rate > 0 ? '+' : ''}${trend.growth_rate}% growth)`
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Demand Score (%)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%'
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600 bg-green-50'
      case 'declining':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      </div>

      {/* Technology Summary Cards */}
      {showGrowthRates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trends.slice(0, 8).map((trend, index) => (
            <div key={trend.technology} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 truncate">{trend.technology}</h4>
                {getTrendIcon(trend.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Demand</span>
                  <span className="font-semibold text-gray-900">{trend.demand_score}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Growth</span>
                  <span className={`text-sm font-medium ${
                    trend.growth_rate > 0 ? 'text-green-600' :
                    trend.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {trend.growth_rate > 0 ? '+' : ''}{trend.growth_rate}%
                  </span>
                </div>

                <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(trend.trend)}`}>
                  {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
                </div>
              </div>

              {/* Mini trend line */}
              <div className="mt-3">
                <div className="h-8 flex items-end space-x-1">
                  {trend.data_points.slice(-6).map((point, pointIndex) => (
                    <div
                      key={pointIndex}
                      className="flex-1 bg-gray-200 rounded-sm"
                      style={{
                        height: `${(point.value / 100) * 100}%`,
                        backgroundColor: borderColors[index % borderColors.length],
                        opacity: 0.7
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trend Analysis Summary */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {trends.filter(t => t.trend === 'rising').length}
            </div>
            <div className="text-sm text-gray-600">Rising Technologies</div>
            <div className="text-xs text-gray-500 mt-1">
              High growth potential
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {trends.filter(t => t.trend === 'stable').length}
            </div>
            <div className="text-sm text-gray-600">Stable Technologies</div>
            <div className="text-xs text-gray-500 mt-1">
              Consistent demand
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {trends.filter(t => t.trend === 'declining').length}
            </div>
            <div className="text-sm text-gray-600">Declining Technologies</div>
            <div className="text-xs text-gray-500 mt-1">
              Consider alternatives
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Insight:</strong> Focus on rising technologies for maximum career impact.
            The fastest growing technology is <strong>{trends.reduce((max, t) => t.growth_rate > max.growth_rate ? t : max, trends[0])?.technology}</strong>
            with {trends.reduce((max, t) => t.growth_rate > max.growth_rate ? t : max, trends[0])?.growth_rate}% growth.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TechnologyTrendChart
