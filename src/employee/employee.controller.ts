// F:\NestJS\rbms\src\employee\employee.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AuthGuard } from '@nestjs/passport';
// Corrected import paths for PermissionsGuard, RequiredPermissions, RequestWithUser:
import { PermissionsGuard } from '../auth/guards/permissions.guards'; // Corrected path, added 's' to guards.ts
import { RequiredPermissions } from '../auth/decorators/permissions.decorator'; // Corrected path
import { RequestWithUser } from '../auth/types'; // Corrected path: now imports from src/auth/types.ts

@Controller('employees')
@UseGuards(AuthGuard('jwt'), PermissionsGuard) // Apply AuthGuard first, then PermissionsGuard
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @RequiredPermissions('create') // User needs 'create' permission
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Get()
  @RequiredPermissions('read') // User needs 'read' permission
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @RequiredPermissions('read', 'read:self') // User needs general 'read' OR specific 'read:self'
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Pass user ID and permissions to the service for granular checks
    return this.employeeService.findOneWithAuth(+id, {
        id: req.user.sub, // Assuming 'sub' holds the user ID
        permissions: req.user.permissions,
    });
  }

  @Delete(':id')
  @RequiredPermissions('delete', 'delete:self') // User needs general 'delete' OR specific 'delete:self'
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Pass user ID and permissions to the service for granular checks
    return this.employeeService.removeWithAuth(+id, {
        id: req.user.sub, // Assuming 'sub' holds the user ID
        permissions: req.user.permissions,
    });
  }
}