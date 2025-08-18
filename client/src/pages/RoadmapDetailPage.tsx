import { useParams } from 'react-router-dom'
import { useRoadmap, useUpdateRoadmapItem, useRemoveRoadmapItem } from '@/hooks/useApi'


const RoadmapDetailPage = () => {
  const { id } = useParams()
  const { data } = useRoadmap()
  const updateItem = useUpdateRoadmapItem()
  const removeItem = useRemoveRoadmapItem()

  const item = ((data?.data as any[]) || []).find(i => i.id === id)
  if (!item) return <div className="p-4">Item not found.</div>

  const path = Array.isArray(item?.meta?.learning_path) ? item.meta.learning_path : []
  const done = new Set<string>(Array.isArray(item?.progress?.completedSteps) ? item.progress.completedSteps : [])

  const toggleStep = async (title: string) => {
    const steps = Array.from(done)
    const idx = steps.indexOf(title)
    if (idx >= 0) steps.splice(idx, 1); else steps.push(title)

    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: { progress: { completedSteps: steps } }
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const markStatus = async (status: 'active' | 'in-progress' | 'completed') => {
    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        updates: { status }
      })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRemove = async () => {
    try {
      await removeItem.mutateAsync(item.id)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-gray-600">Type: {item.type}</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" onClick={() => markStatus('in-progress')}>Mark In Progress</button>
          <button className="btn-outline" onClick={() => markStatus('completed')}>Mark Complete</button>
          <button className="btn-outline" onClick={handleRemove}>Remove</button>
        </div>
      </div>

      {path.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Learning Path</h2>
          <ol className="space-y-2">
            {path.map((s: any, idx: number) => (
              <li key={idx} className="flex items-start space-x-3">
                <input type="checkbox" className="mt-1" checked={done.has(s.title)} onChange={() => toggleStep(s.title)} />
                <div>
                  <div className="font-medium">{s.title}</div>
                  {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export default RoadmapDetailPage
