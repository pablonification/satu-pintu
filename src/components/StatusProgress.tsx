'use client'

import { CheckCircle, Circle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CANCELLED'

interface StatusProgressProps {
  status: TicketStatus
}

export function StatusProgress({ status }: StatusProgressProps) {
  const isCancelled = status === 'CANCELLED'
  
  const steps = [
    { id: 'received', label: 'Diterima', completed: true }, // Always completed if ticket exists
    { 
      id: 'process', 
      label: 'Diproses', 
      completed: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED'].includes(status) 
    },
    { 
      id: 'done', 
      label: 'Selesai', 
      completed: status === 'RESOLVED' 
    },
  ]

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting Lines */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 -z-10" />
        
        {/* Progress Line (Colored) */}
        {!isCancelled && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500/50 -z-10 transition-all duration-500"
            style={{
              width: status === 'RESOLVED' ? '100%' : 
                     ['IN_PROGRESS', 'ESCALATED'].includes(status) ? '50%' : '0%'
            }}
          />
        )}

        {steps.map((step, index) => {
          const isCompleted = step.completed
          const isCurrent = !isCompleted && (
            (index > 0 && steps[index-1].completed) || index === 0
          ) && !isCancelled

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                  isCancelled ? "border-gray-500 text-gray-500" :
                  isCompleted ? "border-emerald-500 bg-emerald-500 text-black" :
                  isCurrent ? "border-blue-500 bg-background text-blue-500 animate-pulse" :
                  "border-white/20 bg-background text-white/20"
                )}
              >
                {isCancelled && index === 2 ? (
                  <XCircle className="h-5 w-5" />
                ) : isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-4 w-4 fill-current" />
                )}
              </motion.div>
              <span className={cn(
                "text-xs font-medium",
                isCancelled ? "text-gray-500" :
                isCompleted ? "text-emerald-500" :
                isCurrent ? "text-blue-500" :
                "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
      
      {isCancelled && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-400 bg-gray-500/10 px-3 py-1 rounded-full border border-gray-500/20">
            Laporan Dibatalkan
          </span>
        </div>
      )}
    </div>
  )
}
