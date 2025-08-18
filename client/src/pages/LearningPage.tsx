import { useLocation, Link } from 'react-router-dom'

const curated: Record<string, { title: string; url: string; type: 'video' | 'doc' | 'course' }[]> = {
  React: [
    { title: 'Official React Docs', url: 'https://react.dev/learn', type: 'doc' },
    { title: 'React Hooks Tutorial (Net Ninja)', url: 'https://www.youtube.com/watch?v=LlvBzyy-558', type: 'video' },
    { title: 'Epic React by Kent C. Dodds', url: 'https://epicreact.dev/', type: 'course' }
  ],
  TypeScript: [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'doc' },
    { title: 'TypeScript for Beginners (Traversy)', url: 'https://www.youtube.com/watch?v=BCg4U1FzODs', type: 'video' }
  ],
}

const LearningPage = () => {
  const params = new URLSearchParams(useLocation().search)
  const topic = params.get('topic') || 'React'
  const list = curated[topic] || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Start Learning: {topic}</h1>
          <p className="text-gray-600 mt-2">Curated resources, right here.</p>
        </div>
        <Link to="/recommendations" className="btn-outline">Back</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noreferrer" className="card hover:shadow-md transition">
            <div className="text-sm uppercase text-gray-500">{r.type}</div>
            <div className="text-lg font-semibold">{r.title}</div>
          </a>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Structured Learning Path</h2>
        <p className="text-gray-600">Add any recommendation to your Roadmap to track progress step-by-step.</p>
        <Link to="/roadmap" className="btn mt-3">Open Roadmap</Link>
      </div>
    </div>
  )
}

export default LearningPage

