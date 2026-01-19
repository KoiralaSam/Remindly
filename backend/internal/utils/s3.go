package utils

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type S3Service struct {
	client *s3.Client
	bucket string
	region string
}

func NewS3Service() (*S3Service, error) {
	AWS_REGION := os.Getenv("AWS_REGION")
	AWS_S3_BUCKET := os.Getenv("AWS_S3_BUCKET")

	if AWS_REGION == "" {
		return nil, fmt.Errorf("AWS_REGION environment variable is not set")
	}
	if AWS_S3_BUCKET == "" {
		return nil, fmt.Errorf("AWS_S3_BUCKET environment variable is not set")
	}

	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithRegion(AWS_REGION),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}
	client := s3.NewFromConfig(cfg)
	return &S3Service{
		client: client,
		bucket: AWS_S3_BUCKET,
		region: AWS_REGION,
	}, nil

}

func (s *S3Service) UploadFile(ctx context.Context, key string, fileReader io.Reader, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        fileReader,
		ContentType: &contentType,
	})
	if err != nil {
		return err
	}
	return nil
}

func (s *S3Service) GetPresignedURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(s.client)
	presign, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expires
	})
	if err != nil {
		return "", err
	}
	return presign.URL, nil
}

func (s *S3Service) DeleteFile(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	})
	if err != nil {
		return err
	}
	return nil
}

func (s *S3Service) GetBucket() string {
	return s.bucket
}

// GenerateS3Key generates a unique S3 key for a file
// Format: groupID/userID/YYYYMMDD-uuid/filename
func GenerateS3Key(groupID, userID, filename string) string {
	timestamp := time.Now().Format("20060102")
	uniqueID := uuid.New().String()
	safeFilename := filepath.Base(filename) // Sanitize filename to prevent path traversal
	return fmt.Sprintf("%s/%s/%s-%s/%s", groupID, userID, timestamp, uniqueID, safeFilename)
}
