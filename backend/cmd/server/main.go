package main

import (
	"context"
	"log"
	"os"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	//connect to database
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	DB_URL := os.Getenv("DATABASE_URL")
	if DB_URL == "" {
		log.Fatalf("DATABASE_URL is not set")
	}

	ctx := context.Background()
	err = db.InitDB(ctx, DB_URL)
	if err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	// Create a separate direct connection for migrations to avoid prepared statement conflicts
	migrationDB, err := db.NewMigrationConnection(DB_URL)
	if err != nil {
		log.Fatalf("Error creating migration connection: %v", err)
	}
	defer migrationDB.Close()

	err = db.RunMigrations(migrationDB, "../../migrations")
	if err != nil {
		log.Fatalf("Error running migrations: %v", err)
	}

	defer db.GetDB().Close()

	server := gin.Default()
	routes.SetupRoutes(server)

	err = server.Run(":8080")
	if err != nil {
		log.Fatalf("Error running server: %v", err)
	}

	log.Println("Server is running on port 8080")
}
