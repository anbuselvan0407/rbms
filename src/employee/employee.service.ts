// F:\NestJS\rbms\src\employee\employee.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'; // Ensure ForbiddenException is imported
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  create(dto: CreateEmployeeDto) {
    const employee = this.employeeRepo.create(dto);
    return this.employeeRepo.save(employee);
  }

  findAll() {
    return this.employeeRepo.find();
  }

  /**
   * Find a single employee by ID, with optional authorization checks.
   * @param id The ID of the employee to find.
   * @param requestingUser (Optional) The authenticated user's ID and permissions for self-access checks.
   * @returns The found Employee object.
   * @throws NotFoundException if the employee is not found.
   * @throws ForbiddenException if the requesting user doesn't have permission to access this employee.
   */
  async findOneWithAuth(
    id: number,
    requestingUser?: { id: number; permissions: string[] }, // User object from JWT payload
  ): Promise<Employee> {
    const employee = await this.employeeRepo.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    // If no requestingUser is provided, assume this is an internal call
    // or a route without specific self-permission requirements (e.g., admin access)
    if (!requestingUser) {
      return employee;
    }

    // Check if the user has general 'read' permission (e.g., for an admin or manager)
    if (requestingUser.permissions.includes('read')) {
      return employee;
    }

    // Check if the user has 'read:self' permission AND the employee ID matches the requesting user's ID
    // IMPORTANT: This assumes the Employee entity itself represents a user that can log in,
    // and its 'id' matches the 'sub' (user.id) from the JWT.
    // If Employee is just a profile, and User is the login entity, you'd need to link them.
    if (requestingUser.permissions.includes('read:self') && employee.id === requestingUser.id) {
      return employee;
    }

    // If neither general 'read' nor 'read:self' (for own data) conditions are met
    throw new ForbiddenException('You do not have permission to access this employee record.'); // Corrected: ForbiddenException()
  }


  /**
   * Remove an employee by ID, with optional authorization checks.
   * @param id The ID of the employee to remove.
   * @param requestingUser (Optional) The authenticated user's ID and permissions for self-access checks.
   * @returns An object indicating deletion status.
   * @throws NotFoundException if the employee is not found.
   * @throws ForbiddenException if the requesting user doesn't have permission to delete this employee.
   */
  async removeWithAuth(
    id: number,
    requestingUser?: { id: number; permissions: string[] }, // User object from JWT payload
  ): Promise<{ deleted: boolean }> {
    const employee = await this.employeeRepo.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }

    // If no requestingUser is provided, assume this is an internal call
    if (!requestingUser) {
        await this.employeeRepo.delete(id);
        return { deleted: true };
    }

    // Check if the user has general 'delete' permission (e.g., for an admin or manager)
    if (requestingUser.permissions.includes('delete')) {
      await this.employeeRepo.delete(id);
      return { deleted: true };
    }

    // Check if the user has 'delete:self' permission AND the employee ID matches the requesting user's ID
    if (requestingUser.permissions.includes('delete:self') && employee.id === requestingUser.id) {
      await this.employeeRepo.delete(id);
      return { deleted: true };
    }

    // If neither general 'delete' nor 'delete:self' (for own data) conditions are met
    throw new ForbiddenException('You do not have permission to delete this employee record.'); // Corrected: ForbiddenException()
  }

  // You can keep or remove the original findOne and remove methods based on your internal service needs.
  // For external API calls, ensure the controller uses findOneWithAuth/removeWithAuth.
}