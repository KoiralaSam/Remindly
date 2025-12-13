package models

import (
	"context"
	"slices"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Role struct {
	Role        string `json:"role"`
	Description string `json:"description"`
}

func (mr *Role) GetAllRoles() ([]Role, error) {
	query := `SELECT role, description FROM group_roles`
	rows, err := db.GetDB().Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		err = rows.Scan(&role.Role, &role.Description)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, nil
}

// GetModifiableRoles returns a map of role to the list of roles it can modify
func GetModifiableRoles() map[string][]string {
	return map[string][]string{
		"owner":  {"owner", "admin", "member", "viewer"}, // Owner can add anyone
		"admin":  {"member", "viewer"},                   // Admin can add members and viewers
		"member": {},                                     // Members cannot add anyone
		"viewer": {},                                     // Viewers cannot add anyone
	}
}

// CanAddRole checks if a given role (adderRole) has permission to add another role (targetRole)
func CanModifyRole(adderRole, targetRole string) bool {
	permissions := GetModifiableRoles()

	allowedRoles, exists := permissions[adderRole]
	if !exists {
		return false
	}

	// Check if targetRole is in the allowed list
	return slices.Contains(allowedRoles, targetRole)
}
