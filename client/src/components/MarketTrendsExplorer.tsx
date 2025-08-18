import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

import { Search, Loader2 } from 'lucide-react'
import { useMarketTrends } from '@/hooks/useApi'

const MarketTrendsExplorer = () => {
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('')
  const [months, setMonths] = useState(6)

  const { data, isLoading, isError } = useMarketTrends(tech, months)

  const onSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setTech(query.trim())
  }
  const chartLabels = Array.isArray(data?.data) ? data!.data.map((p:any)=>p.month) : []
  const chartValues = Array.isArray(data?.data) ? data!.data.map((p:any)=>p.value) : []

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: tech || 'Trend',
        data: chartValues,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.3,
        pointRadius: 2,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }


  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search any language/technology (e.g., Python, React, Go)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input w-32" value={months} onChange={(e) => setMonths(parseInt(e.target.value))}>
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : isError ? (
        <div className="text-red-600">Failed to load trends</div>
      ) : Array.isArray(data?.data) && data!.data.length ? (
        <div className="space-y-3">
          <div className="h-40">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data!.data.map((p: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-md bg-white">
                <div className="text-sm text-gray-600">{p.month}</div>
                <div className="text-xl font-semibold">{p.value}%</div>
              </div>
            ))}
          </div>
        </div>
      ) : tech ? (
        <div className="text-gray-500">No data for "{tech}"</div>
      ) : null}
    </div>
  )
}

export default MarketTrendsExplorer

