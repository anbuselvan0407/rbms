// F:\NestJS\rbms\src\auth\auth.service.ts
import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Make sure 'In' is imported if you use it for permissions
import { User } from '../entities/user.entity'; // Adjust path if needed
import { Role } from '../entities/role.entity'; // Adjust path if needed
import { Permission } from '../entities/permission.entity'; // Adjust path if needed (if your User and Role entities directly link to it)
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config'; // Import ConfigService if using it for roles

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>, // Inject Role repository
    @InjectRepository(Permission) // Inject Permission repository if needed for roles directly here
    private permissionRepo: Repository<Permission>,
    private jwtService: JwtService,
    private configService: ConfigService, // For accessing environment variables like default roles if needed
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepo.findOneBy({ email: dto.email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    // Determine the default role for new users
    const defaultRole = await this.roleRepo.findOne({
      where: { name: 'user' }, 
      relations: ['permissions'],
    });

    if (!defaultRole) {
      throw new NotFoundException('Default "user" role not found. Please seed your roles.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      type: dto.type, // e.g., 'candidate', 'employee'
      role: defaultRole, // Assign the default role
    });

    return this.userRepo.save(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role', 'role.permissions'], // Ensure role and its permissions are loaded
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    
    const payload = {
      sub: user.id, // User ID
      email: user.email,
      username: user.username,
      role: user.role.name,
      userType: user.type,
      permissions: user.role.permissions.map((p) => p.name), // Map Permission entities to just their names
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Helper method for JwtStrategy to validate the user from JWT payload.
   * Fetches the user from the database to ensure they still exist and retrieve
   * their latest permissions and role information.
   * @param payload The decoded JWT payload (containing sub, email, username, etc.)
   * @returns A structured user object to be attached to req.user.
   */
  async validateUserPayload(payload: any): Promise<any> {
    // Ensure the payload has a 'sub' (user ID)
    if (!payload || !payload.sub) {
      return null;
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['role', 'role.permissions'], // Load role and its permissions
    });

    if (!user) {
      return null; // User not found in database (e.g., deleted)
    }

    // Reconstruct the user object with current database permissions
    // This is important because permissions might have changed since the token was issued.
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name, // The role name (e.g., 'user', 'admin')
      userType: user.type, // 'candidate' or 'employee'
      permissions: user.role.permissions.map(p => p.name), // Array of permission names
      // Other properties you might want to attach to req.user
    };
  }

   async getProfile(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'], // Ensure role and permissions are loaded
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // You might want to omit the password from the returned profile
    // const { password, ...result } = user;
    // return result;
    return user;
  }
}