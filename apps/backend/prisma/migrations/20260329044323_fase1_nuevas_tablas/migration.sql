-- CreateTable
CREATE TABLE "client_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "client_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT NOT NULL,
    "per100g" JSONB NOT NULL,
    "isCommon" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_substitutions" (
    "id" TEXT NOT NULL,
    "originalFood" TEXT NOT NULL,
    "substituteFood" TEXT NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "calorieMatch" DOUBLE PRECISION NOT NULL,
    "proteinMatch" DOUBLE PRECISION NOT NULL,
    "carbsMatch" DOUBLE PRECISION NOT NULL,
    "fatMatch" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "food_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "muscleGroup" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "tips" TEXT,
    "assetId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_job_queue" (
    "id" TEXT NOT NULL,
    "type" "AIInteractionType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "result" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "trainerId" TEXT,
    "clientId" TEXT,

    CONSTRAINT "ai_job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_session_summaries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "duration" INTEGER NOT NULL,
    "exercisesCompleted" INTEGER NOT NULL,
    "exercisesTotal" INTEGER NOT NULL,
    "completionPct" DOUBLE PRECISION NOT NULL,
    "personalRecords" JSONB,
    "aiMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyLogId" TEXT NOT NULL,

    CONSTRAINT "gym_session_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_change_notifications" (
    "id" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "plan_change_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_notification_settings" (
    "id" TEXT NOT NULL,
    "mealReminders" BOOLEAN NOT NULL DEFAULT true,
    "waterReminders" BOOLEAN NOT NULL DEFAULT true,
    "gymProximity" BOOLEAN NOT NULL DEFAULT true,
    "streakAlerts" BOOLEAN NOT NULL DEFAULT true,
    "trainerMessages" BOOLEAN NOT NULL DEFAULT true,
    "planUpdates" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_acceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "terms_acceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "planName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainerId" TEXT NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_invitations_token_key" ON "client_invitations"("token");

-- CreateIndex
CREATE INDEX "client_invitations_token_idx" ON "client_invitations"("token");

-- CreateIndex
CREATE INDEX "client_invitations_email_idx" ON "client_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_userRole_idx" ON "password_reset_tokens"("userId", "userRole");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE INDEX "food_substitutions_originalFood_idx" ON "food_substitutions"("originalFood");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_library_assetId_key" ON "exercise_library"("assetId");

-- CreateIndex
CREATE INDEX "exercise_library_muscleGroup_difficulty_idx" ON "exercise_library"("muscleGroup", "difficulty");

-- CreateIndex
CREATE INDEX "exercise_library_equipment_idx" ON "exercise_library"("equipment");

-- CreateIndex
CREATE INDEX "ai_job_queue_status_scheduledAt_idx" ON "ai_job_queue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ai_job_queue_trainerId_idx" ON "ai_job_queue"("trainerId");

-- CreateIndex
CREATE INDEX "ai_job_queue_clientId_idx" ON "ai_job_queue"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "gym_session_summaries_dailyLogId_key" ON "gym_session_summaries"("dailyLogId");

-- CreateIndex
CREATE INDEX "plan_change_notifications_clientId_seenAt_idx" ON "plan_change_notifications"("clientId", "seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_notification_settings_clientId_key" ON "client_notification_settings"("clientId");

-- CreateIndex
CREATE INDEX "terms_acceptance_userId_userRole_idx" ON "terms_acceptance"("userId", "userRole");

-- CreateIndex
CREATE INDEX "deletion_requests_status_idx" ON "deletion_requests"("status");

-- CreateIndex
CREATE INDEX "support_tickets_status_createdAt_idx" ON "support_tickets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "support_tickets_userId_userRole_idx" ON "support_tickets"("userId", "userRole");

-- CreateIndex
CREATE INDEX "system_logs_level_createdAt_idx" ON "system_logs"("level", "createdAt");

-- CreateIndex
CREATE INDEX "system_logs_context_createdAt_idx" ON "system_logs"("context", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "payment_intents_trainerId_status_idx" ON "payment_intents"("trainerId", "status");

-- AddForeignKey
ALTER TABLE "client_invitations" ADD CONSTRAINT "client_invitations_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_library" ADD CONSTRAINT "exercise_library_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "cloudinary_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_job_queue" ADD CONSTRAINT "ai_job_queue_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_job_queue" ADD CONSTRAINT "ai_job_queue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_session_summaries" ADD CONSTRAINT "gym_session_summaries_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_change_notifications" ADD CONSTRAINT "plan_change_notifications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notification_settings" ADD CONSTRAINT "client_notification_settings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
