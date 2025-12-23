'use client'
import { useRef, useState, useEffect } from 'react'

export default function LazyVideo({ src, poster, className, ...props }) {
    const containerRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '200px' }
        )
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className={className}>
            {isVisible ? (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={poster}
                    className="w-full h-full object-cover"
                    onLoadedData={() => setHasLoaded(true)}
                    {...props}
                >
                    <source src={src} type="video/webm" />
                </video>
            ) : (
                poster && (
                    <img
                        src={poster}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                )
            )}
        </div>
    )
}
