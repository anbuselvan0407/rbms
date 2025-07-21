// src/user/user.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Import 'In' if used elsewhere or keep for future
import { User } from '../entities/user.entity'; // Adjust path
import { Role } from '../entities/role.entity'; // Adjust path
import { Permission } from '../entities/permission.entity'; // Adjust path (if managing permissions directly)

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission) // Inject Permission repository if you plan to manage permissions directly
    private permissionRepo: Repository<Permission>,
  ) {}

  // --- Methods for User Management ---

  // Example: Find a user by ID (useful for getProfile if AuthService doesn't do it)
  async findOne(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    return user;
  }

  // Example: Find all users
  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['role', 'role.permissions'],
    });
  }

  /**
   * Updates a specific user's role.
   * This is the core method for providing permissions.
   * @param userId The ID of the user whose role is to be updated.
   * @param newRoleName The name of the new role (e.g., 'admin', 'employee_role').
   * @returns The updated User object.
   * @throws NotFoundException if user or role not found.
   * @throws BadRequestException if the new role doesn't exist.
   */
  async updateUserRole(userId: number, newRoleName: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'], // Load the current role
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const newRole = await this.roleRepo.findOne({
      where: { name: newRoleName },
      relations: ['permissions'], // Load permissions of the new role
    });

    if (!newRole) {
      throw new BadRequestException(`Role "${newRoleName}" not found.`);
    }

    user.role = newRole; // Assign the new role
    await this.userRepo.save(user);

    // Return the updated user with their new role and permissions for confirmation
    return this.userRepo.findOne({ where: { id: userId }, relations: ['role', 'role.permissions'] });
  }

  // You can add more methods here like deleteUser, updateUserDetails, etc.
}