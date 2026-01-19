package main

import (
	"context"
	"crypto/tls"
	"log"
	"net/http"
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

	// Set Gin to release mode in production
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	server := gin.Default()

	// Trust proxies for App Platform
	// App Platform uses load balancers, so we need to trust all proxies
	// This allows X-Forwarded-* headers to work correctly
	server.SetTrustedProxies(nil) // Trust all proxies in App Platform
	hub := WS.NewHub()
	signalingHub := WS.NewSignalingHub()
	wsHandler := handlers.NewHandler(hub)
	signalingHandler := handlers.NewSignalingHandler(signalingHub)

	go hub.Run()
	go signalingHub.Run()

	// Configure CORS middleware - allow multiple origins from environment
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		// Default to allowing all origins in production (App Platform)
		// For production, set CORS_ORIGINS environment variable explicitly
		corsOrigins = "*"
	}

	var corsConfig cors.Config
	if corsOrigins == "*" {
		// Allow all origins (useful for API-only deployments)
		corsConfig = cors.Config{
			AllowAllOrigins:  true,
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}
	} else {
		// Use specific origins
		origins := []string{}
		for _, origin := range strings.Split(corsOrigins, ",") {
			origins = append(origins, strings.TrimSpace(origin))
		}
		corsConfig = cors.Config{
			AllowOrigins:     origins,
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}
	}

	server.Use(cors.New(corsConfig))

	routes.SetupRoutes(server, wsHandler, signalingHandler)

	// Check if HTTPS certificates are provided
	certPath := os.Getenv("CERT_PATH")
	keyPath := os.Getenv("KEY_PATH")
	httpsPort := os.Getenv("HTTPS_PORT")
	httpPort := os.Getenv("HTTP_PORT")

	// If certificates are provided, start HTTPS server with HTTP redirect
	if certPath != "" && keyPath != "" {
		if httpsPort == "" {
			httpsPort = "443"
		}
		if httpPort == "" {
			httpPort = "80"
		}

		// Check if certificates exist
		if _, err := os.Stat(certPath); os.IsNotExist(err) {
			log.Fatalf("Certificate file not found: %s", certPath)
		}
		if _, err := os.Stat(keyPath); os.IsNotExist(err) {
			log.Fatalf("Private key file not found: %s", keyPath)
		}

		// Create HTTP server for redirecting to HTTPS
		httpServer := &http.Server{
			Addr:    ":" + httpPort,
			Handler: http.HandlerFunc(redirectToHTTPS),
		}

		// Create HTTPS server
		tlsConfig := &tls.Config{
			MinVersion: tls.VersionTLS12,
		}

		httpsServer := &http.Server{
			Addr:      ":" + httpsPort,
			Handler:   server,
			TLSConfig: tlsConfig,
		}

		// Start HTTP redirect server in a goroutine
		go func() {
			log.Printf("HTTP redirect server starting on port %s", httpPort)
			if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Fatalf("HTTP redirect server failed: %v", err)
			}
		}()

		// Start HTTPS server
		log.Printf("HTTPS server starting on port %s with certificates: %s, %s", httpsPort, certPath, keyPath)
		if err := httpsServer.ListenAndServeTLS(certPath, keyPath); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTPS server failed: %v", err)
		}
	} else {
		// Fallback to HTTP if no certificates provided
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		log.Printf("No certificates provided, starting HTTP server on port %s", port)
		err = server.Run(":" + port)
		if err != nil {
			log.Fatalf("Error running server: %v", err)
		}
	}
}

// redirectToHTTPS redirects all HTTP traffic to HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	// Get the host from the request
	host := r.Host
	if host == "" {
		host = r.Header.Get("Host")
	}

	// Build HTTPS URL
	httpsURL := "https://" + host + r.RequestURI

	// Redirect with 301 (Permanent Redirect)
	http.Redirect(w, r, httpsURL, http.StatusMovedPermanently)
}
