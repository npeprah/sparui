package game

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// HistoryRepository handles game history data operations
type HistoryRepository struct {
	db *db.DB
}

// NewHistoryRepository creates a new game history repository
func NewHistoryRepository(database *db.DB) *HistoryRepository {
	return &HistoryRepository{db: database}
}

// SaveGameSummary saves a completed game's summary to the database
// This includes saving to both game_history and player_game_results tables
// Uses a transaction to ensure atomicity
func (r *HistoryRepository) SaveGameSummary(ctx context.Context, summary *entity.GameSummary, roomID string) error {
	if summary == nil {
		return fmt.Errorf("game summary cannot be nil")
	}

	// Start a transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Parse game ID as UUID
	gameID, err := uuid.Parse(summary.GameID)
	if err != nil {
		return fmt.Errorf("invalid game ID format: %w", err)
	}

	// Parse room ID as UUID
	roomUUID, err := uuid.Parse(roomID)
	if err != nil {
		return fmt.Errorf("invalid room ID format: %w", err)
	}

	// Determine winner ID (use first winner if multiple)
	var winnerID *uuid.UUID
	if len(summary.Winners) > 0 {
		id, err := uuid.Parse(summary.Winners[0])
		if err != nil {
			return fmt.Errorf("invalid winner ID format: %w", err)
		}
		winnerID = &id
	}

	// Determine winning card (get from winner's last played card if available)
	var winningSuit *string
	var winningValue *int
	if len(summary.Winners) > 0 {
		winnerScore := summary.FinalScores[summary.Winners[0]]
		if winnerScore != nil {
			// For now, we'll leave winning card null
			// In a future enhancement, we could track the final winning card
		}
	}

	// Insert into game_history table
	gameHistoryQuery := `
		INSERT INTO game_history (
			id, room_id, winner_id, winning_card_suit, winning_card_value,
			total_rounds, game_duration_seconds, had_fire_streak, had_freeze_moment,
			created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err = tx.ExecContext(
		ctx,
		gameHistoryQuery,
		gameID,
		roomUUID,
		winnerID,
		winningSuit,
		winningValue,
		summary.TotalRounds,
		summary.DurationSeconds,
		summary.IsFireWin,
		summary.IsFreezeWin,
		summary.CompletedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert game history: %w", err)
	}

	// Insert player results
	for _, playerResult := range summary.PlayerResults {
		if err := r.savePlayerResult(ctx, tx, playerResult); err != nil {
			return fmt.Errorf("failed to save player result for %s: %w", playerResult.UserID, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	slog.Info("Game summary saved to database",
		"gameId", summary.GameID,
		"roomCode", summary.RoomCode,
		"winners", summary.Winners,
		"totalPlayers", len(summary.PlayerResults),
	)

	return nil
}

// savePlayerResult saves an individual player's result to player_game_results table
func (r *HistoryRepository) savePlayerResult(ctx context.Context, tx *sql.Tx, result *entity.PlayerGameResult) error {
	resultID := uuid.New()
	gameID, err := uuid.Parse(result.GameID)
	if err != nil {
		return fmt.Errorf("invalid game ID: %w", err)
	}

	userID, err := uuid.Parse(result.UserID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	// Convert dry card value to nullable int
	var dryCardValue *int
	if result.DryCardValue > 0 {
		dryCardValue = &result.DryCardValue
	}

	// Convert dry type to nullable string
	var dryType *string
	if result.DryType != "" {
		dryType = &result.DryType
	}

	query := `
		INSERT INTO player_game_results (
			id, game_id, user_id, final_score, rounds_won,
			declared_dry, dry_card_value, dry_type,
			challenges_made, challenges_won, placement, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = tx.ExecContext(
		ctx,
		query,
		resultID,
		gameID,
		userID,
		result.FinalScore,
		result.RoundsWon,
		result.DeclaredDry,
		dryCardValue,
		dryType,
		result.ChallengesMade,
		result.ChallengesWon,
		result.Placement,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to insert player result: %w", err)
	}

	return nil
}

// GetGameHistory retrieves game history by game ID
func (r *HistoryRepository) GetGameHistory(ctx context.Context, gameID string) (*entity.GameSummary, error) {
	id, err := uuid.Parse(gameID)
	if err != nil {
		return nil, fmt.Errorf("invalid game ID format: %w", err)
	}

	query := `
		SELECT
			id, room_id, winner_id, total_rounds, game_duration_seconds,
			had_fire_streak, had_freeze_moment, created_at
		FROM game_history
		WHERE id = $1
	`

	var summary entity.GameSummary
	var roomID uuid.UUID
	var winnerID *uuid.UUID
	var createdAt time.Time

	err = r.db.QueryRowContext(ctx, query, id).Scan(
		&summary.GameID,
		&roomID,
		&winnerID,
		&summary.TotalRounds,
		&summary.DurationSeconds,
		&summary.IsFireWin,
		&summary.IsFreezeWin,
		&createdAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("game history not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get game history: %w", err)
	}

	summary.CompletedAt = createdAt

	if winnerID != nil {
		summary.Winners = []string{winnerID.String()}
	}

	return &summary, nil
}

// GetPlayerGameResults retrieves all player results for a specific game
func (r *HistoryRepository) GetPlayerGameResults(ctx context.Context, gameID string) ([]*entity.PlayerGameResult, error) {
	id, err := uuid.Parse(gameID)
	if err != nil {
		return nil, fmt.Errorf("invalid game ID format: %w", err)
	}

	query := `
		SELECT
			game_id, user_id, final_score, rounds_won,
			declared_dry, dry_card_value, dry_type,
			challenges_made, challenges_won, placement
		FROM player_game_results
		WHERE game_id = $1
		ORDER BY placement ASC
	`

	rows, err := r.db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query player results: %w", err)
	}
	defer rows.Close()

	var results []*entity.PlayerGameResult

	for rows.Next() {
		var result entity.PlayerGameResult
		var gameID, userID uuid.UUID
		var dryCardValue *int
		var dryType *string

		err := rows.Scan(
			&gameID,
			&userID,
			&result.FinalScore,
			&result.RoundsWon,
			&result.DeclaredDry,
			&dryCardValue,
			&dryType,
			&result.ChallengesMade,
			&result.ChallengesWon,
			&result.Placement,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player result: %w", err)
		}

		result.GameID = gameID.String()
		result.UserID = userID.String()

		if dryCardValue != nil {
			result.DryCardValue = *dryCardValue
		}
		if dryType != nil {
			result.DryType = *dryType
		}

		result.IsWinner = result.Placement == 1

		results = append(results, &result)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating player results: %w", err)
	}

	return results, nil
}

