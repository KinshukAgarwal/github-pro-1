import React from 'react'
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
import { ProfileScore } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ProfileScoreChartProps {
  data: ProfileScore
  type?: 'bar' | 'doughnut'
}

const ProfileScoreChart: React.FC<ProfileScoreChartProps> = ({ 
  data, 
  type = 'bar' 
}) => {
  const chartData = {
    labels: [
      'Repository Quality',
      'Contribution Consistency',
      'Community Engagement',
      'Documentation'
    ],
    datasets: [
      {
        label: 'Score',
        data: [
          data.repository_quality,
          data.contribution_consistency,
          data.community_engagement,
          data.documentation_completeness
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: type === 'doughnut',
      },
      title: {
        display: true,
        text: `Overall Score: ${data.overall_score}/100`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed.y || context.parsed}/100`
          }
        }
      }
    },
    scales: type === 'bar' ? {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%'
          }
        }
      },
    } : undefined,
  }

  return (
    <div className="h-64 w-full min-w-0">
      {type === 'bar' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Doughnut data={chartData} options={options} />
      )}
    </div>
  )
}

export default ProfileScoreChart
