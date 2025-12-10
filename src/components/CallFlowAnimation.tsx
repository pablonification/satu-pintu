'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export function CallFlowAnimation() {
  const [activeCall, setActiveCall] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'incoming' | 'processing' | 'dispatching'>('idle')
  
  // Lock dispatch target to prevent glitch when activeCall changes
  const [dispatchTarget, setDispatchTarget] = useState(1)
  const [dispatchColor, setDispatchColor] = useState('#f97316')

  const scenarios = useMemo(() => [
    { id: 0, issue: 'Kebakaran', color: '#f97316', targetIndex: 1 },
    { id: 1, issue: 'Kecelakaan', color: '#ef4444', targetIndex: 0 },
    { id: 2, issue: 'Kriminalitas', color: '#3b82f6', targetIndex: 2 },
  ], [])

  const agencies = useMemo(() => [
    { id: 'ambulans', label: 'Ambulans', color: '#ef4444', icon: 'ambulance' },
    { id: 'damkar', label: 'Damkar', color: '#f97316', icon: 'fire' },
    { id: 'polisi', label: 'Polisi', color: '#3b82f6', icon: 'shield' },
  ], [])

  // Animation cycle
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = []
    
    const runCycle = () => {
      const currentScenario = scenarios[activeCall]
      
      // Clear and start fresh
      setPhase('idle')
      
      timeoutIds.push(setTimeout(() => setPhase('incoming'), 100))
      timeoutIds.push(setTimeout(() => setPhase('processing'), 1400))
      timeoutIds.push(setTimeout(() => {
        // Lock target BEFORE setting phase to dispatching
        setDispatchTarget(currentScenario.targetIndex)
        setDispatchColor(currentScenario.color)
        setPhase('dispatching')
      }, 2800))
      timeoutIds.push(setTimeout(() => setPhase('idle'), 4800))
      timeoutIds.push(setTimeout(() => setActiveCall((prev) => (prev + 1) % 3), 5300))
    }

    runCycle()
    const intervalId = setInterval(runCycle, 5400)
    
    return () => {
      clearInterval(intervalId)
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [activeCall, scenarios])

  const currentScenario = scenarios[activeCall]

  // Positions
  const callerPos = { x: 100, y: 150 }
  const hubPos = { x: 400, y: 150 }
  const agencyPositions = [
    { x: 700, y: 50 },   // Ambulans
    { x: 700, y: 150 },  // Damkar (straight line)
    { x: 700, y: 250 },  // Polisi
  ]

  // Line coordinates
  const callerLineStart = { x: callerPos.x + 35, y: callerPos.y }
  const callerLineEnd = { x: hubPos.x - 45, y: hubPos.y }
  
  // Get line end points for agency lines
  const getAgencyLinePoints = (targetIndex: number) => {
    const targetPos = agencyPositions[targetIndex]
    return {
      x1: hubPos.x + 45,
      y1: hubPos.y,
      x2: targetPos.x - 35,
      y2: targetPos.y
    }
  }

  const showCallerToHub = phase === 'incoming' || phase === 'processing' || phase === 'dispatching'
  const showHubToAgency = phase === 'dispatching'

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Ambient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] transition-colors duration-1000"
        style={{ backgroundColor: `${currentScenario.color}10` }}
      />
      
      <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* ============ BASE LINES ============ */}
        <line 
          x1={callerLineStart.x} y1={callerLineStart.y} 
          x2={callerLineEnd.x} y2={callerLineEnd.y} 
          stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="6 6" 
        />
        {agencyPositions.map((_, index) => {
          const pts = getAgencyLinePoints(index)
          return (
            <line 
              key={`base-${index}`} 
              x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
              stroke="rgba(255,255,255,0.05)" strokeWidth="2" 
            />
          )
        })}

        {/* ============ CALLER → HUB ANIMATION ============ */}
        {showCallerToHub && (
          <g key={`caller-hub-${activeCall}`}>
            {/* Moving dot */}
            {phase === 'incoming' && (
              <motion.circle
                r="6"
                fill={currentScenario.color}
                filter="url(#dotGlow)"
                initial={{ cx: callerLineStart.x, cy: callerLineStart.y, opacity: 0 }}
                animate={{ cx: callerLineEnd.x, cy: callerLineEnd.y, opacity: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}
          </g>
        )}

        {/* ============ HUB → AGENCY ANIMATION ============ */}
        {showHubToAgency && (() => {
          const pts = getAgencyLinePoints(dispatchTarget)
          return (
            <g key={`hub-agency-${activeCall}-${dispatchTarget}`}>
              {/* Moving dot */}
              <motion.circle
                r="7"
                fill={dispatchColor}
                filter="url(#dotGlow)"
                initial={{ cx: pts.x1, cy: pts.y1, opacity: 0 }}
                animate={{ cx: pts.x2, cy: pts.y2, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </g>
          )
        })()}

        {/* ============ CALLER NODE ============ */}
        <g>
          {phase === 'incoming' && (
            <motion.circle
              cx={callerPos.x} cy={callerPos.y} r="35"
              fill="none" stroke={currentScenario.color} strokeWidth="1.5"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          
          <motion.circle
            cx={callerPos.x} cy={callerPos.y} r="35"
            fill="rgba(0,0,0,0.5)"
            stroke={currentScenario.color}
            strokeWidth="2"
            animate={{ strokeOpacity: phase === 'incoming' ? 1 : 0.4 }}
          />
          
          <circle cx={callerPos.x} cy={callerPos.y} r="20" fill={`${currentScenario.color}20`} />

          {/* Phone icon */}
          <g transform={`translate(${callerPos.x - 12}, ${callerPos.y - 12})`}>
            <motion.path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              fill="none" stroke={currentScenario.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              animate={{ scale: phase === 'incoming' ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.4, repeat: phase === 'incoming' ? Infinity : 0 }}
            />
          </g>
          
          <text x={callerPos.x} y={callerPos.y + 55} textAnchor="middle" fill="white" fontSize="12" fontWeight="500" fontFamily="system-ui">
            Incoming Call
          </text>
          <motion.text 
            key={`issue-${activeCall}`}
            x={callerPos.x} y={callerPos.y + 70} 
            textAnchor="middle" fill={currentScenario.color} fontSize="11" fontWeight="600" fontFamily="system-ui"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            &quot;{currentScenario.issue}&quot;
          </motion.text>
        </g>

        {/* ============ HUB NODE ============ */}
        <g>
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${hubPos.x}px ${hubPos.y}px` }}
          >
            <circle cx={hubPos.x} cy={hubPos.y} r="55" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" strokeDasharray="4 8" />
          </motion.g>

          {phase === 'processing' && (
            <motion.circle
              cx={hubPos.x} cy={hubPos.y} r="45"
              fill="rgba(99, 102, 241, 0.2)"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          
          <circle cx={hubPos.x} cy={hubPos.y} r="45" fill="url(#hubGradient)" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="2" />
          <circle cx={hubPos.x} cy={hubPos.y} r="25" fill="rgba(99, 102, 241, 0.1)" />

          <g transform={`translate(${hubPos.x - 12}, ${hubPos.y - 14})`}>
            <motion.path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill={phase === 'processing' ? '#a5b4fc' : 'none'}
              stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              animate={{ fillOpacity: phase === 'processing' ? [0.2, 0.6, 0.2] : 0 }}
              transition={{ duration: 0.6, repeat: phase === 'processing' ? Infinity : 0 }}
            />
          </g>
          
          <text x={hubPos.x} y={hubPos.y + 65} textAnchor="middle" fill="white" fontSize="14" fontWeight="600" fontFamily="system-ui">
            SatuPintu
          </text>
          <text x={hubPos.x} y={hubPos.y + 80} textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="500" fontFamily="system-ui">
            {phase === 'processing' ? 'ANALYZING...' : 'AI ROUTING'}
          </text>
        </g>

        {/* ============ AGENCY NODES ============ */}
        {agencies.map((agency, index) => {
          const pos = agencyPositions[index]
          const isActive = phase === 'dispatching' && dispatchTarget === index
          
          return (
            <g key={agency.id}>
              {isActive && (
                <motion.circle
                  cx={pos.x} cy={pos.y} r="30"
                  fill="none" stroke={agency.color} strokeWidth="2"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              
              <motion.circle
                cx={pos.x} cy={pos.y} r="30"
                fill={isActive ? `${agency.color}15` : 'rgba(0,0,0,0.4)'}
                stroke={isActive ? agency.color : 'rgba(255,255,255,0.15)'}
                strokeWidth={isActive ? 2 : 1}
                animate={{ filter: isActive ? 'url(#glow)' : 'none' }}
              />

              <circle cx={pos.x} cy={pos.y} r="15" fill={isActive ? `${agency.color}30` : 'rgba(255,255,255,0.05)'} />

              <g transform={`translate(${pos.x - 10}, ${pos.y - 10})`}>
                {agency.icon === 'ambulance' && (
                  <path d="M3 3h12v14H3zM10 3v14M3 10h7M15 8h4l2 4v5h-3M18 17a2 2 0 100-4 2 2 0 000 4zM7 17a2 2 0 100-4 2 2 0 000 4z" fill="none" stroke={isActive ? agency.color : 'rgba(255,255,255,0.4)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.9)" />
                )}
                {agency.icon === 'fire' && (
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="none" stroke={isActive ? agency.color : 'rgba(255,255,255,0.4)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.85) translate(1, 1)" />
                )}
                {agency.icon === 'shield' && (
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01" fill="none" stroke={isActive ? agency.color : 'rgba(255,255,255,0.4)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.8) translate(2, 2)" />
                )}
              </g>

              <text x={pos.x} y={pos.y + 48} textAnchor="middle" fill={isActive ? agency.color : 'rgba(255,255,255,0.5)'} fontSize="11" fontWeight={isActive ? '600' : '400'} fontFamily="system-ui">
                {agency.label}
              </text>

              {/* SENT Badge */}
              {isActive && (
                <motion.g
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <rect
                    x={pos.x + 38}
                    y={pos.y - 7}
                    width="36"
                    height="14"
                    rx="3"
                    fill="#22c55e20"
                    stroke="#22c55e"
                    strokeWidth="1"
                  />
                  <text
                    x={pos.x + 56}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fill="#22c55e"
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="system-ui"
                  >
                    SENT
                  </text>
                </motion.g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Status indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {[
          { key: 'incoming', label: 'Call' },
          { key: 'processing', label: 'AI' },
          { key: 'dispatching', label: 'Route' }
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: phase === item.key ? currentScenario.color : 'rgba(255,255,255,0.2)',
                scale: phase === item.key ? 1.3 : 1,
              }}
            />
            <span 
              className="text-[10px] font-medium"
              style={{ color: phase === item.key ? currentScenario.color : 'rgba(255,255,255,0.3)' }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
