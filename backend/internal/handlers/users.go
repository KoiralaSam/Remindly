package handlers

import (
	"errors"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func RegisterUser(ctx *gin.Context) {
	var user models.User

	err := ctx.ShouldBindJSON(&user)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := user.Save()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	token, err := utils.GenerateToken(id, user.Name, user.Email)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"token": token})
}

func Login(ctx *gin.Context) {
	var user models.User

	err := ctx.ShouldBindJSON(&user)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": errors.New("invalid request body")})
		return
	}

	err = user.ValidateCredentials()

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("invalid credentials")})
		return
	}

	token, err := utils.GenerateToken(user.ID, user.Name, user.Email)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": errors.New("failed to generate token")})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"token": token})

}
