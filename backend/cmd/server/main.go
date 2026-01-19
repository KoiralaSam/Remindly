package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/KoiralaSam/Remindly/backend/internal/routes"
	"github.com/KoiralaSam/Remindly/backend/internal/services"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-co-op/gocron/v2"
	"github.com/joho/godotenv"
)

func main() {
	//connect to database
	// Try .env in current directory first (Docker), then relative path (local dev)
	// In App Platform, environment variables are injected directly, so .env is optional
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../../.env"); err != nil {
			// .env file not found - this is OK in App Platform where env vars are injected
			log.Printf("Note: .env file not found, using environment variables from system")
		}
	}

	DB_URL := os.Getenv("DATABASE_URL")
	if DB_URL == "" {
		log.Fatalf("DATABASE_URL is not set")
	}

	ctx := context.Background()
	err := db.InitDB(ctx, DB_URL)
	if err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	// Create a separate direct connection for migrations to avoid prepared statement conflicts
	migrationDB, err := db.NewMigrationConnection(DB_URL)
	if err != nil {
		log.Fatalf("Error creating migration connection: %v", err)
	}
	defer migrationDB.Close()

	// Try migrations in current directory first (Docker/App Platform), then relative path (local dev)
	migrationPath := "migrations"
	if _, err := os.Stat(migrationPath); err != nil {
		// Try relative path for local development
		if _, err := os.Stat("../../migrations"); err == nil {
			migrationPath = "../../migrations"
		} else {
			// If neither exists, log error but don't fail (migrations might be in a different location)
			log.Printf("Warning: migrations directory not found in 'migrations' or '../../migrations'. Continuing without migrations.")
			migrationPath = ""
		}
	}

	if migrationPath != "" {
		err = db.RunMigrations(migrationDB, migrationPath)
		if err != nil {
			log.Fatalf("Error running migrations: %v", err)
		}
	} else {
		log.Printf("Skipping migrations - directory not found")
	}

	defer db.GetDB().Close()

	// Initialize S3 service (optional - only if AWS credentials are set)
	if err := handlers.InitS3Service(); err != nil {
		log.Printf("Warning: S3 service not initialized: %v (file uploads will not work)", err)
	} else {
		log.Println("S3 service initialized successfully")
	}

	//initialize email service'

	if err := utils.InitEmailService(); err != nil {
		log.Printf("Warning: Email service not initialized: %v (notifications will not be sent)", err)
	} else {
		log.Println("Email service initialized successfully")
	}

	//initialize gocron scheduler
	scheduler, err := gocron.NewScheduler()
	if err != nil {
		log.Fatalf("Error initializing scheduler: %v", err)
	}
	defer scheduler.Shutdown()

	// Schedule notification sender job to run every minute
	job, err := scheduler.NewJob(
		gocron.DurationJob(time.Minute),
		gocron.NewTask(func() {
			ctx := context.Background()
			// Check for due dates and reminders, create pending notifications
			if err := services.CheckDueDatesAndReminders(ctx); err != nil {
				log.Printf("Error checking due dates and reminders: %v", err)
			}
			// Send pending notifications
			if err := services.SendPendingNotifications(ctx); err != nil {
				log.Printf("Error sending pending notifications: %v", err)
			}
		}),
	)
	if err != nil {
		log.Fatalf("Error scheduling notification job: %v", err)
	}

	log.Printf("Notification sender job scheduled: %s", job.ID())

	// Start the scheduler
	scheduler.Start()

	server := gin.Default()
	hub := WS.NewHub()
	signalingHub := WS.NewSignalingHub()
	wsHandler := handlers.NewHandler(hub)
	signalingHandler := handlers.NewSignalingHandler(signalingHub)

	go hub.Run()
	go signalingHub.Run()

	// Configure CORS middleware - allow multiple origins from environment
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:5173,http://localhost:80"
	}

	origins := []string{}
	for _, origin := range strings.Split(corsOrigins, ",") {
		origins = append(origins, strings.TrimSpace(origin))
	}

	server.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetupRoutes(server, wsHandler, signalingHandler)

	err = server.Run(":8080")
	if err != nil {
		log.Fatalf("Error running server: %v", err)
	}

	log.Println("Server is running on port 8080")
}
