#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# clean-db.sh — Limpia TODOS los datos de la base de datos de PILA
# Uso:
#   ./scripts/clean-db.sh local
#   ./scripts/clean-db.sh prod
# ─────────────────────────────────────────────────────────────────────────────

set -e

ENV="${1:-}"

if [[ "$ENV" != "local" && "$ENV" != "prod" ]]; then
  echo "Uso: $0 [local|prod]"
  exit 1
fi

# Cargar DATABASE_URL desde el .env correspondiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

if [[ "$ENV" == "local" ]]; then
  ENV_FILE="$BACKEND_DIR/.env"
  DB_LABEL="LOCAL (pila_db en localhost)"
else
  ENV_FILE="$BACKEND_DIR/.env.production"
  DB_LABEL="PRODUCCIÓN"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No se encontró el archivo: $ENV_FILE"
  exit 1
fi

# Extraer DATABASE_URL del archivo .env
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d '=' -f2- | tr -d '"')

if [[ -z "$DATABASE_URL" ]]; then
  echo "No se encontró DATABASE_URL en $ENV_FILE"
  exit 1
fi

# ── Confirmación ──────────────────────────────────────────────
echo ""
echo "  ⚠️  ADVERTENCIA"
echo "  ──────────────────────────────────────────────────"
echo "  Vas a BORRAR TODOS LOS DATOS de: $DB_LABEL"
echo "  Las tablas y el schema se mantienen intactos."
echo "  Esta acción NO se puede deshacer."
echo "  ──────────────────────────────────────────────────"
echo ""

if [[ "$ENV" == "prod" ]]; then
  echo "  Escribe  BORRAR PRODUCCION  para confirmar:"
  EXPECTED="BORRAR PRODUCCION"
else
  echo "  Escribe  CONFIRMAR  para continuar:"
  EXPECTED="CONFIRMAR"
fi

echo ""
read -r CONFIRM

if [[ "$CONFIRM" != "$EXPECTED" ]]; then
  echo "Cancelado."
  exit 0
fi

# ── SQL: truncar todas las tablas con CASCADE ──────────────────
SQL="
TRUNCATE TABLE
  payment_intents,
  ai_job_queue,
  client_notification_settings,
  plan_change_notifications,
  audit_logs,
  feature_flag_overrides,
  ai_rate_limits,
  ai_interactions,
  client_feedback,
  challenge_participants,
  trainer_challenges,
  weekly_reports,
  weekly_adherence,
  streak_history,
  progress_photos,
  weight_checkins,
  messages,
  gym_session_summaries,
  water_logs,
  exercise_logs,
  meal_substitutions,
  meal_logs,
  daily_logs,
  exercises,
  workout_days,
  workout_plans,
  meal_items,
  nutrition_plans,
  cloudinary_assets,
  scheduled_notifications,
  push_subscriptions,
  client_devices,
  client_gyms,
  onboarding_messages,
  motivation_profiles,
  client_profile_snapshots,
  client_injuries,
  client_restrictions,
  client_profiles,
  refresh_tokens,
  password_reset_tokens,
  client_invitations,
  clients,
  trainer_subscriptions,
  trainer_settings,
  trainers
RESTART IDENTITY CASCADE;
"

echo ""
echo "Limpiando base de datos $DB_LABEL..."
psql "$DATABASE_URL" -c "$SQL"

echo ""
echo "Listo. La base de datos está limpia."
