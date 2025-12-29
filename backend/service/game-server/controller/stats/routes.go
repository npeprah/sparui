package stats

import (
	"github.com/go-chi/chi/v5"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/repository/user"
)

var (
	service *Service
	handler *Handler
)

// InitService initializes the stats service with database
func InitService(database *db.DB) {
	userRepo := user.NewRepository(database)
	service = NewServiceWithRepository(userRepo)
	handler = NewHandler(service)
}

// Routes returns the stats routes
// This is called by the main server to mount stats endpoints
func Routes() chi.Router {
	if handler == nil {
		panic("stats service not initialized - call InitService first")
	}

	return handler.Routes()
}
