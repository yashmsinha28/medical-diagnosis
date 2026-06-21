'use client'

import React from 'react'

interface CountUpNumberProps {
  end: number
  duration: number
  suffix?: string
  prefix?: string
  decimals?: number
}

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  duration,
  suffix = '',
  prefix = '',
  decimals = 0,
}) => {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let start = 0
    const increment = end / (duration * 60)
    const interval = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(interval)
      } else {
        setCount(Math.floor(start * Math.pow(10, decimals)) / Math.pow(10, decimals))
      }
    }, 1000 / 60)
    return () => clearInterval(interval)
  }, [end, duration, decimals])

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export default CountUpNumber
