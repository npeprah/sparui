package auth

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/npeprah/sparui/backend/common/auth"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/middleware"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
	"github.com/npeprah/sparui/backend/service/game-server/repository/user"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

// Service holds the auth service dependencies
type Service struct {
	userRepo  *user.Repository
	jwtConfig auth.JWTConfig
}

// NewService creates a new auth service
func NewService(database *db.DB, jwtSecret string, jwtExpirationHours int) *Service {
	return &Service{
		userRepo: user.NewRepository(database),
		jwtConfig: auth.JWTConfig{
			Secret:     jwtSecret,
			Expiration: time.Duration(jwtExpirationHours) * time.Hour,
		},
	}
}

var authService *Service

// InitService initializes the global auth service
func InitService(database *db.DB) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-change-in-production-please"
		slog.Warn("JWT_SECRET not set, using default (not secure for production)")
	}

	jwtExpirationHours := 24
	if expStr := os.Getenv("JWT_EXPIRATION_HOURS"); expStr != "" {
		if exp, err := strconv.Atoi(expStr); err == nil {
			jwtExpirationHours = exp
		}
	}

	authService = NewService(database, jwtSecret, jwtExpirationHours)
	slog.Info("Auth service initialized", "jwtExpiration", jwtExpirationHours)
}

// RegisterRequest represents the user registration payload
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Avatar   string `json:"avatar,omitempty"`
}

// LoginRequest represents the user login payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string     `json:"token"`
	User  UserDTO    `json:"user"`
}

// UserDTO represents a user entity for API responses
type UserDTO struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details,omitempty"`
}

// Routes returns the auth router
func Routes() chi.Router {
	r := chi.NewRouter()

	r.Post("/register", handleRegister)
	r.Post("/login", handleLogin)
	r.Post("/logout", handleLogout)

	// Protected route - requires authentication
	r.Group(func(r chi.Router) {
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "dev-secret-change-in-production-please"
		}
		r.Use(middleware.AuthMiddleware(jwtSecret))
		r.Get("/me", handleGetCurrentUser)
	})

	return r
}

// handleRegister creates a new user account
func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest, nil)
		return
	}

	// Validate input
	if validationErrors := validateRegisterRequest(req); len(validationErrors) > 0 {
		respondError(w, "Validation failed", http.StatusBadRequest, validationErrors)
		return
	}

	// Check if email already exists
	exists, err := authService.userRepo.EmailExists(r.Context(), req.Email)
	if err != nil {
		slog.Error("Failed to check email existence", "error", err)
		respondError(w, "Internal server error", http.StatusInternalServerError, nil)
		return
	}
	if exists {
		respondError(w, "Email already registered", http.StatusConflict, nil)
		return
	}

	// Check if username already exists
	exists, err = authService.userRepo.UsernameExists(r.Context(), req.Username)
	if err != nil {
		slog.Error("Failed to check username existence", "error", err)
		respondError(w, "Internal server error", http.StatusInternalServerError, nil)
		return
	}
	if exists {
		respondError(w, "Username already taken", http.StatusConflict, nil)
		return
	}

	// Hash password
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		respondError(w, "Internal server error", http.StatusInternalServerError, nil)
		return
	}

	// Create user in database
	createUserReq := entity.CreateUserRequest{
		Username: req.Username,
		Email:    req.Email,
		Avatar:   req.Avatar,
	}

	createdUser, err := authService.userRepo.Create(r.Context(), createUserReq, passwordHash)
	if err != nil {
		slog.Error("Failed to create user", "error", err)
		respondError(w, "Failed to create user", http.StatusInternalServerError, nil)
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(createdUser.ID, createdUser.Username, createdUser.Email, authService.jwtConfig)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, "Failed to generate authentication token", http.StatusInternalServerError, nil)
		return
	}

	// Success response
	response := AuthResponse{
		Token: token,
		User: UserDTO{
			ID:       createdUser.ID,
			Username: createdUser.Username,
			Email:    createdUser.Email,
			Avatar:   createdUser.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)

	slog.Info("User registered successfully", "userId", createdUser.ID, "username", createdUser.Username)
}

// handleLogin authenticates a user and returns a JWT token
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest, nil)
		return
	}

	// Validate input
	if validationErrors := validateLoginRequest(req); len(validationErrors) > 0 {
		respondError(w, "Validation failed", http.StatusBadRequest, validationErrors)
		return
	}

	// Find user by email
	user, err := authService.userRepo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		// Don't reveal whether user exists or not
		respondError(w, "Invalid email or password", http.StatusUnauthorized, nil)
		return
	}

	// Verify password
	if err := auth.CheckPassword(user.PasswordHash, req.Password); err != nil {
		respondError(w, "Invalid email or password", http.StatusUnauthorized, nil)
		return
	}

	// Update last login
	if err := authService.userRepo.UpdateLastLogin(r.Context(), user.ID); err != nil {
		slog.Warn("Failed to update last login", "userId", user.ID, "error", err)
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Username, user.Email, authService.jwtConfig)
	if err != nil {
		slog.Error("Failed to generate token", "error", err)
		respondError(w, "Failed to generate authentication token", http.StatusInternalServerError, nil)
		return
	}

	// Success response
	response := AuthResponse{
		Token: token,
		User: UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Avatar:   user.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	slog.Info("User logged in successfully", "userId", user.ID, "username", user.Username)
}

// handleLogout invalidates the user's session
func handleLogout(w http.ResponseWriter, r *http.Request) {
	// Note: JWT tokens are stateless, so logout is handled client-side by deleting the token.
	// For enhanced security, implement token blacklisting using Redis in the future.

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}

// handleGetCurrentUser returns the currently authenticated user
func handleGetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		respondError(w, "Unauthorized", http.StatusUnauthorized, nil)
		return
	}

	// Fetch user from database
	user, err := authService.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		slog.Error("Failed to fetch user", "userId", userID, "error", err)
		respondError(w, "User not found", http.StatusNotFound, nil)
		return
	}

	// Return user data
	userDTO := UserDTO{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userDTO)
}

// validateRegisterRequest validates the registration request
func validateRegisterRequest(req RegisterRequest) map[string]string {
	errors := make(map[string]string)

	// Validate username
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		errors["username"] = "Username is required"
	} else if len(req.Username) < 3 {
		errors["username"] = "Username must be at least 3 characters"
	} else if len(req.Username) > 50 {
		errors["username"] = "Username must be at most 50 characters"
	}

	// Validate email
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		errors["email"] = "Email is required"
	} else if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Invalid email format"
	}

	// Validate password
	if req.Password == "" {
		errors["password"] = "Password is required"
	} else if len(req.Password) < 8 {
		errors["password"] = "Password must be at least 8 characters"
	} else if len(req.Password) > 100 {
		errors["password"] = "Password must be at most 100 characters"
	}

	return errors
}

// validateLoginRequest validates the login request
func validateLoginRequest(req LoginRequest) map[string]string {
	errors := make(map[string]string)

	// Validate email
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		errors["email"] = "Email is required"
	} else if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Invalid email format"
	}

	// Validate password
	if req.Password == "" {
		errors["password"] = "Password is required"
	}

	return errors
}

// respondError sends an error response
func respondError(w http.ResponseWriter, message string, statusCode int, details map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   message,
		Details: details,
	})
}
