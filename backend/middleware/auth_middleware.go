package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"github.com/npeprah/sparui/backend/common/auth"
)

// ContextKey type for context keys
type ContextKey string

const (
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "userId"
	// UsernameKey is the context key for username
	UsernameKey ContextKey = "username"
	// EmailKey is the context key for email
	EmailKey ContextKey = "email"
)

// AuthMiddleware creates JWT authentication middleware
func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Missing authorization header", http.StatusUnauthorized)
				return
			}

			// Extract token
			tokenString, err := auth.ExtractTokenFromHeader(authHeader)
			if err != nil {
				http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
				return
			}

			// Validate token
			claims, err := auth.ValidateToken(tokenString, jwtSecret)
			if err != nil {
				slog.Warn("Failed to validate token", "error", err)
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			// Add user info to context
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UsernameKey, claims.Username)
			ctx = context.WithValue(ctx, EmailKey, claims.Email)

			// Call next handler with updated context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// OptionalAuthMiddleware allows both authenticated and unauthenticated requests
func OptionalAuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// No token provided, continue without auth
				next.ServeHTTP(w, r)
				return
			}

			// Try to extract and validate token
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := auth.ValidateToken(tokenString, jwtSecret)
			if err == nil {
				// Valid token, add to context
				ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
				ctx = context.WithValue(ctx, UsernameKey, claims.Username)
				ctx = context.WithValue(ctx, EmailKey, claims.Email)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// Invalid token, but continue anyway (optional auth)
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserIDFromContext extracts user ID from context
func GetUserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(UserIDKey).(string)
	return userID, ok
}

// GetUsernameFromContext extracts username from context
func GetUsernameFromContext(ctx context.Context) (string, bool) {
	username, ok := ctx.Value(UsernameKey).(string)
	return username, ok
}

// GetEmailFromContext extracts email from context
func GetEmailFromContext(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(EmailKey).(string)
	return email, ok
}
