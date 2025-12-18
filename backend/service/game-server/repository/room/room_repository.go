package room

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Repository handles room data operations
type Repository struct {
	db *db.DB
}

// NewRepository creates a new room repository
func NewRepository(database *db.DB) *Repository {
	return &Repository{db: database}
}

// Create creates a new room in the database
func (r *Repository) Create(ctx context.Context, room *entity.Room) error {
	query := `
		INSERT INTO game_rooms (id, room_code, host_id, max_players, points_to_win, surface_theme, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		room.ID,
		room.RoomCode,
		room.HostID,
		room.MaxPlayers,
		room.Settings.PointsToWin,
		room.Settings.SurfaceTheme,
		room.Status,
		room.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create room: %w", err)
	}

	slog.Info("Room persisted to database", "roomCode", room.RoomCode, "roomId", room.ID)

	return nil
}

// Update updates an existing room in the database
func (r *Repository) Update(ctx context.Context, room *entity.Room) error {
	query := `
		UPDATE game_rooms
		SET host_id = $1, max_players = $2, points_to_win = $3, surface_theme = $4,
		    status = $5, started_at = $6, completed_at = $7
		WHERE id = $8
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		room.HostID,
		room.MaxPlayers,
		room.Settings.PointsToWin,
		room.Settings.SurfaceTheme,
		room.Status,
		room.StartedAt,
		room.CompletedAt,
		room.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update room: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("room not found: %s", room.ID)
	}

	return nil
}

// Delete deletes a room from the database
func (r *Repository) Delete(ctx context.Context, roomID string) error {
	query := `DELETE FROM game_rooms WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, roomID)
	if err != nil {
		return fmt.Errorf("failed to delete room: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("room not found: %s", roomID)
	}

	slog.Info("Room deleted from database", "roomId", roomID)

	return nil
}

// FindByCode finds a room by room code
func (r *Repository) FindByCode(ctx context.Context, roomCode string) (*entity.Room, error) {
	query := `
		SELECT id, room_code, host_id, max_players, points_to_win, surface_theme,
		       status, created_at, started_at, completed_at
		FROM game_rooms
		WHERE room_code = $1
	`

	var room entity.Room
	var startedAt, completedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, roomCode).Scan(
		&room.ID,
		&room.RoomCode,
		&room.HostID,
		&room.MaxPlayers,
		&room.Settings.PointsToWin,
		&room.Settings.SurfaceTheme,
		&room.Status,
		&room.CreatedAt,
		&startedAt,
		&completedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("room not found: %s", roomCode)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find room by code: %w", err)
	}

	// Handle nullable timestamps
	if startedAt.Valid {
		room.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		room.CompletedAt = &completedAt.Time
	}

	// Initialize players slice
	room.Players = []entity.Player{}
	room.UpdatedAt = room.CreatedAt

	return &room, nil
}

// FindByID finds a room by ID
func (r *Repository) FindByID(ctx context.Context, roomID string) (*entity.Room, error) {
	query := `
		SELECT id, room_code, host_id, max_players, points_to_win, surface_theme,
		       status, created_at, started_at, completed_at
		FROM game_rooms
		WHERE id = $1
	`

	var room entity.Room
	var startedAt, completedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, roomID).Scan(
		&room.ID,
		&room.RoomCode,
		&room.HostID,
		&room.MaxPlayers,
		&room.Settings.PointsToWin,
		&room.Settings.SurfaceTheme,
		&room.Status,
		&room.CreatedAt,
		&startedAt,
		&completedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("room not found: %s", roomID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find room by id: %w", err)
	}

	// Handle nullable timestamps
	if startedAt.Valid {
		room.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		room.CompletedAt = &completedAt.Time
	}

	// Initialize players slice
	room.Players = []entity.Player{}
	room.UpdatedAt = room.CreatedAt

	return &room, nil
}

// List returns all active rooms
func (r *Repository) List(ctx context.Context) ([]*entity.Room, error) {
	query := `
		SELECT id, room_code, host_id, max_players, points_to_win, surface_theme,
		       status, created_at, started_at, completed_at
		FROM game_rooms
		WHERE status IN ('waiting', 'ready', 'in_progress')
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list rooms: %w", err)
	}
	defer rows.Close()

	var rooms []*entity.Room
	for rows.Next() {
		var room entity.Room
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&room.ID,
			&room.RoomCode,
			&room.HostID,
			&room.MaxPlayers,
			&room.Settings.PointsToWin,
			&room.Settings.SurfaceTheme,
			&room.Status,
			&room.CreatedAt,
			&startedAt,
			&completedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan room: %w", err)
		}

		// Handle nullable timestamps
		if startedAt.Valid {
			room.StartedAt = &startedAt.Time
		}
		if completedAt.Valid {
			room.CompletedAt = &completedAt.Time
		}

		// Initialize players slice
		room.Players = []entity.Player{}
		room.UpdatedAt = room.CreatedAt

		rooms = append(rooms, &room)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rooms: %w", err)
	}

	return rooms, nil
}

// RoomCodeExists checks if a room code already exists
func (r *Repository) RoomCodeExists(ctx context.Context, roomCode string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM game_rooms WHERE room_code = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, roomCode).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check room code existence: %w", err)
	}

	return exists, nil
}

// UpdateStatus updates the status of a room
func (r *Repository) UpdateStatus(ctx context.Context, roomID string, status entity.RoomStatus) error {
	query := `
		UPDATE game_rooms
		SET status = $1
	`

	var args []interface{}
	args = append(args, status)

	// Update timestamps based on status
	if status == entity.StatusInProgress {
		query += `, started_at = $2`
		args = append(args, time.Now())
	} else if status == entity.StatusCompleted {
		query += `, completed_at = $2`
		args = append(args, time.Now())
	}

	query += ` WHERE id = $` + fmt.Sprintf("%d", len(args)+1)
	args = append(args, roomID)

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update room status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("room not found: %s", roomID)
	}

	return nil
}

// CleanupCompletedRooms removes completed rooms older than the specified duration
func (r *Repository) CleanupCompletedRooms(ctx context.Context, olderThan time.Duration) (int, error) {
	query := `
		DELETE FROM game_rooms
		WHERE status = 'completed' AND completed_at < $1
	`

	cutoffTime := time.Now().Add(-olderThan)
	result, err := r.db.ExecContext(ctx, query, cutoffTime)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup completed rooms: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected > 0 {
		slog.Info("Cleaned up completed rooms from database", "count", rowsAffected)
	}

	return int(rowsAffected), nil
}

// Helper function to marshal players to JSON (if needed for future use)
func marshalPlayers(players []entity.Player) (string, error) {
	data, err := json.Marshal(players)
	if err != nil {
		return "", fmt.Errorf("failed to marshal players: %w", err)
	}
	return string(data), nil
}

// Helper function to unmarshal players from JSON (if needed for future use)
func unmarshalPlayers(data string) ([]entity.Player, error) {
	var players []entity.Player
	if data == "" {
		return players, nil
	}
	err := json.Unmarshal([]byte(data), &players)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal players: %w", err)
	}
	return players, nil
}
