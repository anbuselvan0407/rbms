// src/user/user.controller.ts
import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guards'; // Adjust path
import { RequiredPermissions } from '../auth/decorators/permissions.decorator'; // Adjust path

// DTO for updating a user's role
class UpdateUserRoleDto {
  roleName: string; // e.g., 'user', 'admin', 'candidate_role', 'employee_role'
}

@Controller('users') // <-- IMPORTANT: The prefix for this controller is 'users' (plural)
@UseGuards(AuthGuard('jwt'), PermissionsGuard) // Protect all routes in this controller
export class UserController {
  constructor(private readonly userService: UserService) {}

  // --- Endpoints for User Management ---

  // Example: Get all users (Admin only)
  @Get()
  @RequiredPermissions('read', 'manage:users') // Requires 'read' or 'manage:users' permission
  async findAll() {
    return this.userService.findAll();
  }

  // Example: Get a single user by ID (Admin only, or read:self)
  @Get(':id')
  @RequiredPermissions('read', 'manage:users') // Requires 'read' or 'manage:users' permission
  async findOne(@Param('id') userId: string) {
    return this.userService.findOne(+userId); // Convert string ID to number
  }

  /**
   * Endpoint to update a specific user's role.
   * This is the endpoint you were trying to hit.
   * Only users with 'update' or 'manage:users' permissions (e.g., admin) can access this.
   */
  @Patch(':id/role') // <-- THIS IS THE ROUTE: PATCH /users/:id/role
  @RequiredPermissions('update', 'manage:users') // Requires 'update' or 'manage:users' permission
  async updateRole(@Param('id') userId: string, @Body() body: UpdateUserRoleDto) {
    // Convert string ID from URL to number
    return this.userService.updateUserRole(+userId, body.roleName);
  }

  // You can add more endpoints like PATCH /users/:id for general updates, DELETE /users/:id, etc.
}