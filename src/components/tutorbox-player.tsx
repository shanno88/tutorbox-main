'use client'

import { useEffect, useRef } from 'react'
import Artplayer from 'artplayer'

type TutorboxPlayerProps = {
  url: string
  poster?: string
  autoPlay?: boolean
  controls?: boolean
  className?: string
}

export function TutorboxPlayer({
  url,
  poster,
  autoPlay = false,
  controls = true,
  className = '',
}: TutorboxPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const art = new Artplayer({
      container: containerRef.current,
      url,
      poster,
      autoplay: autoPlay,
      autoSize: true,
      autoMini: false,
      loop: false,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      hotkey: true,
      controls, // 这里只是为了语义，Artplayer 会自己渲染控制条
    })

    return () => {
      art.destroy(false)
    }
  }, [url, poster, autoPlay, controls])

  return (
    <div className={`w-full aspect-video ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
