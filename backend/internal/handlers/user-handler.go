package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func RegisterUser(ctx *gin.Context) {
	user := &models.User{}

	err := ctx.ShouldBindJSON(&user)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = user.Save()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	auth := &models.Auth{
		UserID: user.ID,
	}

	auth, err = auth.Create()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var authDetails utils.AuthDetails

	authDetails.UserID = user.ID
	authDetails.AuthUuid = auth.AuthUUID

	token, err := utils.GenerateToken(authDetails)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"token": token, "id": user.ID, "name": user.Name, "email": user.Email})
}

func Login(ctx *gin.Context) {
	var user models.User

	err := ctx.ShouldBindJSON(&user)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = user.ValidateCredentials()

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	auth := &models.Auth{
		UserID: user.ID,
	}

	auth, err = auth.Create()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var authDetails utils.AuthDetails

	authDetails.UserID = user.ID
	authDetails.AuthUuid = auth.AuthUUID

	token, err := utils.GenerateToken(authDetails)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"token": token, "id": user.ID, "name": user.Name, "email": user.Email})

}

func Logout(ctx *gin.Context) {
	authUuid := ctx.GetString("authUUID")
	userId := ctx.GetString("userID")
	authDetails := &utils.AuthDetails{
		AuthUuid: authUuid,
		UserID:   userId,
	}
	err := models.DeleteAuth(authDetails)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func GetUser(ctx *gin.Context) {
	userId := ctx.GetString("userID")
	user := &models.User{
		ID: userId,
	}
	err := user.Get()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"id": user.ID, "name": user.Name, "email": user.Email, "phone": user.Phone, "created_at": user.CreatedAt})
}

func UpdateUser(ctx *gin.Context) {
	userId := ctx.GetString("userID")

	var updateData struct {
		Name  *string `json:"name"`
		Email *string `json:"email"`
		Phone *string `json:"phone"`
	}

	err := ctx.ShouldBindJSON(&updateData)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := &models.User{
		ID: userId,
	}

	if updateData.Name != nil {
		user.Name = *updateData.Name
	}
	if updateData.Email != nil {
		user.Email = *updateData.Email
	}
	if updateData.Phone != nil {
		user.Phone = *updateData.Phone
	}

	err = user.Update()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"id": user.ID, "name": user.Name, "email": user.Email, "phone": user.Phone, "updated_at": user.UpdatedAt})
}
