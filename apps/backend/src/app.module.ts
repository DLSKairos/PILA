import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './modules/health/health.module'
import { AuthModule } from './modules/auth/auth.module'
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module'
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module'
import { TrainersModule } from './modules/trainers/trainers.module'
import { ClientsModule } from './modules/clients/clients.module'
import { OnboardingModule } from './modules/onboarding/onboarding.module'
import { AIModule } from './modules/ai/ai.module'
import { NutritionModule } from './modules/nutrition/nutrition.module'
import { WorkoutModule } from './modules/workout/workout.module'
import { TrackingModule } from './modules/tracking/tracking.module'
import { GeolocationModule } from './modules/geolocation/geolocation.module'
import { ProgressModule } from './modules/progress/progress.module'
import { FeedbackModule } from './modules/feedback/feedback.module'
import { EmailModule } from './modules/email/email.module'
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ReportsModule } from './modules/reports/reports.module'
import { ChatModule } from './modules/chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    CloudinaryModule,
    HealthModule,
    AuthModule,
    SubscriptionsModule,
    FeatureFlagsModule,
    TrainersModule,
    ClientsModule,
    OnboardingModule,
    AIModule,
    NutritionModule,
    WorkoutModule,
    TrackingModule,
    GeolocationModule,
    ProgressModule,
    FeedbackModule,
    NotificationsModule,
    ReportsModule,
    ChatModule,
  ],
})
export class AppModule {}
