// src/database/seeder.ts

import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity'; // Corrected path
import { Permission } from '../entities/permission.entity'; // Corrected path
import { User } from '../entities/user.entity'; // Corrected path
import * as bcrypt from 'bcrypt';

// Setup DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5460,
  username: 'postgres',
  password: 'softsuave',
  database: 'rbms',
  synchronize: true, // Use with caution in production! Consider migrations.
  entities: [User, Role, Permission],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('DataSource initialized.');

  const permissionRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Seed permissions
  const permissionNames = [
    'create', 'read', 'update', 'delete',
    'read:self', 'update:self',
    'manage:candidates', 'manage:employees'
  ];
  const permissionEntities: Permission[] = [];

  for (const name of permissionNames) {
    let permission = await permissionRepo.findOne({ where: { name } });
    if (!permission) {
      permission = new Permission();
      permission.name = name;
      permission = await permissionRepo.save(permission);
      console.log(`Permission "${name}" created.`);
    } else {
      console.log(`Permission "${name}" already exists.`);
    }
    permissionEntities.push(permission);
  }

  // Helper to find permissions by name
  const findPermission = (name: string) => permissionEntities.find(p => p.name === name);

  const createPermission = findPermission('create');
  const readPermission = findPermission('read');
  const updatePermission = findPermission('update');
  const deletePermission = findPermission('delete');
  const readSelfPermission = findPermission('read:self');
  const updateSelfPermission = findPermission('update:self');
  const manageCandidatesPermission = findPermission('manage:candidates');
  const manageEmployeesPermission = findPermission('manage:employees');


  // 2. Seed roles with appropriate permissions
  const rolesToCreate = [
    {
      name: 'admin',
      permissions: permissionEntities, // All permissions for admin
    },
    {
      name: 'user', // Generic user role, initially only 'read'
      permissions: [readPermission!].filter(Boolean), // Only 'read' permission
    },
    {
      name: 'candidate_role', // Specific role for candidates, if needed
      permissions: [
        readPermission!,
        readSelfPermission!,
        updateSelfPermission!,
        manageCandidatesPermission!
      ].filter(Boolean),
    },
    {
      name: 'employee_role', // Specific role for employees, if needed
      permissions: [
        readPermission!,
        readSelfPermission!,
        updateSelfPermission!,
        manageEmployeesPermission!
      ].filter(Boolean),
    },
  ];

  for (const roleData of rolesToCreate) {
    let role = await roleRepo.findOne({
      where: { name: roleData.name },
      relations: ['permissions'], // Eager load permissions to compare them
    });

    if (!role) {
      // Role does not exist, create it
      role = roleRepo.create(roleData);
      await roleRepo.save(role);
      console.log(`Role "${roleData.name}" created.`);
    } else {
      // Role exists, check if permissions need updating
      const currentPermissionNames = role.permissions.map(p => p.name).sort();
      const desiredPermissionNames = roleData.permissions.map(p => p.name).sort();

      if (JSON.stringify(currentPermissionNames) !== JSON.stringify(desiredPermissionNames)) {
        // Permissions are different, update them
        role.permissions = roleData.permissions;
        await roleRepo.save(role);
        console.log(`Role "${roleData.name}" updated with new permissions.`);
      } else {
        console.log(`Role "${roleData.name}" already exists and has correct permissions.`);
      }
    }
  }

  // 3. Seed default admin user
  let adminUser = await userRepo.findOne({ where: { username: 'admin' } });

  if (!adminUser) {
    const adminRole = await roleRepo.findOne({
      where: { name: 'admin' },
      relations: ['permissions'],
    });

    if (!adminRole) {
      console.error('Admin role not found during admin user seeding! Please check your seed logic.');
      await AppDataSource.destroy();
      return;
    }

    adminUser = userRepo.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: adminRole,
      type: 'employee', // Assign a default type for admin
    });
    await userRepo.save(adminUser);
    console.log('Default "admin" user created.');
  } else {
    console.log('Default "admin" user already exists.');
  }

  console.log('✅ Seeding completed');
  await AppDataSource.destroy();
  console.log('DataSource destroyed.');
}

// Execute the seed function and catch any errors
seed().catch(error => {
  console.error('Seeding failed:', error);
  if (AppDataSource.isInitialized) {
    AppDataSource.destroy();
  }
  process.exit(1); // Exit with an error code
});