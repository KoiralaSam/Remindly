package db

import (
	"database/sql"
	"log"

	"github.com/pressly/goose/v3"
)

func RunMigrations(db *sql.DB, migrationsDir string) error {
	err := goose.SetDialect("postgres")

	if err != nil {
		return err
	}

	err = goose.Up(db, migrationsDir)

	if err != nil {
		return err
	}

	log.Println("Migrations completed successfully")
	return nil
}
