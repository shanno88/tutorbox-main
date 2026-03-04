import { User } from '@prisma/client'

export function hasProAccess(user: User, trialDays: number): boolean {
  const now = new Date()

  // Paid users always allowed
  if (user.plan === 'PRO') return true

  // No trial info
  if (!user.trialStartedAt) return false

  const diffMs = now.getTime() - user.trialStartedAt.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Still within trial window
  if (user.plan === 'TRIAL' && diffDays < trialDays) {
    return true
  }

  return false
}
