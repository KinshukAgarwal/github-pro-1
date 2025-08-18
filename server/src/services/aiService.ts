// Load environment variables FIRST
import '@/config/env'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GitHubService } from './githubService'
import { cacheService } from './cacheService'
import logger from '@/utils/logger'
import { z } from 'zod'


// Zod schemas for AI Technology Recommendations
const aiTechLearningPathItemSchema = z.object({
  step: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().default(''),
  resources: z.array(z.union([z.string(), z.object({ title: z.string().optional(), url: z.string().optional() })])).optional().default([]),
  estimated_time: z.string().optional().default('')
}).passthrough()

const aiTechRecommendationSchema = z.object({
  name: z.string(),
  category: z.enum(['language', 'framework', 'tool', 'platform']).optional().default('tool'),
  demand_score: z.union([z.number(), z.string()]).optional(),
  market_demand: z.union([z.number(), z.string()]).optional(),
  learning_curve: z.enum(['easy', 'moderate', 'steep']).optional().default('moderate'),
  time_to_proficiency: z.string().optional().default('2-3 months'),
  related_technologies: z.array(z.string()).optional().default([]),
  job_opportunities: z.union([z.number(), z.string()]).optional().default(0),
  salary_impact: z.union([z.number(), z.string()]).optional().default(0),
  learning_path: z.array(z.union([z.string(), aiTechLearningPathItemSchema])).optional().default([]),
  reasoning: z.string().optional().default('')
}).passthrough()

