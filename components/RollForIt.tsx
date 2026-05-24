'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Choice {
  id: string
  text: string
}

type Phase = 'idle' | 'rolling' | 'result'

// ─── Die Face SVG ─────────────────────────────────────────────────────────────
function DieFace({ value, sides, rolling }: { value: number; sides: number; rolling: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center select-none
        ${rolling ? 'die-rolling' : ''}`}
      style={{ width: 96, height: 96 }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.35), rgba(232,98,42,0.2))',
          boxShadow: rolling
            ? '0 0 40px rgba(245,200,66,0.6), 0 0 80px rgba(245,200,66,0.2)'
            : '0 0 20px rgba(245,200,66,0.25)',
          transition: 'box-shadow 0.3s ease',
        }}
      />
      {/* Die body */}
      <div
        className="absolute inset-[3px] rounded-xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #2a2f47, #1a1d27)',
          border: '1px solid rgba(245,200,66,0.4)',
        }}
      >
        {/* Sides label */}
        <span
          className="absolute top-1.5 left-0 right-0 text-center font-display"
          style={{ fontSize: 9, color: 'rgba(245,200,66,0.5)', letterSpacing: '0.05em' }}
        >
          d{sides}
        </span>
        {/* Value */}
        <span
          key={rolling ? 'rolling' : value}
          className={`font-display ${rolling ? 'roll-number-tick' : ''}`}
          style={{
            fontSize: value > 99 ? 20 : value > 9 ? 28 : 36,
            color: '#f5c842',
            textShadow: '0 0 12px rgba(245,200,66,0.6)',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      </div>
      {/* Corner pips */}
      {[
        'top-2 left-2', 'top-2 right-2',
        'bottom-2 left-2', 'bottom-2 right-2',
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-1 h-1 rounded-full`}
          style={{ background: 'rgba(245,200,66,0.25)' }}
        />
      ))}
    </div>
  )
}

