import { SetMetadata } from '@nestjs/common';

// Definindo uma chave para marcar rotas públicas
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
