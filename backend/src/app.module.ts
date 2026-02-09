import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
        rootPath: (() => {
          const distPublicRoot = join(process.cwd(), 'dist', 'public');
          const distPublicParent = join(process.cwd(), '..', 'dist', 'public');
          const uiBrowserRoot = join(process.cwd(), 'ui', 'dist', 'ui', 'browser');
          const uiBrowserParent = join(process.cwd(), '..', 'ui', 'dist', 'ui', 'browser');
          if (existsSync(distPublicRoot)) {
            return distPublicRoot;
          }
          if (existsSync(distPublicParent)) {
            return distPublicParent;
          }
          return existsSync(uiBrowserRoot) ? uiBrowserRoot : uiBrowserParent;
        })(),
        exclude: ['/api'],
      },
    ),
    ProcessesModule,
    InteractionsModule,
    ReviewsModule,
    ResourcesModule,
    ProfilesModule,
  ],
  controllers: [AppController, ContactsController],
  providers: [AppService, ContactsService],
})
export class AppModule {}
