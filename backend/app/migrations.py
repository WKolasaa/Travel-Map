from pathlib import Path

from app.db import get_connection

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


def run_migrations() -> None:
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        return

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                  version TEXT PRIMARY KEY,
                  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cursor.execute("SELECT version FROM schema_migrations")
            applied_versions = {row["version"] for row in cursor.fetchall()}

            for migration_file in migration_files:
                version = migration_file.name
                if version in applied_versions:
                    continue

                sql = migration_file.read_text(encoding="utf-8").lstrip("\ufeff").strip()
                if not sql:
                    cursor.execute(
                        "INSERT INTO schema_migrations (version) VALUES (%s)",
                        (version,),
                    )
                    continue

                statements = [statement.strip() for statement in sql.split(";") if statement.strip()]
                for statement in statements:
                    cursor.execute(statement)

                cursor.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s)",
                    (version,),
                )
        connection.commit()