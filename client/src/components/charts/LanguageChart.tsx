import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { LanguageDistribution } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend)

interface LanguageChartProps {
  data: LanguageDistribution[]
}

const LanguageChart: React.FC<LanguageChartProps> = ({ data }) => {
  // Generate colors for languages
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'
  ]

  const chartData = {
    labels: data.map(item => item.language),
    datasets: [
      {
        data: data.map(item => item.percentage),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color),
        borderWidth: 2,
      },
    ],
  }

  const options = {
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            return `${label}: ${value.toFixed(1)}%`
          }
        }
      }
    },
  }

  if (data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        No language data available
      </div>
    )
  }

  return (
    <div className="h-64 w-full min-w-0">
      <Pie data={chartData} options={options} />
    </div>
  )
}

export default LanguageChart
