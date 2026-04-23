// ── components/dashboard/shared/EmptyState.tsx ──
// Standard empty state component for when API returns no data

interface EmptyStateProps {
  icon:         string   // emoji
  title:        string
  message?:     string
  description?: string   // alias for message
  action?:      { label: string; href: string }
  actionLabel?: string   // alternative action format
  onAction?:    () => void
}

export default function EmptyState({ 
  icon, 
  title, 
  message, 
  description, 
  action, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  const displayMessage = message || description
  const displayAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null)

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold font-display text-navy mb-2">{title}</h3>
      {displayMessage && <p className="text-sm text-muted max-w-sm mb-6">{displayMessage}</p>}
      {displayAction && (
        'href' in displayAction ? (
          <a
            href={displayAction.href}
            className="rounded-xl bg-blue text-white px-6 py-3 text-sm font-medium
                       hover:bg-blue-700 transition-colors duration-200 min-h-[44px]
                       inline-flex items-center"
          >
            {displayAction.label}
          </a>
        ) : (
          <button
            onClick={displayAction.onClick}
            className="rounded-xl bg-blue text-white px-6 py-3 text-sm font-medium
                       hover:bg-blue-700 transition-colors duration-200 min-h-[44px]
                       inline-flex items-center"
          >
            {displayAction.label}
          </button>
        )
      )}
    </div>
  )
}
