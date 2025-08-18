// User and Authentication Types
export interface User {
  id: string
  login: string
  name: string
  email: string
  avatar_url: string
  bio: string
  company: string
  location: string
  blog: string
  twitter_username: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Repository Types
export interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  html_url: string
  clone_url: string
  language: string
  languages_url: string
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  size: number
  default_branch: string
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  has_readme: boolean
  readme_quality_score?: number
}

export interface RepositoryLanguages {
  [language: string]: number
}

export interface RepositoryStats {
  total_repos: number
  total_stars: number
  total_forks: number
  total_size: number
  languages: RepositoryLanguages
  topics: string[]
  most_starred_repo: Repository
  most_recent_repo: Repository
}

// Profile Analytics Types
export interface ProfileScore {
  overall_score: number
  repository_quality: number
  contribution_consistency: number
  code_quality: number
  community_engagement: number
  documentation_completeness: number
  breakdown: {
    repository_quality: {
      score: number
      factors: {
        avg_stars_per_repo: number
        repo_diversity: number
        recent_activity: number
        code_quality_indicators: number
      }
    }
    contribution_consistency: {
      score: number
      factors: {
        commit_frequency: number
        contribution_streak: number
        activity_distribution: number
      }
    }
    community_engagement: {
      score: number
      factors: {
        followers_ratio: number
        collaboration_score: number
        issue_participation: number
      }
    }
    documentation_completeness: {
      score: number
      factors: {
        readme_coverage: number
        documentation_quality: number
        wiki_usage: number
      }
    }
  }
}

// Contribution Types
export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ContributionWeek {
  week: number
  days: ContributionDay[]
  total: number
}

export interface ContributionStats {
  total_contributions: number
  weeks: ContributionWeek[]
  longest_streak: number
  current_streak: number
  best_day: ContributionDay
  average_per_day: number
}

// AI Recommendation Types
export interface ProjectRecommendation {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: string
  technologies: string[]
  learning_objectives: string[]
  market_demand: 'low' | 'medium' | 'high'
  career_impact: number
  resources: {
    tutorials: string[]
    documentation: string[]
    examples: string[]
  }
  reasoning: string
}

export interface TechnologyRecommendation {
  name: string
  category: 'language' | 'framework' | 'tool' | 'database'
  current_skill_level: 'none' | 'beginner' | 'intermediate' | 'advanced'
  recommended_level: 'beginner' | 'intermediate' | 'advanced'
  market_demand: number
  learning_curve: 'easy' | 'moderate' | 'steep'
  time_to_proficiency: string
  related_technologies: string[]
  job_opportunities: number
  salary_impact: number
  learning_path: {
    step: number
    title: string
    description: string
    resources: string[]
    estimated_time: string
  }[]
  reasoning: string
}

export interface CareerInsight {
  current_level: string
  suggested_roles: string[]
  skill_gaps: string[]
  market_trends: {
    technology: string
    trend: 'rising' | 'stable' | 'declining'
    demand_score: number
  }[]
  salary_insights: {
    current_estimate: {
      min: number
      max: number
      currency: string
    }
    potential_with_recommendations: {
      min: number
      max: number
      currency: string
    }
  }
}

// README Enhancement Types
export interface ReadmeAnalysis {
  repository_id: number
  repository_name: string
  has_readme: boolean
  current_readme_content?: string
  quality_score: number
  missing_sections: string[]
  suggestions: string[]
  generated_readme?: string
  last_analyzed: string
  language: string
  topics: string[]
  description: string
}

export interface ReadmeGenerationRequest {
  repository_id: number
  template_id?: string
  custom_sections?: string[]
  include_badges?: boolean
  include_installation?: boolean
  include_usage?: boolean
  include_contributing?: boolean
  include_license?: boolean
  project_description?: string
  technologies?: string[]
}

export interface ReadmeTemplate {
  id: string
  name: string
  description: string
  category: string
  template_content: string
  variables: {
    name: string
    description: string
    type: 'text' | 'boolean' | 'array'
    required: boolean
    default?: any
  }[]
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// Chart and Visualization Types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
}

export interface LanguageDistribution {
  language: string
  percentage: number
  bytes: number
}

// Export and Sharing Types
export interface ExportOptions {
  format: 'pdf' | 'png' | 'json'
  sections: string[]
  theme: 'light' | 'dark'
  include_charts: boolean
}

export interface ShareableReport {
  id: string
  user_id: string
  title: string
  description: string
  data: any
  created_at: string
  expires_at?: string
  is_public: boolean
  share_url: string
}
