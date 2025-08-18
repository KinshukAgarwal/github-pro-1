import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Lightbulb,
  FileText,
  Github,
  TrendingUp,
  Users
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get comprehensive insights into your GitHub profile with detailed scoring and metrics.'
  },
  {
    icon: Lightbulb,
    title: 'AI Recommendations',
    description: 'Receive personalized project and technology recommendations powered by AI.'
  },
  {
    icon: FileText,
    title: 'README Enhancement',
    description: 'Automatically generate professional README files for your repositories.'
  },
  {
    icon: TrendingUp,
    title: 'Career Growth',
    description: 'Track your progress and identify opportunities for professional development.'
  }
]

const stats = [
  { label: 'Profiles Analyzed', value: '10,000+', icon: Users },
  { label: 'READMEs Generated', value: '5,000+', icon: FileText },
  { label: 'Recommendations Made', value: '25,000+', icon: Lightbulb },
  { label: 'Average Score Improvement', value: '40%', icon: TrendingUp }
]

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-blue-100 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Supercharge Your{' '}
              <span className="text-primary-600">GitHub Profile</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Get comprehensive analytics, AI-powered recommendations, and automated 
              README generation to enhance your developer profile and accelerate your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <Github className="h-5 w-5" />
                <span>Get Started with GitHub</span>
              </Link>
              <Link
                to="#features"
                className="btn-outline text-lg px-8 py-4"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to 
              optimize your GitHub presence and advance your career.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your GitHub Profile?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who have already enhanced their 
              profiles and accelerated their careers.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-md font-semibold hover:bg-gray-50 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>Start Your Analysis</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
