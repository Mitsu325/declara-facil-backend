import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email); // método para encontrar o usuário pelo email

    // Verifica se o usuário existe e se está ativo
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    // Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Cria o payload do JWT
    const payload = {
      name: user.name,
      email: user.email,
      sub: user.id,
      is_admin: user.is_admin,
    };

    // Gera o token JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = newHashedPassword;
    await this.usersService.save(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '15m' },
    );

    const recoveryLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailService.sendRecoveryEmail(user.email, recoveryLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await this.usersService.save(user);
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }
}
