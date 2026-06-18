import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { StoreTypeBreakdown } from '@/types/models'

const COLORS: Record<string, string> = { product: '#155eef', service: '#7f56d9' }

export function StoreTypeChart({ data }: { data: StoreTypeBreakdown[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.type} fill={COLORS[entry.type]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name) => [`${v} stores`, String(name)]}
            contentStyle={{ borderRadius: 8, border: '1px solid #eaecf0', fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex w-full justify-center gap-6">
        {data.map((entry) => (
          <div key={entry.type} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.type] }} />
            <span className="text-sm capitalize text-ink-700">{entry.type}</span>
            <span className="text-sm font-semibold text-ink-900">
              {total ? Math.round((entry.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
