import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  exports: [TypeOrmModule], // allow reuse in RoleModule if needed
})
export class PermissionModule {}
