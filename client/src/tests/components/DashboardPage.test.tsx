import React from 'react'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render, createMockUser, createMockAnalytics } from '../setup'
import DashboardPage from '@/pages/DashboardPage'
import { server } from '../mocks/server'
import { rest } from 'msw'

// Mock the chart components to avoid canvas issues in tests
jest.mock('@/components/charts/ProfileScoreChart', () => {
  return function MockProfileScoreChart({ data }: any) {
    return <div data-testid="profile-score-chart">Profile Score: {data?.overall_score}</div>
  }
})

jest.mock('@/components/charts/LanguageChart', () => {
  return function MockLanguageChart({ data }: any) {
    return <div data-testid="language-chart">Languages: {data?.length}</div>
  }
})

jest.mock('@/components/charts/ContributionHeatmap', () => {
  return function MockContributionHeatmap({ data, year }: any) {
    return <div data-testid="contribution-heatmap">Contributions: {data?.length} for {year}</div>
  }
})

jest.mock('@/components/charts/TechnologyTrendChart', () => {
  return function MockTechnologyTrendChart({ trends }: any) {
    return <div data-testid="technology-trend-chart">Trends: {trends?.length}</div>
  }
})

jest.mock('@/components/charts/RepositoryMetricsChart', () => {
  return function MockRepositoryMetricsChart({ repositories }: any) {
    return <div data-testid="repository-metrics-chart">Repositories: {repositories?.length}</div>
  }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    // Mock successful authentication
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: { user: createMockUser() }
          })
        )
      })
    )
  })

  it('renders dashboard with loading states initially', async () => {
    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of your GitHub profile analytics and insights')).toBeInTheDocument()
    
    // Should show loading states
    expect(screen.getAllByText('Loading...')).toHaveLength(4) // One for each stat card
  })

  it('displays user statistics when data loads', async () => {
    // Mock API responses
    server.use(
      rest.get('/api/user/testuser/repositories', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              { id: 1, name: 'repo1', stargazers_count: 10 },
              { id: 2, name: 'repo2', stargazers_count: 20 }
            ]
          })
        )
      }),
      rest.get('/api/analytics/testuser/score', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: createMockAnalytics({ overall_score: 85 })
          })
        )
      }),
      rest.get('/api/analytics/testuser/repositories', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: { total_stars: 30 }
          })
        )
      })
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total repositories
      expect(screen.getByText('30')).toBeInTheDocument() // Total stars
      expect(screen.getByText('85')).toBeInTheDocument() // Profile score
      expect(screen.getByText('100')).toBeInTheDocument() // Followers
    })
  })

  it('displays charts when data is available', async () => {
    server.use(
      rest.get('/api/analytics/testuser/languages', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              { name: 'TypeScript', percentage: 60 },
              { name: 'JavaScript', percentage: 40 }
            ]
          })
        )
      })
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-score-chart')).toBeInTheDocument()
      expect(screen.getByTestId('language-chart')).toBeInTheDocument()
      expect(screen.getByTestId('contribution-heatmap')).toBeInTheDocument()
      expect(screen.getByTestId('technology-trend-chart')).toBeInTheDocument()
    })
  })

  it('handles refresh functionality', async () => {
    const mockRefetch = jest.fn()
    
    render(<DashboardPage />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeInTheDocument()

    fireEvent.click(refreshButton)

    // Should show loading state
    expect(refreshButton).toHaveClass('animate-spin')
  })

  it('opens export modal when export button is clicked', async () => {
    render(<DashboardPage />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(screen.getByText('Export Profile Data')).toBeInTheDocument()
    })
  })

  it('opens share modal when share button is clicked', async () => {
    render(<DashboardPage />)

    const shareButton = screen.getByRole('button', { name: /share/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(screen.getByText('Share Profile')).toBeInTheDocument()
    })
  })

  it('handles time range selection', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('Last 6 Months')
      expect(timeRangeSelect).toBeInTheDocument()

      fireEvent.change(timeRangeSelect, { target: { value: '1y' } })
      expect(timeRangeSelect).toHaveValue('1y')
    })
  })

  it('displays error states when API calls fail', async () => {
    server.use(
      rest.get('/api/analytics/testuser/score', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success: false,
            error: 'Internal server error'
          })
        )
      })
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No profile score data available')).toBeInTheDocument()
    })
  })

  it('displays quick actions section', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Export Report')).toBeInTheDocument()
      expect(screen.getByText('View Insights')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('shows market analysis section', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Market Analysis')).toBeInTheDocument()
      expect(screen.getByText('Rising Technologies')).toBeInTheDocument()
      expect(screen.getByText('Stable Technologies')).toBeInTheDocument()
      expect(screen.getByText('Declining Technologies')).toBeInTheDocument()
    })
  })

  it('handles responsive design classes', () => {
    render(<DashboardPage />)

    const statsGrid = screen.getByText('Total Repositories').closest('.grid')
    expect(statsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')

    const chartsGrid = screen.getByTestId('language-chart').closest('.grid')
    expect(chartsGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
  })

  it('displays technology trend insights', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/Focus on rising technologies for maximum career impact/)).toBeInTheDocument()
      expect(screen.getByText(/The fastest growing technology is/)).toBeInTheDocument()
    })
  })

  it('handles loading states for individual components', async () => {
    // Mock delayed responses
    server.use(
      rest.get('/api/analytics/testuser/languages', (req, res, ctx) => {
        return res(
          ctx.delay(1000),
          ctx.status(200),
          ctx.json({
            success: true,
            data: []
          })
        )
      })
    )

    render(<DashboardPage />)

    // Should show loading spinner for language chart
    expect(screen.getByTestId('language-chart').closest('.card')).toContainHTML('Loading...')
  })
})
