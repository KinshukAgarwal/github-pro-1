import { useLocation } from 'react-router-dom'

const embeds: Record<string, string> = {
  React: 'https://react.dev/learn',
  TypeScript: 'https://www.typescriptlang.org/docs/handbook/intro.html',
}

const LearnEmbedPage = () => {
  const topic = new URLSearchParams(useLocation().search).get('topic') || 'React'
  const url = embeds[topic] || 'https://developer.mozilla.org/'
  return (
    <div className="w-full h-[80vh]">
      <iframe title={`Learn ${topic}`} src={url} className="w-full h-full rounded" />
    </div>
  )
}

export default LearnEmbedPage

