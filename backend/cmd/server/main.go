package main

import (
	"context"
	"log"
	"os"

	"github.com/KoiralaSam/Remindly/server/internal/db"
	"github.com/KoiralaSam/Remindly/server/internal/routes"
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

	//get the pool from db.go and call adapter and pass it go migrations.go
	pool := db.GetDB()

	dbAdapter := db.SqlDB(pool)

	err = db.RunMigrations(dbAdapter, "migrations")

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
