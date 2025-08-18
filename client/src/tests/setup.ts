import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { server } from './mocks/server'

// Configure React Testing Library
configure({ testIdAttribute: 'data-testid' })

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location
delete (window as any).location
window.location = {
  ...window.location,
  href: 'https://git-viz-lytics.vercel.app',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock fetch
global.fetch = jest.fn()

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}))

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => {
  const React = require('react')
  const Mock = ({ 'data-testid': testId, children, ...rest }: any) => React.createElement('div', { 'data-testid': testId, ...rest }, children)
  return {
    Line: ({ data, options }: any) => React.createElement(Mock, { 'data-testid': 'line-chart', 'data-chart-data': JSON.stringify(data) }),
    Bar: ({ data, options }: any) => React.createElement(Mock, { 'data-testid': 'bar-chart', 'data-chart-data': JSON.stringify(data) }),
    Doughnut: ({ data, options }: any) => React.createElement(Mock, { 'data-testid': 'doughnut-chart', 'data-chart-data': JSON.stringify(data) }),
    Pie: ({ data, options }: any) => React.createElement(Mock, { 'data-testid': 'pie-chart', 'data-chart-data': JSON.stringify(data) }),
  }
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}))

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: '12345',
  login: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: 'https://github.com/images/error/testuser_happy.gif',
  bio: 'Test user bio',
  company: 'Test Company',
  location: 'Test Location',
  blog: 'https://testuser.dev',
  twitter_username: 'testuser',
  public_repos: 10,
  followers: 100,
  following: 50,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
})

export const createMockRepository = (overrides = {}) => ({
  id: 123456,
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  description: 'A test repository',
  private: false,
  html_url: 'https://github.com/testuser/test-repo',
  language: 'TypeScript',
  stargazers_count: 10,
  watchers_count: 5,
  forks_count: 2,
  size: 1024,
  topics: ['test', 'typescript'],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-01T00:00:00Z',
  pushed_at: '2023-06-01T00:00:00Z',
  ...overrides
})

export const createMockAnalytics = (overrides = {}) => ({
  overall_score: 85,
  repository_quality: 80,
  contribution_consistency: 90,
  community_engagement: 85,
  documentation_completeness: 80,
  total_repos: 10,
  total_stars: 100,
  total_forks: 25,
  languages: [
    { name: 'TypeScript', percentage: 60 },
    { name: 'JavaScript', percentage: 30 },
    { name: 'Python', percentage: 10 }
  ],
  ...overrides
})

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Custom render function with providers
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
