import { cn } from "@/lib/utils"

interface PitangLogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function PitangLogo({ className, showText = true, size = "md" }: PitangLogoProps) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg" },
    md: { icon: "h-9 w-9", text: "text-xl" },
    lg: { icon: "h-14 w-14", text: "text-3xl" },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", sizes[size].icon)}>
        <svg viewBox="0 0 128 112" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            fill="#ef1d1d"
            d="M63.4 27.1c9.7-7.5 25.5-8.7 38.5.2 18.7 12.9 26.1 39.2 17.7 61.5-6.1 16.2-19.2 23.2-35 19.3-7.6-1.9-14.2-5.6-20.8-9.5-8-4.7-16.6-5.1-25.1-1.1-9 4.3-18 7-27.8 4.2C.7 98.8-4.3 89.7-2.8 77.5.6 50.4 21.6 27 47.8 20.8c6.6-1.6 10.5 4.9 15.6 6.3Z"
            transform="translate(7 2) scale(.92)"
          />
          <path
            fill="white"
            d="M48 30.6C29.8 36.1 14.7 52.5 10.7 70.5c-2.3 10.3 1 17.4 9 19.5 9.1 2.4 17.9-1.3 26.2-5.2 3.1-1.5 6.4-2.6 9.7-3.1-13.8-10.1-19.9-22.6-17.2-35.9 1.3-6.3 4.5-11.3 9.6-15.2Z"
            opacity="0.95"
            transform="translate(7 2) scale(.92)"
          />
          <path
            fill="white"
            d="M65.9 28c-2 13.5 5 23.8 16.1 31.2 7.6 5 16.1 8.7 22.6 15.4 6.4 6.6 7.7 14.2 4 20.8-3.7 6.6-10.5 8.6-19.3 6.2-5.5-1.5-10.5-4-15.6-6.7 4.2-11.5.1-21.4-8.7-30.5C54.8 53.6 53.5 42.2 65.9 28Z"
            opacity="0.95"
            transform="translate(7 2) scale(.92)"
          />
        </svg>
      </div>
      {showText && <span className={cn("font-bold text-foreground", sizes[size].text)}>Pitang</span>}
    </div>
  )
}
