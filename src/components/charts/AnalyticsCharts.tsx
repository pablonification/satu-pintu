'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// Colors matching the app theme
const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', // red-500
  HIGH: '#f97316',     // orange-500
  MEDIUM: '#eab308',   // yellow-500
  LOW: '#22c55e',      // green-500
}

const CATEGORY_COLORS: Record<string, string> = {
  DARURAT: '#ef4444',    // red-500
  INFRA: '#3b82f6',      // blue-500
  KEBERSIHAN: '#22c55e', // green-500
  SOSIAL: '#a855f7',     // purple-500
  LAINNYA: '#6b7280',    // gray-500
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#eab308',     // yellow-500
  IN_PROGRESS: '#3b82f6', // blue-500
  ESCALATED: '#f97316',   // orange-500
  RESOLVED: '#22c55e',    // green-500
  CANCELLED: '#6b7280',   // gray-500
}

// Labels in Indonesian
const URGENCY_LABELS: Record<string, string> = {
  CRITICAL: 'Kritis',
  HIGH: 'Tinggi',
  MEDIUM: 'Sedang',
  LOW: 'Rendah',
}

const CATEGORY_LABELS: Record<string, string> = {
  DARURAT: 'Darurat',
  INFRA: 'Infrastruktur',
  KEBERSIHAN: 'Kebersihan',
  SOSIAL: 'Sosial',
  LAINNYA: 'Lainnya',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Diproses',
  ESCALATED: 'Dieskalasi',
  RESOLVED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

interface DailyData {
  date: string
  count: number
}

interface PieData {
  name: string
  value: number
}

interface ResolutionData {
  category: string
  avgHours: number
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-white/10 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm text-white">{label}</p>
        <p className="text-sm font-bold text-white">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

// Pie label render function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = (props: any) => {
  const { name, percent } = props
  return `${name} (${(percent * 100).toFixed(0)}%)`
}

// Daily Tickets Line Chart
export function DailyTicketsChart({ data }: { data: DailyData[] }) {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'dd MMM', { locale: idLocale }),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis 
          dataKey="formattedDate" 
          stroke="#6b7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Category Pie Chart
export function CategoryPieChart({ data }: { data: PieData[] }) {
  const formattedData = data.map(item => ({
    ...item,
    name: CATEGORY_LABELS[item.name] || item.name,
    originalName: item.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={renderPieLabel}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={CATEGORY_COLORS[entry.originalName] || '#6b7280'} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend 
          formatter={(value) => <span className="text-white text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Urgency Pie Chart
export function UrgencyPieChart({ data }: { data: PieData[] }) {
  const formattedData = data.map(item => ({
    ...item,
    name: URGENCY_LABELS[item.name] || item.name,
    originalName: item.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={renderPieLabel}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={URGENCY_COLORS[entry.originalName] || '#6b7280'} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend 
          formatter={(value) => <span className="text-white text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Status Pie Chart
export function StatusPieChart({ data }: { data: PieData[] }) {
  const formattedData = data.map(item => ({
    ...item,
    name: STATUS_LABELS[item.name] || item.name,
    originalName: item.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={renderPieLabel}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={STATUS_COLORS[entry.originalName] || '#6b7280'} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend 
          formatter={(value) => <span className="text-white text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Resolution Time Bar Chart
export function ResolutionTimeChart({ data }: { data: ResolutionData[] }) {
  const formattedData = data.map(item => ({
    ...item,
    label: CATEGORY_LABELS[item.category] || item.category,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <XAxis 
          dataKey="label" 
          stroke="#6b7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Jam', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value} jam`, 'Rata-rata']}
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Bar 
          dataKey="avgHours" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
        >
          {formattedData.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={CATEGORY_COLORS[data[index].category] || '#3b82f6'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
