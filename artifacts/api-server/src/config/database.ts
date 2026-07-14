// This project connects to an EXISTING external production PostgreSQL database
// (DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD), never a Replit-managed one.
// Replit may auto-inject its own DATABASE_URL for a provisioned local DB — that
// value must be ignored here, or the app would silently talk to an empty
// database instead of the real production data.
function buildDatabaseUrl(): string {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

  if (DB_HOST && DB_PORT && DB_NAME && DB_USER && DB_PASSWORD) {
    const encodedPassword = encodeURIComponent(DB_PASSWORD);
    const encodedUser = encodeURIComponent(DB_USER);
    return `postgresql://${encodedUser}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  throw new Error(
    "Database connection is not configured. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (external DB), or DATABASE_URL as a fallback.",
  );
}

process.env.DATABASE_URL = buildDatabaseUrl();
