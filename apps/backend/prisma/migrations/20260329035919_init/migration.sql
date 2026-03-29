-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAINER', 'CLIENT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClientGoal" AS ENUM ('LOSE_WEIGHT', 'GAIN_MUSCLE', 'DEFINE', 'ENDURANCE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('TRAINER', 'CLIENT');

-- CreateEnum
CREATE TYPE "AIInteractionType" AS ENUM ('NUTRITION_PLAN', 'WORKOUT_PLAN', 'MEAL_SUBSTITUTION', 'GYM_MOTIVATION', 'CHECKIN_MESSAGE', 'TRAINER_SUGGESTION', 'WEEKLY_REPORT', 'ONBOARDING', 'PLAN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEAL_REMINDER', 'WATER_REMINDER', 'GYM_PROXIMITY', 'STREAK_AT_RISK', 'WEEKLY_CHECKIN', 'TRAINER_MESSAGE', 'PLAN_UPDATED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('EXERCISE_TOO_HARD', 'EXERCISE_TOO_EASY', 'FOOD_DISLIKED', 'FOOD_UNAVAILABLE', 'SCHEDULE_CONFLICT', 'INJURY_CONCERN', 'GENERAL');

-- CreateTable
CREATE TABLE "trainers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "specialties" TEXT[],
    "preferredLanguage" TEXT NOT NULL DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_subscriptions" (
    "id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "trainer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_settings" (
    "id" TEXT NOT NULL,
    "defaultWaterGoal" INTEGER NOT NULL DEFAULT 8,
    "enableLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "enableWeeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "enableAISuggestions" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT,
    "brandColor" TEXT,
    "logoUrl" TEXT,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "trainer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "photoUrl" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "currentWeight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION,
    "goal" "ClientGoal" NOT NULL,
    "targetWeeks" INTEGER NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "hasGymAccess" BOOLEAN NOT NULL DEFAULT true,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 5,
    "dietaryStyle" TEXT,
    "tdee" DOUBLE PRECISION,
    "targetCalories" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetFat" DOUBLE PRECISION,
    "breakfastTime" TEXT,
    "morningSnackTime" TEXT,
    "lunchTime" TEXT,
    "afternoonSnackTime" TEXT,
    "dinnerTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_restrictions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "client_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_injuries" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "limitation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "client_injuries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profile_snapshots" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "targetCalories" DOUBLE PRECISION NOT NULL,
    "targetProtein" DOUBLE PRECISION NOT NULL,
    "targetCarbs" DOUBLE PRECISION NOT NULL,
    "targetFat" DOUBLE PRECISION NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_profile_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motivation_profiles" (
    "id" TEXT NOT NULL,
    "onboardingResponses" JSONB NOT NULL,
    "motivationType" TEXT,
    "mainObstacle" TEXT,
    "previousAttempts" TEXT,
    "trainerNotes" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "motivation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_messages" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "onboarding_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_gyms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 200,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_devices" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "failReason" TEXT,
    "payload" JSONB NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloudinary_assets" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER NOT NULL,
    "resourceType" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloudinary_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE,
    "endDate" DATE,
    "approvedAt" TIMESTAMP(3),
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "cacheValid" BOOLEAN NOT NULL DEFAULT false,
    "profileHashAtGeneration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "order" INTEGER NOT NULL,
    "foodName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "recipe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" TEXT NOT NULL,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE,
    "endDate" DATE,
    "approvedAt" TIMESTAMP(3),
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "cacheValid" BOOLEAN NOT NULL DEFAULT false,
    "profileHashAtGeneration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "planId" TEXT NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restSeconds" INTEGER,
    "weightSuggestion" DOUBLE PRECISION,
    "weeklyProgressionKg" DOUBLE PRECISION,
    "deloadWeek" INTEGER,
    "notes" TEXT,
    "assetId" TEXT,
    "dayId" TEXT NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "gymCheckinAt" TIMESTAMP(3),
    "gymCheckoutAt" TIMESTAMP(3),
    "sessionDuration" INTEGER,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "streakActive" BOOLEAN NOT NULL DEFAULT false,
    "nutritionDone" BOOLEAN NOT NULL DEFAULT false,
    "workoutDone" BOOLEAN NOT NULL DEFAULT false,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "gymId" TEXT,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "dailyLogId" TEXT NOT NULL,
    "mealItemId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_substitutions" (
    "id" TEXT NOT NULL,
    "originalFoodName" TEXT NOT NULL,
    "substituteFoodName" TEXT NOT NULL,
    "substituteQuantity" DOUBLE PRECISION NOT NULL,
    "substituteUnit" TEXT NOT NULL,
    "substituteCalories" DOUBLE PRECISION NOT NULL,
    "substituteProtein" DOUBLE PRECISION NOT NULL,
    "substituteCarbs" DOUBLE PRECISION NOT NULL,
    "substituteFat" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealLogId" TEXT NOT NULL,
    "originalMealItemId" TEXT NOT NULL,

    CONSTRAINT "meal_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "setsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repsCompleted" TEXT,
    "weightUsed" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "dailyLogId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyLogId" TEXT NOT NULL,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_checkins" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "weight_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "aiMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "frontAssetId" TEXT,
    "sideAssetId" TEXT,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_history" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "brokenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "streak_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_adherence" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "nutritionAdherence" DOUBLE PRECISION NOT NULL,
    "workoutAdherence" DOUBLE PRECISION NOT NULL,
    "overallAdherence" DOUBLE PRECISION NOT NULL,
    "daysCompleted" INTEGER NOT NULL,
    "daysExpected" INTEGER NOT NULL,
    "aiObservation" TEXT,
    "adjustmentSuggested" BOOLEAN NOT NULL DEFAULT false,
    "calculatedBySystem" BOOLEAN NOT NULL DEFAULT true,
    "trainerNote" TEXT,
    "reviewedByTrainer" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "weekly_adherence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderRole" "MessageSender" NOT NULL,
    "readAt" TIMESTAMP(3),
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "content" JSONB NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "type" "AIInteractionType" NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT,
    "clientId" TEXT,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_rate_limits" (
    "id" TEXT NOT NULL,
    "interactionType" "AIInteractionType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "maxAllowed" INTEGER NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "ai_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_feedback" (
    "id" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "trainerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_overrides" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "flagId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "feature_flag_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "rewardDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "trainer_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL,
    "anonymousAlias" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "challengeId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainers_email_key" ON "trainers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_subscriptions_trainerId_key" ON "trainer_subscriptions"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_settings_trainerId_key" ON "trainer_settings"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_userRole_idx" ON "refresh_tokens"("userId", "userRole");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_clientId_key" ON "client_profiles"("clientId");

-- CreateIndex
CREATE INDEX "client_profile_snapshots_clientId_takenAt_idx" ON "client_profile_snapshots"("clientId", "takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "motivation_profiles_clientId_key" ON "motivation_profiles"("clientId");

-- CreateIndex
CREATE INDEX "onboarding_messages_clientId_order_idx" ON "onboarding_messages"("clientId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_deviceId_key" ON "push_subscriptions"("deviceId");

-- CreateIndex
CREATE INDEX "scheduled_notifications_scheduledFor_sentAt_idx" ON "scheduled_notifications"("scheduledFor", "sentAt");

-- CreateIndex
CREATE INDEX "scheduled_notifications_clientId_type_idx" ON "scheduled_notifications"("clientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "cloudinary_assets_publicId_key" ON "cloudinary_assets"("publicId");

-- CreateIndex
CREATE INDEX "nutrition_plans_clientId_isActive_idx" ON "nutrition_plans"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "meal_items_planId_mealType_idx" ON "meal_items"("planId", "mealType");

-- CreateIndex
CREATE INDEX "workout_plans_clientId_isActive_idx" ON "workout_plans"("clientId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_assetId_key" ON "exercises"("assetId");

-- CreateIndex
CREATE INDEX "exercises_dayId_order_idx" ON "exercises"("dayId", "order");

-- CreateIndex
CREATE INDEX "daily_logs_date_idx" ON "daily_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_clientId_date_key" ON "daily_logs"("clientId", "date");

-- CreateIndex
CREATE INDEX "meal_logs_dailyLogId_idx" ON "meal_logs"("dailyLogId");

-- CreateIndex
CREATE INDEX "meal_logs_mealItemId_idx" ON "meal_logs"("mealItemId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_substitutions_mealLogId_key" ON "meal_substitutions"("mealLogId");

-- CreateIndex
CREATE INDEX "exercise_logs_dailyLogId_idx" ON "exercise_logs"("dailyLogId");

-- CreateIndex
CREATE INDEX "exercise_logs_exerciseId_idx" ON "exercise_logs"("exerciseId");

-- CreateIndex
CREATE INDEX "water_logs_dailyLogId_idx" ON "water_logs"("dailyLogId");

-- CreateIndex
CREATE INDEX "weight_checkins_clientId_date_idx" ON "weight_checkins"("clientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_checkinId_key" ON "progress_photos"("checkinId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_frontAssetId_key" ON "progress_photos"("frontAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "progress_photos_sideAssetId_key" ON "progress_photos"("sideAssetId");

-- CreateIndex
CREATE INDEX "progress_photos_clientId_weekNumber_idx" ON "progress_photos"("clientId", "weekNumber");

-- CreateIndex
CREATE INDEX "streak_history_clientId_days_idx" ON "streak_history"("clientId", "days");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_adherence_clientId_weekStart_key" ON "weekly_adherence"("clientId", "weekStart");

-- CreateIndex
CREATE INDEX "messages_trainerId_clientId_createdAt_idx" ON "messages"("trainerId", "clientId", "createdAt");

-- CreateIndex
CREATE INDEX "weekly_reports_trainerId_weekStart_idx" ON "weekly_reports"("trainerId", "weekStart");

-- CreateIndex
CREATE INDEX "ai_interactions_trainerId_createdAt_idx" ON "ai_interactions"("trainerId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_interactions_clientId_type_idx" ON "ai_interactions"("clientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ai_rate_limits_trainerId_interactionType_periodStart_key" ON "ai_rate_limits"("trainerId", "interactionType", "periodStart");

-- CreateIndex
CREATE INDEX "client_feedback_clientId_resolved_idx" ON "client_feedback"("clientId", "resolved");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_trainerId_createdAt_idx" ON "audit_logs"("trainerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_overrides_flagId_trainerId_key" ON "feature_flag_overrides"("flagId", "trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_challengeId_clientId_key" ON "challenge_participants"("challengeId", "clientId");

-- AddForeignKey
ALTER TABLE "trainer_subscriptions" ADD CONSTRAINT "trainer_subscriptions_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_settings" ADD CONSTRAINT "trainer_settings_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_restrictions" ADD CONSTRAINT "client_restrictions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_injuries" ADD CONSTRAINT "client_injuries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profile_snapshots" ADD CONSTRAINT "client_profile_snapshots_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motivation_profiles" ADD CONSTRAINT "motivation_profiles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_messages" ADD CONSTRAINT "onboarding_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_gyms" ADD CONSTRAINT "client_gyms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_devices" ADD CONSTRAINT "client_devices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "client_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "cloudinary_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "client_gyms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "meal_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "nutrition_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_substitutions" ADD CONSTRAINT "meal_substitutions_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_substitutions" ADD CONSTRAINT "meal_substitutions_originalMealItemId_fkey" FOREIGN KEY ("originalMealItemId") REFERENCES "meal_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "workout_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_checkins" ADD CONSTRAINT "weight_checkins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "weight_checkins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_frontAssetId_fkey" FOREIGN KEY ("frontAssetId") REFERENCES "cloudinary_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_sideAssetId_fkey" FOREIGN KEY ("sideAssetId") REFERENCES "cloudinary_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_history" ADD CONSTRAINT "streak_history_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_adherence" ADD CONSTRAINT "weekly_adherence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_rate_limits" ADD CONSTRAINT "ai_rate_limits_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_feedback" ADD CONSTRAINT "client_feedback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_challenges" ADD CONSTRAINT "trainer_challenges_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "trainer_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
