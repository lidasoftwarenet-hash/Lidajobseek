import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProcessesModule } from './processes/processes.module';
import { InteractionsModule } from './interactions/interactions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { basename, extname, join } from 'path';
import { existsSync } from 'fs';
import { ResourcesModule } from './resources/resources.module';
import { AuthModule } from './auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { Contact } from './contacts/contact.entity';
import { Process } from './processes/process.entity';
import { ProfilesModule } from './profiles/profiles.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: (() => {
        const backendEnv = join(process.cwd(), 'backend', '.env');
        const rootEnv = join(process.cwd(), '.env');
        const parentBackendEnv = join(process.cwd(), '..', 'backend', '.env');
        if (existsSync(backendEnv)) {
          return backendEnv;
        }
        if (existsSync(parentBackendEnv)) {
          return parentBackendEnv;
        }
        return rootEnv;
      })(),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: Number(configService.get('THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(configService.get('THROTTLE_LIMIT') ?? 120),
        },
      ],
    }),
    MikroOrmModule.forRoot(config),
    MikroOrmModule.forFeature([Contact, Process]),
    AuthModule,
    ServeStaticModule.forRoot(
      {
        rootPath: (() => {
          const uploadsRoot = join(process.cwd(), 'uploads');
          const uploadsParent = join(process.cwd(), '..', 'uploads');
          return existsSync(uploadsRoot) ? uploadsRoot : uploadsParent;
        })(),
        serveRoot: '/uploads',
        serveStaticOptions: {
          setHeaders: (res, filePath) => {
            const blockedExtensions = new Set([
              '.html',
              '.htm',
              '.svg',
              '.js',
              '.mjs',
              '.xml',
            ]);

            const fileExt = extname(filePath).toLowerCase();
            if (blockedExtensions.has(fileExt)) {
              res.setHeader('Content-Type', 'application/octet-stream');
            }

            const safeFileName = basename(filePath).replace(/"/g, '');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
          },
        },
      },
      {
        rootPath: join(__dirname, 'client'),
        exclude: ['/api/(.*)'],
      },
    ),
    ProcessesModule,
    InteractionsModule,
    ReviewsModule,
    ResourcesModule,
    ProfilesModule,
  ],
  controllers: [AppController, ContactsController],
  providers: [
    AppService,
    ContactsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
