// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../entities/user.entity'; // Adjust path if needed
import { Role } from '../entities/role.entity'; // Adjust path if needed
import { Permission } from '../entities/permission.entity'; // Adjust path if needed
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to use PermissionsGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]), // Provide repositories for User, Role, Permission
    AuthModule, // Import AuthModule to make AuthGuard and PermissionsGuard available
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // Export UserService if other modules need to inject it
})
export class UserModule {}