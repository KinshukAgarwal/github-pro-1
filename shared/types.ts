// Shared types between client and server

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface GitHubUser {
  id: number
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

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  html_url: string
  language: string
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
}

export interface ProfileAnalytics {
  user_id: string
  overall_score: number
  repository_quality_score: number
  contribution_consistency_score: number
  community_engagement_score: number
  documentation_score: number
  last_updated: string
}

export interface RecommendationRequest {
  user_id: string
  type: 'project' | 'technology' | 'career'
  preferences?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    time_commitment?: 'low' | 'medium' | 'high'
    focus_areas?: string[]
  }
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

export interface ProfileScore {
  overall_score: number
  repository_quality: number
  contribution_consistency: number
  code_quality: number
  community_engagement: number
  documentation_completeness: number
}

export interface LanguageDistribution {
  language: string
  percentage: number
  repositories: number
}

export interface User {
  id: string
  login: string
  name: string
  email: string
  avatar_url: string
  bio?: string
  company?: string
  location?: string
  blog?: string
  twitter_username?: string
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