const aiTechResponseSchema = z.object({
  recommendations: z.array(aiTechRecommendationSchema)
})

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
  next_steps: string[]
  reasoning: string
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null
  private githubService: GitHubService

  constructor(githubService: GitHubService) {
    this.githubService = githubService

    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    } else {
      logger.warn('Gemini API key not provided. AI features will use fallback recommendations.')
    }
  }

  async generateProjectRecommendations(
    username: string,
    userProfile: any,
    repositories: any[],
    preferences?: {
      difficulty?: 'beginner' | 'intermediate' | 'advanced'
      time_commitment?: 'low' | 'medium' | 'high'
      focus_areas?: string[]
    }
  ): Promise<ProjectRecommendation[]> {
    const cacheKey = `project-recommendations:${username}:${JSON.stringify(preferences)}`

    // Try cache first
    const cached = await cacheService.get<ProjectRecommendation[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      let recommendations: ProjectRecommendation[]

      if (this.model) {
        recommendations = await this.generateAIProjectRecommendations(
          userProfile,
          repositories,
          preferences
        )
      } else {
        recommendations = await this.generateFallbackProjectRecommendations(
          userProfile,
          repositories,
          preferences
        )
      }

      // Ensure minimum 5 recommendations
      if (recommendations.length < 5) {
        const fallbackRecommendations = await this.generateFallbackProjectRecommendations(
          userProfile,
          repositories,
          preferences
        )

        // Merge and deduplicate by title
        const existingTitles = new Set(recommendations.map(r => r.title.toLowerCase()))
        const additionalRecommendations = fallbackRecommendations.filter(
          r => !existingTitles.has(r.title.toLowerCase())
        )

        recommendations = [...recommendations, ...additionalRecommendations].slice(0, 8) // Max 8 recommendations
      }

      // Cache for 2 hours
      await cacheService.set(cacheKey, recommendations, { ttl: 7200 })

      return recommendations
    } catch (error) {
      logger.error('Error generating project recommendations:', error)
      // Return fallback recommendations on error
      return this.generateFallbackProjectRecommendations(userProfile, repositories, preferences)
    }
  }

  private async generateAIProjectRecommendations(
    userProfile: any,
    repositories: any[],
    preferences?: any
  ): Promise<ProjectRecommendation[]> {
    const languages = this.extractLanguages(repositories)
    const topics = this.extractTopics(repositories)
    const repoCount = repositories.length
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)

    const prompt = `
    As an expert software development mentor, analyze this GitHub profile and provide 5 personalized project recommendations.

    Profile Analysis:
    - Username: ${userProfile.login}
    - Public Repos: ${repoCount}
    - Total Stars: ${totalStars}
    - Primary Languages: ${languages.slice(0, 5).join(', ')}
    - Common Topics: ${topics.slice(0, 10).join(', ')}
    - Account Age: ${this.calculateAccountAge(userProfile.created_at)} years

    User Preferences:
    - Difficulty: ${preferences?.difficulty || 'any'}
    - Time Commitment: ${preferences?.time_commitment || 'medium'}
    - Focus Areas: ${preferences?.focus_areas?.join(', ') || 'general development'}

    For each recommendation, provide:
    1. Project title and description
    2. Difficulty level (beginner/intermediate/advanced)
    3. Estimated completion time
    4. Required technologies
    5. Learning objectives
    6. Market demand assessment
    7. Career impact score (1-10)
    8. Specific resources (tutorials, docs, examples)
    9. Clear reasoning for why this project fits their profile

    Focus on projects that:
    - Build upon their existing skills
    - Introduce 1-2 new technologies
    - Have real-world applications
    - Align with current market trends
    - Match their experience level

    Return as JSON array with this structure:
    {
      "recommendations": [
        {
          "title": "string",
          "description": "string",
          "difficulty": "beginner|intermediate|advanced",
          "estimated_time": "string",
          "technologies": ["string"],
          "learning_objectives": ["string"],
          "market_demand": "low|medium|high",
          "career_impact": number,
          "resources": {
            "tutorials": ["string"],
            "documentation": ["string"],
            "examples": ["string"]
          },
          "reasoning": "string"
        }
      ]
    }
    `

    const result = await this.model!.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    if (!content) {
      throw new Error('No response from Gemini')
    }

    try {
      // Extract JSON from the response (Gemini might include markdown formatting)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      const parsed = JSON.parse(jsonContent)
      return parsed.recommendations.map((rec: any, index: number) => ({
        id: `ai-project-${Date.now()}-${index}`,
        ...rec
      }))
    } catch (parseError) {
      logger.error('Error parsing Gemini response:', parseError)
      logger.error('Raw response:', content)
      throw new Error('Invalid AI response format')
    }
  }

  private async generateFallbackProjectRecommendations(
    userProfile: any,
    repositories: any[],
    preferences?: any
  ): Promise<ProjectRecommendation[]> {
    const languages = this.extractLanguages(repositories)
    const primaryLanguage = languages[0] || 'JavaScript'
    const difficulty = preferences?.difficulty || 'intermediate'

    const fallbackProjects: Omit<ProjectRecommendation, 'id'>[] = [
      {
        title: `${primaryLanguage} Portfolio Website`,
        description: `Create a professional portfolio website showcasing your projects using ${primaryLanguage}`,
        difficulty: 'beginner',
        estimated_time: '1-2 weeks',
        technologies: [primaryLanguage, 'HTML', 'CSS'],
        learning_objectives: ['Web development basics', 'Portfolio presentation', 'Responsive design'],
        market_demand: 'high',
        career_impact: 7,
        resources: {
          tutorials: ['MDN Web Docs', 'FreeCodeCamp'],
          documentation: [`${primaryLanguage} official docs`],
          examples: ['GitHub portfolio examples']
        },
        reasoning: `Based on your ${primaryLanguage} experience, a portfolio website would showcase your skills effectively.`
      },
      {
        title: 'REST API with Database',
        description: `Build a RESTful API with database integration using ${primaryLanguage}`,
        difficulty: 'intermediate',
        estimated_time: '2-3 weeks',
        technologies: [primaryLanguage, 'Database', 'API Design'],
        learning_objectives: ['Backend development', 'Database design', 'API best practices'],
        market_demand: 'high',
        career_impact: 8,
        resources: {
          tutorials: ['REST API tutorials', 'Database design guides'],
          documentation: ['Express.js docs', 'Database documentation'],
          examples: ['Open source API projects']
        },
        reasoning: 'API development is crucial for backend skills and highly valued in the job market.'
      },
      {
        title: 'Open Source Contribution',
        description: 'Contribute to an open source project in your area of expertise',
        difficulty: difficulty as any,
        estimated_time: '1-4 weeks',
        technologies: languages.slice(0, 3),
        learning_objectives: ['Collaboration skills', 'Code review process', 'Community engagement'],
        market_demand: 'high',
        career_impact: 9,
        resources: {
          tutorials: ['First contributions guide', 'Git collaboration'],
          documentation: ['GitHub guides', 'Open source guides'],
          examples: ['Good first issues', 'Beginner-friendly projects']
        },
        reasoning: 'Open source contributions demonstrate collaboration skills and give back to the community.'
      },
      {
        title: 'Full-Stack Web Application',
        description: `Build a complete web application with frontend, backend, and database using modern ${primaryLanguage} stack`,
        difficulty: 'intermediate',
        estimated_time: '3-4 weeks',
        technologies: [primaryLanguage, 'React/Vue', 'Node.js', 'Database'],
        learning_objectives: ['Full-stack development', 'State management', 'Authentication', 'Deployment'],
        market_demand: 'high',
        career_impact: 9,
        resources: {
          tutorials: ['Full-stack tutorials', 'CRUD application guides'],
          documentation: ['Framework documentation', 'Deployment guides'],
          examples: ['Full-stack project templates']
        },
        reasoning: 'Full-stack skills are highly sought after and demonstrate end-to-end development capabilities.'
      },
      {
        title: 'Mobile App Development',
        description: `Create a mobile application using ${primaryLanguage === 'JavaScript' ? 'React Native' : 'cross-platform frameworks'}`,
        difficulty: 'intermediate',
        estimated_time: '2-3 weeks',
        technologies: [primaryLanguage, 'React Native', 'Mobile UI', 'App Store'],
        learning_objectives: ['Mobile development', 'Cross-platform skills', 'App deployment', 'Mobile UX'],
        market_demand: 'high',
        career_impact: 8,
        resources: {
          tutorials: ['React Native tutorials', 'Mobile development guides'],
          documentation: ['React Native docs', 'Platform-specific guides'],
          examples: ['Mobile app examples', 'UI component libraries']
        },
        reasoning: 'Mobile development skills are increasingly valuable as mobile usage continues to grow.'
      },
      {
        title: 'DevOps & CI/CD Pipeline',
        description: 'Set up automated testing, building, and deployment pipeline for your projects',
        difficulty: 'advanced',
        estimated_time: '1-2 weeks',
        technologies: ['Docker', 'GitHub Actions', 'AWS/Vercel', 'Testing'],
        learning_objectives: ['DevOps practices', 'Automation', 'Cloud deployment', 'Testing strategies'],
        market_demand: 'high',
        career_impact: 9,
        resources: {
          tutorials: ['DevOps tutorials', 'CI/CD guides'],
          documentation: ['Docker docs', 'GitHub Actions docs'],
          examples: ['Pipeline templates', 'Deployment examples']
        },
        reasoning: 'DevOps skills are essential for modern development and highly valued by employers.'
      },
      {
        title: 'Data Analysis Dashboard',
        description: `Create an interactive data visualization dashboard using ${primaryLanguage} and charting libraries`,
        difficulty: 'intermediate',
        estimated_time: '2-3 weeks',
        technologies: [primaryLanguage, 'D3.js/Chart.js', 'Data Processing', 'Visualization'],
        learning_objectives: ['Data visualization', 'Chart libraries', 'Data processing', 'Interactive UI'],
        market_demand: 'high',
        career_impact: 8,
        resources: {
          tutorials: ['Data visualization tutorials', 'Chart.js guides'],
          documentation: ['D3.js docs', 'Data processing libraries'],
          examples: ['Dashboard examples', 'Visualization galleries']
        },
        reasoning: 'Data visualization skills are increasingly important across all industries.'
      },
      {
        title: 'AI/ML Integration Project',
        description: `Integrate machine learning capabilities into a ${primaryLanguage} application`,
        difficulty: 'advanced',
        estimated_time: '3-4 weeks',
        technologies: [primaryLanguage, 'TensorFlow.js', 'API Integration', 'ML Models'],
        learning_objectives: ['AI/ML integration', 'Model deployment', 'API usage', 'Data preprocessing'],
        market_demand: 'high',
        career_impact: 10,
        resources: {
          tutorials: ['ML integration tutorials', 'TensorFlow.js guides'],
          documentation: ['ML library docs', 'API documentation'],
          examples: ['ML project examples', 'Pre-trained models']
        },
        reasoning: 'AI/ML skills are the future of software development and command premium salaries.'
      }
    ]

    // Filter projects based on difficulty preference if specified
    let filteredProjects = fallbackProjects
    if (preferences?.difficulty) {
      const preferredDifficulty = preferences.difficulty
      filteredProjects = fallbackProjects.filter(p =>
        p.difficulty === preferredDifficulty ||
        (preferredDifficulty === 'beginner' && p.difficulty === 'intermediate')
      )

      // If we don't have enough projects for the preferred difficulty, add others
      if (filteredProjects.length < 5) {
        const remainingProjects = fallbackProjects.filter(p => !filteredProjects.includes(p))
        filteredProjects = [...filteredProjects, ...remainingProjects]
      }
    }

    // Ensure we always return at least 5 projects
    const projectsToReturn = filteredProjects.slice(0, Math.max(5, filteredProjects.length))

    return projectsToReturn.map((project, index) => ({
      id: `fallback-project-${Date.now()}-${index}`,
      ...project
    }))
  }

  async generateTechnologyRecommendations(
    username: string,
    userProfile: any,
    repositories: any[]
  ): Promise<TechnologyRecommendation[]> {
    const cacheKey = `tech-recommendations:${username}`

    const cached = await cacheService.get<TechnologyRecommendation[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      let recommendations: TechnologyRecommendation[]

      if (this.model) {
        // Zod schemas to validate and coerce AI output
        const learningPathItemSchema = z.object({
          step: z.number().int().positive().optional(),
          title: z.string().min(1).optional(),
          description: z.string().optional().default(''),
          resources: z.array(z.union([z.string(), z.object({ title: z.string().optional(), url: z.string().optional() })])).optional().default([]),
          estimated_time: z.string().optional().default('')
        }).passthrough()

        const recommendationSchema = z.object({
          name: z.string(),
          category: z.enum(['language', 'framework', 'tool', 'platform']).optional().default('tool'),
          demand_score: z.union([z.number(), z.string()]).optional(),
          market_demand: z.union([z.number(), z.string()]).optional(),
          learning_curve: z.enum(['easy', 'moderate', 'steep']).optional().default('moderate'),
          time_to_proficiency: z.string().optional().default('2-3 months'),
          related_technologies: z.array(z.string()).optional().default([]),
          job_opportunities: z.union([z.number(), z.string()]).optional().default(0),
          salary_impact: z.union([z.number(), z.string()]).optional().default(0),
          learning_path: z.array(z.union([z.string(), learningPathItemSchema])).optional().default([]),
          reasoning: z.string().optional().default('')
        }).passthrough()

        const responseSchema = z.object({
          recommendations: z.array(recommendationSchema)
        })

        recommendations = await this.generateAITechnologyRecommendations(
          userProfile,
          repositories
        )
      } else {
        recommendations = await this.generateFallbackTechnologyRecommendations(
          userProfile,
          repositories
        )
      }

      // Ensure minimum 5 recommendations
      if (recommendations.length < 5) {
        const fallbackRecommendations = await this.generateFallbackTechnologyRecommendations(
          userProfile,
          repositories
        )

        // Merge and deduplicate by name
        const existingNames = new Set(recommendations.map(r => r.name.toLowerCase()))
        const additionalRecommendations = fallbackRecommendations.filter(
          r => !existingNames.has(r.name.toLowerCase())
        )

        recommendations = [...recommendations, ...additionalRecommendations].slice(0, 8) // Max 8 recommendations
      }

      // Sanitize numeric fields to prevent outrageous percentages from AI output
      const clamp = (n: any, min = 0, max = 100) => {
        const num = typeof n === 'string' ? parseFloat(String(n).replace(/[^0-9.\-]/g, '')) : Number(n)
        if (isNaN(num)) return 0
        return Math.min(max, Math.max(min, Math.round(num)))
      }
      const sanitized = recommendations.map(r => ({
        ...r,
        market_demand: clamp((r as any).market_demand),
        job_opportunities: clamp((r as any).job_opportunities),
        salary_impact: clamp((r as any).salary_impact),
      }))

      // Cache for 4 hours
      await cacheService.set(cacheKey, sanitized, { ttl: 14400 })

      return sanitized
    } catch (error) {
      logger.error('Error generating technology recommendations:', error)
      const fallback = await this.generateFallbackTechnologyRecommendations(userProfile, repositories)
      return fallback
    }
  }

  private async generateAITechnologyRecommendations(
    userProfile: any,
    repositories: any[]
  ): Promise<TechnologyRecommendation[]> {
    const languages = this.extractLanguages(repositories)
    const topics = this.extractTopics(repositories)
    const repoCount = repositories.length
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)

    const prompt = `
    As an expert technology consultant and career advisor, analyze this GitHub profile and provide 5 personalized technology recommendations for career growth.

    Profile Analysis:
    - Username: ${userProfile.login}
    - Public Repos: ${repoCount}
    - Total Stars: ${totalStars}
    - Primary Languages: ${languages.slice(0, 5).join(', ')}
    - Common Topics: ${topics.slice(0, 10).join(', ')}
    - Account Age: ${this.calculateAccountAge(userProfile.created_at)} years

    For each technology recommendation, provide:
    1. Technology name and category (language/framework/tool/platform)
    2. Current market demand score (1-100)
    3. Learning curve assessment (easy/moderate/steep)
    4. Market trend (rising/stable/declining)
    5. Salary impact percentage
    6. Time to proficiency estimate
    7. Related technologies and ecosystem
    8. Job market opportunities
    9. Specific learning path with steps
    10. Clear reasoning for recommendation

    Focus on technologies that:
    - Complement their existing skill set
    - Have strong market demand
    - Align with current industry trends
    - Offer career advancement opportunities
    - Match their experience level

    Return as JSON with this structure:
    {
      "recommendations": [
        {
          "name": "string",
          "category": "language|framework|tool|platform",
          "demand_score": number,
          "learning_curve": "easy|moderate|steep",
          "market_trend": "rising|stable|declining",
          "salary_impact": "string",
          "time_to_proficiency": "string",
          "description": "string",
          "learning_path": ["string"],
          "related_technologies": ["string"],
          "job_opportunities": number,
          "resources": [{"title": "string", "url": "string"}],
          "reasoning": "string"
        }
      ]
    }
    `

    const result = await this.model!.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    if (!content) {
      throw new Error('No response from Gemini')
    }

    try {
      // Extract JSON from the response (Gemini might include markdown formatting)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      const parsedRaw = JSON.parse(jsonContent)
      const parsed = aiTechResponseSchema.safeParse(parsedRaw)
      const toNumber = (n: any): number => {
        const num = typeof n === 'string' ? parseFloat(String(n).replace(/[^0-9.\-]/g, '')) : Number(n)
        return isNaN(num) ? 0 : Math.round(num)
      }
      const normalizeLearningPath = (lp: any): Array<{ step: number; title: string; description: string; resources: string[]; estimated_time: string }> => {
        if (!Array.isArray(lp)) return []
        return lp.map((item: any, idx: number) => {
          if (typeof item === 'string') {
            return { step: idx + 1, title: item, description: '', resources: [], estimated_time: '' }
          }
          const title = item?.title || item?.name || `Step ${idx + 1}`
          const description = item?.description || ''
          const resourcesArray: any[] = Array.isArray(item?.resources) ? item.resources : []
          const resources = resourcesArray.map((r: any) => typeof r === 'string' ? r : (r?.title || r?.url || 'Resource'))
          const estimated_time = item?.estimated_time || item?.time || ''
          return { step: item?.step || idx + 1, title, description, resources, estimated_time }
        })
      }

      const recs = (parsed.success ? parsed.data.recommendations : parsedRaw.recommendations) || []

      return recs.map((rec: any, index: number) => ({
        id: `ai-tech-${Date.now()}-${index}`,
        name: rec.name,
        category: rec.category || 'tool',
        current_skill_level: rec.current_skill_level || 'none',
        recommended_level: rec.recommended_level || 'intermediate',
        market_demand: toNumber(rec.demand_score ?? rec.market_demand),
        learning_curve: rec.learning_curve || 'moderate',
        time_to_proficiency: rec.time_to_proficiency || '2-3 months',
        related_technologies: Array.isArray(rec.related_technologies) ? rec.related_technologies : [],
        job_opportunities: toNumber(rec.job_opportunities),
        salary_impact: toNumber(rec.salary_impact),
        learning_path: normalizeLearningPath(rec.learning_path),
        reasoning: rec.reasoning || ''
      }))
    } catch (parseError) {
      logger.error('Error parsing Gemini technology response:', parseError)
      logger.error('Raw response:', content)
      throw new Error('Invalid AI response format')
    }
  }

  private async generateFallbackTechnologyRecommendations(
    userProfile: any,
    repositories: any[]
  ): Promise<TechnologyRecommendation[]> {
    const languages = this.extractLanguages(repositories)
    const hasJavaScript = languages.includes('JavaScript')
    const hasPython = languages.includes('Python')
    const hasJava = languages.includes('Java')

    const allRecommendations: Omit<TechnologyRecommendation, 'reasoning'>[] = [
      // TypeScript - for JavaScript developers
      {
        name: 'TypeScript',
        category: 'language',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 95,
        learning_curve: 'moderate',
        time_to_proficiency: '2-3 months',
        related_technologies: ['JavaScript', 'React', 'Node.js'],
        job_opportunities: 85,
        salary_impact: 15,
        learning_path: [
          {
            step: 1,
            title: 'TypeScript Basics',
            description: 'Learn type annotations and basic TypeScript syntax',
            resources: ['TypeScript Handbook', 'TypeScript Tutorial'],
            estimated_time: '1 week'
          },
          {
            step: 2,
            title: 'Advanced Types',
            description: 'Master interfaces, generics, and advanced type features',
            resources: ['Advanced TypeScript', 'Type Challenges'],
            estimated_time: '2 weeks'
          }
        ]
      },
      // Docker - universal DevOps tool
      {
        name: 'Docker',
        category: 'tool',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 90,
        learning_curve: 'moderate',
        time_to_proficiency: '1-2 months',
        related_technologies: ['Kubernetes', 'CI/CD', 'DevOps'],
        job_opportunities: 80,
        salary_impact: 20,
        learning_path: [
          {
            step: 1,
            title: 'Docker Fundamentals',
            description: 'Learn containerization basics and Docker commands',
            resources: ['Docker Documentation', 'Docker Tutorial'],
            estimated_time: '1 week'
          },
          {
            step: 2,
            title: 'Docker Compose',
            description: 'Multi-container applications and orchestration',
            resources: ['Docker Compose Guide', 'Multi-container Apps'],
            estimated_time: '1 week'
          }
        ]
      },
      // React - popular frontend framework
      {
        name: 'React',
        category: 'framework',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 92,
        learning_curve: 'moderate',
        time_to_proficiency: '2-3 months',
        related_technologies: ['JavaScript', 'TypeScript', 'Next.js'],
        job_opportunities: 88,
        salary_impact: 18,
        learning_path: [
          {
            step: 1,
            title: 'React Fundamentals',
            description: 'Components, props, state, and hooks',
            resources: ['React Documentation', 'React Tutorial'],
            estimated_time: '2 weeks'
          },
          {
            step: 2,
            title: 'Advanced React',
            description: 'Context, performance optimization, and patterns',
            resources: ['Advanced React Patterns', 'React Performance'],
            estimated_time: '2 weeks'
          }
        ]
      },
      // AWS - cloud computing platform
      {
        name: 'AWS',
        category: 'tool',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 88,
        learning_curve: 'steep',
        time_to_proficiency: '3-4 months',
        related_technologies: ['Docker', 'Kubernetes', 'Serverless'],
        job_opportunities: 85,
        salary_impact: 25,
        learning_path: [
          {
            step: 1,
            title: 'AWS Fundamentals',
            description: 'EC2, S3, and basic AWS services',
            resources: ['AWS Documentation', 'AWS Free Tier'],
            estimated_time: '2 weeks'
          },
          {
            step: 2,
            title: 'AWS Deployment',
            description: 'Deploy applications using AWS services',
            resources: ['AWS Deployment Guide', 'AWS Best Practices'],
            estimated_time: '3 weeks'
          }
        ]
      },
      // Python - versatile programming language
      {
        name: 'Python',
        category: 'language',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 89,
        learning_curve: 'easy',
        time_to_proficiency: '2-3 months',
        related_technologies: ['Django', 'Flask', 'Data Science'],
        job_opportunities: 82,
        salary_impact: 16,
        learning_path: [
          {
            step: 1,
            title: 'Python Basics',
            description: 'Syntax, data structures, and basic programming',
            resources: ['Python.org Tutorial', 'Automate the Boring Stuff'],
            estimated_time: '2 weeks'
          },
          {
            step: 2,
            title: 'Python Web Development',
            description: 'Flask or Django for web applications',
            resources: ['Flask Tutorial', 'Django Documentation'],
            estimated_time: '3 weeks'
          }
        ]
      },
      // Node.js - JavaScript runtime
      {
        name: 'Node.js',
        category: 'framework',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 86,
        learning_curve: 'moderate',
        time_to_proficiency: '2-3 months',
        related_technologies: ['JavaScript', 'Express.js', 'MongoDB'],
        job_opportunities: 80,
        salary_impact: 17,
        learning_path: [
          {
            step: 1,
            title: 'Node.js Fundamentals',
            description: 'Server-side JavaScript and npm ecosystem',
            resources: ['Node.js Documentation', 'Node.js Tutorial'],
            estimated_time: '2 weeks'
          },
          {
            step: 2,
            title: 'Express.js Framework',
            description: 'Building REST APIs with Express',
            resources: ['Express.js Guide', 'REST API Tutorial'],
            estimated_time: '2 weeks'
          }
        ]
      },
      // Kubernetes - container orchestration
      {
        name: 'Kubernetes',
        category: 'tool',
        current_skill_level: 'none',
        recommended_level: 'advanced',
        market_demand: 84,
        learning_curve: 'steep',
        time_to_proficiency: '4-6 months',
        related_technologies: ['Docker', 'DevOps', 'Cloud Platforms'],
        job_opportunities: 75,
        salary_impact: 30,
        learning_path: [
          {
            step: 1,
            title: 'Kubernetes Basics',
            description: 'Pods, services, and basic concepts',
            resources: ['Kubernetes Documentation', 'K8s Tutorial'],
            estimated_time: '3 weeks'
          },
          {
            step: 2,
            title: 'Kubernetes Deployment',
            description: 'Deploying and managing applications',
            resources: ['K8s Deployment Guide', 'Production K8s'],
            estimated_time: '4 weeks'
          }
        ]
      },
      // GraphQL - API query language
      {
        name: 'GraphQL',
        category: 'tool',
        current_skill_level: 'none',
        recommended_level: 'intermediate',
        market_demand: 78,
        learning_curve: 'moderate',
        time_to_proficiency: '1-2 months',
        related_technologies: ['React', 'Apollo', 'Node.js'],
        job_opportunities: 70,
        salary_impact: 14,
        learning_path: [
          {
            step: 1,
            title: 'GraphQL Fundamentals',
            description: 'Queries, mutations, and schema design',
            resources: ['GraphQL Documentation', 'GraphQL Tutorial'],
            estimated_time: '1 week'
          },
          {
            step: 2,
            title: 'GraphQL Implementation',
            description: 'Building GraphQL APIs and clients',
            resources: ['Apollo Documentation', 'GraphQL Best Practices'],
            estimated_time: '2 weeks'
          }
        ]
      }
    ]

    // Filter recommendations based on user's current languages and ensure variety
    const recommendations: Omit<TechnologyRecommendation, 'reasoning'>[] = []

    // Always include high-demand universal tools
    recommendations.push(
      allRecommendations.find(r => r.name === 'Docker')!,
      allRecommendations.find(r => r.name === 'AWS')!
    )

    // Add language-specific recommendations
    if (hasJavaScript) {
      recommendations.push(
        allRecommendations.find(r => r.name === 'TypeScript')!,
        allRecommendations.find(r => r.name === 'React')!,
        allRecommendations.find(r => r.name === 'Node.js')!
      )
    } else if (hasPython) {
      recommendations.push(allRecommendations.find(r => r.name === 'Python')!)
    } else {
      // For other languages, recommend popular technologies
      recommendations.push(
        allRecommendations.find(r => r.name === 'Python')!,
        allRecommendations.find(r => r.name === 'React')!
      )
    }

    // Fill remaining slots with other high-value technologies
    const remainingTechs = allRecommendations.filter(tech =>
      !recommendations.some(rec => rec.name === tech.name)
    )

    while (recommendations.length < 5 && remainingTechs.length > 0) {
      recommendations.push(remainingTechs.shift()!)
    }

    // Ensure we have exactly 5-8 recommendations
    const finalRecommendations = recommendations.slice(0, 8)

    return finalRecommendations.map((rec, index) => ({
      id: `fallback-tech-${Date.now()}-${index}`,
      ...rec,
      reasoning: `Recommended based on your current ${languages.join(', ')} experience and high market demand.`
    }))
  }

  private extractLanguages(repositories: any[]): string[] {
    const languageCount: { [key: string]: number } = {}

    repositories.forEach(repo => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1
      }
    })

    return Object.entries(languageCount)
      .sort(([, a], [, b]) => b - a)
      .map(([language]) => language)
  }

  private extractTopics(repositories: any[]): string[] {
    const topicCount: { [key: string]: number } = {}

    repositories.forEach(repo => {
      if (repo.topics) {
        repo.topics.forEach((topic: string) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1
        })
      }
    })

    return Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .map(([topic]) => topic)
  }

  private calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
    return Math.round(diffYears * 10) / 10
  }

  isAIEnabled(): boolean {
    return this.model !== null
  }
}

export const createAIService = (githubService: GitHubService): AIService => {
  return new AIService(githubService)
}
