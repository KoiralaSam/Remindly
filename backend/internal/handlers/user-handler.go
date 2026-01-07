package handlers

import (
	"net/http"
	"strings"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// getUserInitials extracts initials from a user's name
func getUserInitials(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	if len(parts) == 1 {
		return strings.ToUpper(parts[0][:1])
	}
	// Return first letter of first name and first letter of last name
	return strings.ToUpper(parts[0][:1] + parts[len(parts)-1][:1])
}

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

	// Create a private group for the user
	initials := getUserInitials(user.Name)
	groupName := user.Name
	if initials != "" {
		groupName = strings.Split(user.Name, " ")[0] + "'s private space"
	}

	privateGroup := &models.Group{
		Name:        groupName,
		Description: "Personal workspace",
		Type:        "private",
		CreatedBy:   user.ID,
	}
	err = privateGroup.Create()
	if err != nil {
		// Log error but don't fail registration
		// You might want to log this error properly
		_ = err
	} else {
		// Add user as owner of their private group
		groupMember := &models.GroupMember{
			GroupID: privateGroup.ID,
			UserID:  user.ID,
			Role:    "owner",
		}
		_ = groupMember.Save() // Ignore error, continue with registration
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

	// Get role modification permissions mapping
	rolePermissions := models.GetModifiableRoles()

	ctx.JSON(http.StatusOK, gin.H{
		"id":               user.ID,
		"name":             user.Name,
		"email":            user.Email,
		"phone":            user.Phone,
		"created_at":       user.CreatedAt,
		"role_permissions": rolePermissions,
	})
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

func GetUsersFromMyGroups(ctx *gin.Context) {
	userID := ctx.GetString("userID")

	users, err := models.GetUsersFromUserGroups(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"users": users})
}
