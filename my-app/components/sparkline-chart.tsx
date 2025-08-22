"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineChartProps {
  data: number[]
  color?: string
  className?: string
}

export function SparklineChart({ data, color = "#10b981", className }: SparklineChartProps) {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }))

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} activeDot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
