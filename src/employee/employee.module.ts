// src/employee/employee.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])], // ✅ this line is important!
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService], // optional if used elsewhere
})
export class EmployeeModule {}
