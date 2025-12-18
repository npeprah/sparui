-- Spar Game Database Schema
-- Initial setup for users, games, and statistics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT 'default-avatar.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- User statistics table
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    highest_streak INTEGER DEFAULT 0,
    games_with_fire INTEGER DEFAULT 0,
    games_with_freeze INTEGER DEFAULT 0,
    dry_wins INTEGER DEFAULT 0,
    show_dry_wins INTEGER DEFAULT 0,
    challenges_made INTEGER DEFAULT 0,
    challenges_won INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER DEFAULT 4,
    points_to_win INTEGER DEFAULT 10,
    surface_theme VARCHAR(50) DEFAULT 'poker-table',
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Game history table
CREATE TABLE IF NOT EXISTS game_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES users(id),
    winning_card_suit VARCHAR(20),
    winning_card_value INTEGER,
    total_rounds INTEGER DEFAULT 5,
    game_duration_seconds INTEGER,
    had_fire_streak BOOLEAN DEFAULT FALSE,
    had_freeze_moment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Player game results table (many-to-many: games and users)
CREATE TABLE IF NOT EXISTS player_game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    final_score INTEGER DEFAULT 0,
    rounds_won INTEGER DEFAULT 0,
    declared_dry BOOLEAN DEFAULT FALSE,
    dry_card_value INTEGER,
    dry_type VARCHAR(20), -- 'dry' or 'show_dry'
    challenges_made INTEGER DEFAULT 0,
    challenges_won INTEGER DEFAULT 0,
    placement INTEGER, -- 1st, 2nd, 3rd, 4th
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);
CREATE INDEX idx_game_rooms_host_id ON game_rooms(host_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_history_winner_id ON game_history(winner_id);
CREATE INDEX idx_game_history_created_at ON game_history(created_at DESC);
CREATE INDEX idx_player_game_results_user_id ON player_game_results(user_id);
CREATE INDEX idx_player_game_results_game_id ON player_game_results(game_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for user_stats
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed data for testing (optional - remove in production)
INSERT INTO users (username, email, password_hash, avatar) VALUES
    ('testuser1', 'test1@example.com', '$2a$10$dummyhash1', 'avatar1.png'),
    ('testuser2', 'test2@example.com', '$2a$10$dummyhash2', 'avatar2.png'),
    ('testuser3', 'test3@example.com', '$2a$10$dummyhash3', 'avatar3.png'),
    ('testuser4', 'test4@example.com', '$2a$10$dummyhash4', 'avatar4.png')
ON CONFLICT (email) DO NOTHING;

-- Create corresponding stats entries for test users
INSERT INTO user_stats (user_id, total_games, total_wins, total_losses, total_points, win_rate)
SELECT id, 0, 0, 0, 0, 0.00 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema initialized successfully!';
END $$;
