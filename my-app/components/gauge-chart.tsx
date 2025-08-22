"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface GaugeChartProps {
  value: number
  max: number
  title: string
  color: string
  size?: number
}

export function GaugeChart({ value, max, title, color, size = 200 }: GaugeChartProps) {
  const percentage = (value / max) * 100
  const data = [
    { name: "value", value: percentage },
    { name: "remaining", value: 100 - percentage },
  ]

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size / 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="90%"
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    </div>
  )
}