// ─── Choice Pill ──────────────────────────────────────────────────────────────
function ChoicePill({
  choice,
  index,
  onRemove,
  isWinner,
}: {
  choice: Choice
  index: number
  onRemove: (id: string) => void
  isWinner: boolean
}) {
  return (
    <div
      className={`choice-item flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl
        transition-all duration-300
        ${isWinner
          ? 'result-glow'
          : 'hover:border-[rgba(245,200,66,0.3)]'
        }`}
      style={{
        background: isWinner
          ? 'linear-gradient(135deg, rgba(245,200,66,0.15), rgba(232,98,42,0.1))'
          : 'rgba(255,255,255,0.04)',
        border: isWinner
          ? '1px solid rgba(245,200,66,0.5)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="text-xs font-semibold shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(245,200,66,0.12)',
            color: 'rgba(245,200,66,0.7)',
            fontSize: 10,
          }}
        >
          {index + 1}
        </span>
        <span
          className="text-sm font-medium truncate"
          style={{ color: isWinner ? '#f5c842' : '#e8e4d9' }}
        >
          {choice.text}
        </span>
        {isWinner && (
          <span style={{ fontSize: 14 }}>🎯</span>
        )}
      </div>
      <button
        onClick={() => onRemove(choice.id)}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center
          transition-all duration-150 hover:scale-110"
        style={{
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--muted)',
        }}
        aria-label={`Remove ${choice.text}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RollForIt() {
  const [choices, setChoices] = useState<Choice[]>([])
  const [inputValue, setInputValue] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [dieDisplay, setDieDisplay] = useState(1)
  const [winner, setWinner] = useState<Choice | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canRoll = choices.length >= 2

  const addChoice = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    setChoices(prev => [...prev, { id: crypto.randomUUID(), text }])
    setInputValue('')
    addInputRef.current?.focus()
  }, [inputValue])

  const removeChoice = useCallback((id: string) => {
    setChoices(prev => prev.filter(c => c.id !== id))
    if (winner?.id === id) setWinner(null)
  }, [winner])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addChoice()
  }

  const roll = useCallback(() => {
    if (!canRoll || phase === 'rolling') return

    setPhase('rolling')
    setWinner(null)

    const n = choices.length
    let ticks = 0
    const totalTicks = 20

    if (tickerRef.current) clearInterval(tickerRef.current)

    tickerRef.current = setInterval(() => {
      setDieDisplay(Math.floor(Math.random() * n) + 1)
      ticks++
      if (ticks >= totalTicks) {
        clearInterval(tickerRef.current!)
        const picked = choices[Math.floor(Math.random() * n)]
        setDieDisplay(choices.indexOf(picked) + 1)
        setWinner(picked)
        setPhase('result')
      }
    }, 60)
  }, [canRoll, choices, phase])

  const rollAgain = useCallback(() => {
    setPhase('idle')
    setWinner(null)
    setDieDisplay(1)
    setTimeout(roll, 50)
  }, [roll])

  // Cleanup on unmount
  useEffect(() => () => { if (tickerRef.current) clearInterval(tickerRef.current) }, [])

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-start py-12 px-4 z-10">

      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,200,66,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="text-center pt-2 pb-1">
          <h1
            className="font-display shimmer-text"
            style={{ fontSize: 'clamp(1.6rem, 7vw, 2.6rem)', letterSpacing: '-0.01em', lineHeight: 1.2 }}
          >
            Roll For It
          </h1>
          <p className="mt-1 text-xs tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
            Let the dice decide
          </p>
        </div>

        {/* ── Choices card ── */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Choices
            </label>
            {choices.length > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,200,66,0.12)', color: 'rgba(245,200,66,0.8)' }}
              >
                {choices.length}
              </span>
            )}
          </div>

          {/* Add input */}
          <div className="flex gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a choice..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all duration-200
                placeholder:text-gray-600"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,200,66,0.45)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            <button
              onClick={addChoice}
              disabled={!inputValue.trim()}
              className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: inputValue.trim()
                  ? 'linear-gradient(135deg, #f5c842, #c99b1a)'
                  : 'var(--surface-2)',
                color: inputValue.trim() ? '#0f1117' : 'var(--muted)',
                border: '1px solid transparent',
              }}
            >
              Add
            </button>
          </div>

          {/* Choice list */}
          {choices.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
              {choices.map((c, i) => (
                <ChoicePill
                  key={c.id}
                  choice={c}
                  index={i}
                  onRemove={removeChoice}
                  isWinner={winner?.id === c.id}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl py-6 text-center text-sm"
              style={{ color: 'var(--muted)', border: '1px dashed var(--border)' }}
            >
              Add at least 2 choices to roll
            </div>
          )}
        </div>

        {/* ── Die + Roll button ── */}
        <div className="flex flex-col items-center gap-5">

          {/* Die */}
          {(phase !== 'idle' || choices.length >= 2) && (
            <DieFace
              value={phase === 'idle' ? choices.length : dieDisplay}
              sides={choices.length}
              rolling={phase === 'rolling'}
            />
          )}

          {phase !== 'result' ? (
            <button
              onClick={roll}
              disabled={!canRoll || phase === 'rolling'}
              className="w-full py-4 rounded-2xl text-base font-display tracking-wide
                transition-all duration-200 active:scale-[0.97]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              style={{
                background: canRoll
                  ? 'linear-gradient(135deg, #f5c842 0%, #e8622a 100%)'
                  : 'var(--surface-2)',
                color: canRoll ? '#0f1117' : 'var(--muted)',
                border: '1px solid transparent',
                boxShadow: canRoll
                  ? '0 4px 24px rgba(245,200,66,0.3), 0 1px 0 rgba(255,255,255,0.1) inset'
                  : 'none',
                fontSize: '1rem',
                letterSpacing: '0.05em',
              }}
            >
              {phase === 'rolling'
                ? 'Rolling...'
                : canRoll
                  ? `ROLL D${choices.length}`
                  : 'Add choices to roll'}
            </button>
          ) : null}
        </div>

        {/* ── Result card ── */}
        {phase === 'result' && winner && (
          <div
            className="result-reveal rounded-2xl p-6 text-center flex flex-col gap-3 result-glow"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.1), rgba(232,98,42,0.06))',
              border: '1px solid rgba(245,200,66,0.35)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <span style={{ fontSize: 28 }}>🎲</span>
              <span
                className="font-display"
                style={{
                  fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
                  color: '#f5c842',
                  textShadow: '0 0 20px rgba(245,200,66,0.4)',
                  wordBreak: 'break-word',
                }}
              >
                {winner.text}
              </span>
            </div>
            <p className="text-xs italic" style={{ color: 'var(--muted)' }}>
              The die has spoken.
            </p>

            <button
              onClick={rollAgain}
              className="mt-2 w-full py-3.5 rounded-xl text-sm font-display tracking-wide
                transition-all duration-150 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #f5c842 0%, #e8622a 100%)',
                color: '#0f1117',
                boxShadow: '0 4px 20px rgba(245,200,66,0.25)',
                letterSpacing: '0.05em',
              }}
            >
              ROLL AGAIN
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-xs pb-4" style={{ color: 'rgba(122,126,150,0.5)' }}>
          ⚔️ May fortune favor your choice
        </p>
      </div>
    </div>
  )
}