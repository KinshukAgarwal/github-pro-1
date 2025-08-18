import { GitHubService } from './githubService'
import logger from '@/utils/logger'

export interface CareerInsight {
  current_level: string
  experience_years: number
  primary_technologies: string[]
  skill_distribution: Record<string, number>
  career_paths: Array<{
    title: string
    level: string
    salary_range: { min: number; max: number; currency: string }
    required_skills: string[]
    growth_potential: number
    market_demand: number
  }>
  skill_gaps: Array<{
    skill: string
    priority: 'high' | 'medium' | 'low'
    estimated_time: string
  }>
  market_trends: Array<{
    technology: string
    trend: 'rising' | 'stable' | 'declining'
    demand_score: number
    salary_impact: number
  }>
  salary_insights: {
    current_estimate: { min: number; max: number; currency: string }
    potential_with_recommendations: { min: number; max: number; currency: string }
    top_paying_skills: string[]
  }
  next_steps: string[]
  certifications: Array<{ name: string; provider: string; value: number; url: string }>
  networking_opportunities: Array<{ type: string; description: string; value: number }>
  reasoning: string
}

export class CareerInsightsService {
  private githubService: GitHubService

  private techTrends = [
    { technology: 'TypeScript', trend: 'rising' as const, demand_score: 95, salary_impact: 15 },
    { technology: 'React', trend: 'stable' as const, demand_score: 90, salary_impact: 12 },
    { technology: 'Python', trend: 'rising' as const, demand_score: 88, salary_impact: 18 },
    { technology: 'Kubernetes', trend: 'rising' as const, demand_score: 85, salary_impact: 25 },
    { technology: 'Go', trend: 'rising' as const, demand_score: 82, salary_impact: 22 },
    { technology: 'Rust', trend: 'rising' as const, demand_score: 78, salary_impact: 28 },
    { technology: 'AWS', trend: 'rising' as const, demand_score: 92, salary_impact: 20 },
    { technology: 'Docker', trend: 'stable' as const, demand_score: 85, salary_impact: 15 }
  ]

  private careerPaths = [
    {
      title: 'Frontend Developer',
      level: 'mid',
      salary_range: { min: 70000, max: 120000, currency: 'USD' },
      required_skills: ['JavaScript', 'React', 'CSS', 'HTML'],
      growth_potential: 85,
      market_demand: 90
    },
    {
      title: 'Full Stack Developer',
      level: 'mid',
      salary_range: { min: 80000, max: 140000, currency: 'USD' },
      required_skills: ['JavaScript', 'React', 'Node.js', 'Database'],
      growth_potential: 90,
      market_demand: 95
    },
    {
      title: 'DevOps Engineer',
      level: 'mid',
      salary_range: { min: 90000, max: 160000, currency: 'USD' },
      required_skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
      growth_potential: 95,
      market_demand: 88
    },
    {
      title: 'Backend Developer',
      level: 'mid',
      salary_range: { min: 75000, max: 130000, currency: 'USD' },
      required_skills: ['Python', 'Node.js', 'Database', 'API'],
      growth_potential: 88,
      market_demand: 92
    }
  ]

  constructor(githubService: GitHubService) {
    this.githubService = githubService
  }

  async generateCareerInsights(login: string): Promise<CareerInsight> {
    try {
      const [userProfile, repositories] = await Promise.all([
        this.githubService.getUser(login).catch(() => null),
        this.githubService.getAuthenticatedUserRepositories({
          type: 'all',
          sort: 'updated',
          per_page: 100
        }).catch(() => [])
      ])

      const techStack = this.analyzeTechStack(repositories)
      const experienceYears = this.calculateExperienceYears(userProfile)
      const currentLevel = this.determineCurrentLevel(experienceYears, repositories, techStack)
      const skillDistribution = this.calculateSkillDistribution(techStack)
      const careerPaths = this.getRelevantCareerPaths(techStack)
      const skillGaps = this.identifySkillGaps(techStack, careerPaths)
      const marketTrends = this.getRelevantTrends(techStack)
      const salaryInsights = this.calculateSalaryInsights(currentLevel, techStack)
      const nextSteps = this.generateNextSteps(skillGaps, careerPaths)
      const certifications = this.recommendCertifications(techStack)
      const networking = this.suggestNetworkingOpportunities()

      return {
        current_level: currentLevel,
        experience_years: experienceYears,
        primary_technologies: techStack.slice(0, 5),
        skill_distribution: skillDistribution,
        career_paths: careerPaths,
        skill_gaps: skillGaps,
        market_trends: marketTrends,
        salary_insights: salaryInsights,
        next_steps: nextSteps,
        certifications: certifications,
        networking_opportunities: networking,
        reasoning: this.generateReasoning(currentLevel, techStack, repositories.length)
      }
    } catch (error) {
      logger.error('Error generating career insights:', error)
      return this.getFallbackInsights()
    }
  }

