import { createHash } from 'crypto'

export function hashClientProfile(profile: object): string {
  return createHash('sha256')
    .update(JSON.stringify(profile))
    .digest('hex')
    .substring(0, 16)
}
