package db

import (
	"database/sql"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

// adapting pgxpool to sql.DB for use with goose migrations
func SqlDB(pool *pgxpool.Pool) *sql.DB {
	return stdlib.OpenDBFromPool(pool)
}

// NewMigrationConnection creates a direct database connection for migrations
// This avoids prepared statement conflicts when using connection pools
func NewMigrationConnection(dbURL string) (*sql.DB, error) {
	return sql.Open("pgx", dbURL)
}