  private analyzeTechStack(repositories: any[]): string[] {
    const languageCount: Record<string, number> = {}

    for (const repo of repositories) {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1
      }
    }

    return Object.entries(languageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lang]) => lang)
  }

  private calculateExperienceYears(userProfile: any): number {
    if (!userProfile?.created_at) return 1
    return Math.max(1, Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)))
  }

  private determineCurrentLevel(experienceYears: number, repositories: any[], techStack: string[]): string {
    const repoCount = repositories.length
    const hasComplexProjects = repositories.some(repo => repo.stargazers_count > 10 || repo.forks_count > 5)
    const diverseTechStack = techStack.length >= 5

    if (experienceYears >= 7 && repoCount >= 30 && hasComplexProjects && diverseTechStack) {
      return 'Senior Developer'
    } else if (experienceYears >= 4 && repoCount >= 15 && (hasComplexProjects || diverseTechStack)) {
      return 'Mid-Level Developer'
    } else if (experienceYears >= 2 && repoCount >= 8) {
      return 'Junior+ Developer'
    } else {
      return 'Junior Developer'
    }
  }

  private calculateSkillDistribution(techStack: string[]): Record<string, number> {
    const total = techStack.length
    const distribution: Record<string, number> = {}

    techStack.forEach((tech, index) => {
      distribution[tech] = Math.round(((total - index) / total) * 100)
    })

    return distribution
  }

  private getRelevantCareerPaths(techStack: string[]) {
    return this.careerPaths.filter(path =>
      path.required_skills.some(skill =>
        techStack.some(tech => tech.toLowerCase().includes(skill.toLowerCase()))
      )
    ).slice(0, 3)
  }

  private identifySkillGaps(techStack: string[], careerPaths: any[]) {
    const gaps = []
    const userSkills = new Set(techStack.map(s => s.toLowerCase()))

    for (const path of careerPaths.slice(0, 2)) {
      for (const skill of path.required_skills) {
        if (!userSkills.has(skill.toLowerCase())) {
          gaps.push({
            skill,
            priority: 'high' as const,
            estimated_time: this.getEstimatedLearningTime(skill)
          })
        }
      }
    }

    return gaps.slice(0, 5)
  }

  private getEstimatedLearningTime(skill: string): string {
    const timeMap: Record<string, string> = {
      'TypeScript': '2-4 weeks',
      'React': '1-3 months',
      'Node.js': '1-2 months',
      'AWS': '2-4 months',
      'Docker': '2-4 weeks',
      'Kubernetes': '2-6 months'
    }
    return timeMap[skill] || '1-2 months'
  }

  private getRelevantTrends(techStack: string[]) {
    return this.techTrends.filter(trend =>
      techStack.some(tech => tech.toLowerCase().includes(trend.technology.toLowerCase()))
    ).slice(0, 6)
  }

  private calculateSalaryInsights(currentLevel: string, techStack: string[]) {
    const baseRanges = {
      'Junior Developer': { min: 50000, max: 75000 },
      'Junior+ Developer': { min: 65000, max: 90000 },
      'Mid-Level Developer': { min: 80000, max: 130000 },
      'Senior Developer': { min: 120000, max: 200000 }
    }

    const base = baseRanges[currentLevel as keyof typeof baseRanges] || baseRanges['Junior Developer']

    const highValueSkills = ['Rust', 'Go', 'Kubernetes', 'AWS', 'Machine Learning', 'TypeScript']
    const skillBonus = techStack.filter(tech =>
      highValueSkills.some(hvs => tech.toLowerCase().includes(hvs.toLowerCase()))
    ).length * 0.08

    const currentMin = Math.round(base.min * (1 + skillBonus))
    const currentMax = Math.round(base.max * (1 + skillBonus))

    return {
      current_estimate: { min: currentMin, max: currentMax, currency: 'USD' },
      potential_with_recommendations: {
        min: Math.round(currentMin * 1.25),
        max: Math.round(currentMax * 1.35),
        currency: 'USD'
      },
      top_paying_skills: ['Rust', 'Kubernetes', 'AWS', 'Machine Learning', 'Go']
    }
  }

  private generateNextSteps(skillGaps: any[], careerPaths: any[]): string[] {
    const steps = []

    if (skillGaps.length > 0) {
      steps.push(`Focus on learning ${skillGaps[0].skill} - high impact skill gap`)
    }

    if (careerPaths.length > 0) {
      steps.push(`Target ${careerPaths[0].title} roles - strong match for your skills`)
    }

    steps.push('Build 2-3 portfolio projects showcasing your best work')
    steps.push('Contribute to open source projects in your domain')
    steps.push('Get certified in cloud platforms (AWS/Azure/GCP)')
    steps.push('Join tech communities and attend networking events')

    return steps.slice(0, 6)
  }

  private recommendCertifications(techStack: string[]) {
    const certs = []

    if (techStack.some(t => t.toLowerCase().includes('aws'))) {
      certs.push({ name: 'AWS Solutions Architect', provider: 'Amazon', value: 95, url: 'https://aws.amazon.com/certification/' })
    }

    if (techStack.some(t => ['JavaScript', 'TypeScript', 'React'].some(js => t.includes(js)))) {
      certs.push({ name: 'React Developer Certification', provider: 'Meta', value: 85, url: 'https://developers.facebook.com/docs/react' })
    }

    certs.push({ name: 'Kubernetes Administrator', provider: 'CNCF', value: 90, url: 'https://www.cncf.io/certification/cka/' })
    certs.push({ name: 'Google Cloud Professional', provider: 'Google', value: 88, url: 'https://cloud.google.com/certification' })

    return certs.slice(0, 4)
  }

  private suggestNetworkingOpportunities() {
    return [
      { type: 'Tech Meetups', description: 'Local developer meetups and conferences', value: 85 },
      { type: 'Online Communities', description: 'Discord, Slack, and Reddit communities', value: 75 },
      { type: 'Open Source', description: 'Contribute to projects and connect with maintainers', value: 90 },
      { type: 'LinkedIn', description: 'Professional networking and industry connections', value: 80 },
      { type: 'Conferences', description: 'Industry conferences and workshops', value: 95 }
    ]
  }

  private generateReasoning(currentLevel: string, techStack: string[], repoCount: number): string {
    const primaryTech = techStack[0] || 'various technologies'
    return `Based on your ${repoCount} repositories and expertise in ${primaryTech}, you're classified as a ${currentLevel}. Your diverse technology stack shows strong potential for growth in modern development roles.`
  }

  private getFallbackInsights(): CareerInsight {
    return {
      current_level: 'Developer',
      experience_years: 2,
      primary_technologies: ['JavaScript', 'Python', 'React'],
      skill_distribution: { 'JavaScript': 90, 'Python': 75, 'React': 85 },
      career_paths: this.careerPaths.slice(0, 2),
      skill_gaps: [],
      market_trends: this.techTrends.slice(0, 5),
      salary_insights: {
        current_estimate: { min: 70000, max: 100000, currency: 'USD' },
        potential_with_recommendations: { min: 85000, max: 125000, currency: 'USD' },
        top_paying_skills: ['Rust', 'Kubernetes', 'AWS']
      },
      next_steps: ['Build portfolio projects', 'Learn cloud technologies', 'Contribute to open source'],
      certifications: [],
      networking_opportunities: [],
      reasoning: 'Based on general developer profile analysis'
    }
  }
}

export const createCareerInsightsService = (githubService: GitHubService): CareerInsightsService => {
  return new CareerInsightsService(githubService)
}
