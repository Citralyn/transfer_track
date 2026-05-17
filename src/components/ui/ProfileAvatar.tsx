import { clsx } from 'clsx'
import { useState } from 'react'

type ProfileLike = {
  full_name?: string | null
  name?: string | null
  avatar_url?: string | null
}

export function ProfileAvatar({
  profile,
  name,
  className,
  imageClassName,
  fallbackClassName,
}: {
  profile?: ProfileLike | null
  name?: string | null
  className?: string
  imageClassName?: string
  fallbackClassName?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const displayName = profile?.full_name || profile?.name || name || ''
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'
  const avatarUrl = profile?.avatar_url && failedUrl !== profile.avatar_url ? profile.avatar_url : null

  return (
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden rounded-full',
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setFailedUrl(avatarUrl)}
          className={clsx('w-full h-full object-cover', imageClassName)}
        />
      ) : (
        <span className={fallbackClassName}>{initial}</span>
      )}
    </div>
  )
}
