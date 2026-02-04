import { SetMetadata } from '@nestjs/common';

export const RequiresPremium = () => SetMetadata('requiresPremium', true);