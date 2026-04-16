import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'

export interface GoogleProfile {
  googleId: string
  email: string
  name: string
  photoUrl?: string
}

@Injectable()
export class GoogleTrainerStrategy extends PassportStrategy(Strategy, 'google-trainer') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: `${config.get('BACKEND_URL') ?? 'http://localhost:3001'}/api/v1/auth/google/trainer/callback`,
      scope: ['profile', 'email'],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value
    if (!email) return done(new Error('No email from Google'), false)

    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName ?? `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim(),
      photoUrl: profile.photos?.[0]?.value,
    }
    done(null, googleProfile)
  }
}
