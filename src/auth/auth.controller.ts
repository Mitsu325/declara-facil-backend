import { Controller, Post, Body, Put, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({
    summary: 'Login do usuário',
    description:
      'Realiza a autenticação de usuários na plataforma. O usuário deve fornecer um email e senha válidos. Se as credenciais estiverem corretas, um token será retornado, o qual poderá ser utilizado para acessar rotas protegidas do sistema.',
  })
  @ApiBody({ type: LoginDto, description: 'Request body.' })
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'Alterar senha',
    description:
      'Realiza a alteração de senha.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ChangePasswordDto, description: 'Request body.' })
  @Put('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req,) {
    return await this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  @ApiOperation({
    summary: 'Recuperação de senha',
    description:
      'Realiza a recuperação de senha.',
  })
  @ApiBody({ type: ForgotPasswordDto, description: 'Request body.' })
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({
    summary: 'Redefinir senha',
    description:
      'Redefinir a senha usando token.',
  })
  @ApiBody({ type: ResetPasswordDto, description: 'Request body.' })
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}