// GetPlayerHistory retrieves all games played by a specific user
func (r *HistoryRepository) GetPlayerHistory(ctx context.Context, userID string, limit int) ([]*entity.PlayerGameResult, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	if limit <= 0 {
		limit = 50 // Default limit
	}

	query := `
		SELECT
			pgr.game_id, pgr.user_id, pgr.final_score, pgr.rounds_won,
			pgr.declared_dry, pgr.dry_card_value, pgr.dry_type,
			pgr.challenges_made, pgr.challenges_won, pgr.placement
		FROM player_game_results pgr
		JOIN game_history gh ON pgr.game_id = gh.id
		WHERE pgr.user_id = $1
		ORDER BY gh.created_at DESC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, id, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query player history: %w", err)
	}
	defer rows.Close()

	var results []*entity.PlayerGameResult

	for rows.Next() {
		var result entity.PlayerGameResult
		var gameID, userID uuid.UUID
		var dryCardValue *int
		var dryType *string

		err := rows.Scan(
			&gameID,
			&userID,
			&result.FinalScore,
			&result.RoundsWon,
			&result.DeclaredDry,
			&dryCardValue,
			&dryType,
			&result.ChallengesMade,
			&result.ChallengesWon,
			&result.Placement,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player history: %w", err)
		}

		result.GameID = gameID.String()
		result.UserID = userID.String()

		if dryCardValue != nil {
			result.DryCardValue = *dryCardValue
		}
		if dryType != nil {
			result.DryType = *dryType
		}

		result.IsWinner = result.Placement == 1

		results = append(results, &result)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating player history: %w", err)
	}

	return results, nil
}
