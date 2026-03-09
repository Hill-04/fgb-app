"use client"

import { cn } from "@/lib/utils"

const CATEGORIES = [
  "Sub 12",
  "Sub 13",
  "Sub 14",
  "Sub 15",
  "Sub 16",
  "Sub 17",
  "Sub 18",
  "Sub 19",
]

type CategorySelectorProps = {
  selected: string[]
  onChange: (categories: string[]) => void
  className?: string
}

export function CategorySelector({ selected, onChange, className }: CategorySelectorProps) {
  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category))
    } else {
      onChange([...selected, category])
    }
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
      {CATEGORIES.map((category) => {
        const isSelected = selected.includes(category)
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggleCategory(category)}
            className={cn(
              "px-4 py-3 rounded-lg border-2 font-semibold transition-all",
              isSelected
                ? "bg-[--orange]/20 border-[--orange] text-[--orange]"
                : "bg-[--bg-card] border-[--border-color] text-[--text-secondary] hover:border-[--border-hover]"
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
