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

// CanAddRole checks if a given role (adderRole) has permission to add another role (targetRole)
func CanModifyRole(adderRole, targetRole string) bool {
	// Define role hierarchy and permissions
	permissions := map[string][]string{
		"owner":  {"owner", "admin", "member"}, // Owner can add anyone
		"admin":  {"member", "viewer"},         // Admin can add members and admins
		"member": {"member"},                   // Members can add members
		"viewer": {},                           // Viewers cannot add anyone
	}

	allowedRoles, exists := permissions[adderRole]
	if !exists {
		return false
	}

	// Check if targetRole is in the allowed list
	return slices.Contains(allowedRoles, targetRole)
}

// GetAddableRoles returns a list of roles that the given role can add
func GetAddableRoles(adderRole string) []string {
	permissions := map[string][]string{
		"owner":  {"owner", "admin", "member", "viewer"},
		"admin":  {"member", "viewer"},
		"member": {},
		"viewer": {},
	}

	if roles, exists := permissions[adderRole]; exists {
		return roles
	}
	return []string{}
}
