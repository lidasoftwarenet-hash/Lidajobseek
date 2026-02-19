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
import { basename, extname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { ResourcesModule } from './resources/resources.module';
import { AuthModule } from './auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { Contact } from './contacts/contact.entity';
import { Process } from './processes/process.entity';
import { ProfilesModule } from './profiles/profiles.module';

// Helper function to find uploads directory
function findUploadsPath(): string {
  const possiblePaths = [
    resolve(process.cwd(), 'uploads'),
    resolve(process.cwd(), '..', 'uploads'),
    resolve(__dirname, '..', '..', 'uploads'),
  ];
  
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      console.log(`[Static] Uploads directory found at: ${p}`);
      return p;
    }
  }
  
  // Create default uploads directory if none exists
  const defaultPath = possiblePaths[0];
  console.log(`[Static] No uploads directory found, will use: ${defaultPath}`);
  return defaultPath;
}

// Helper function to find UI static files
function findUIStaticPath(): string | null {
  const possiblePaths = [
    resolve(process.cwd(), 'dist', 'public'),
    resolve(process.cwd(), '..', 'dist', 'public'),
    resolve(__dirname, '..', 'public'),
    resolve(__dirname, '..', '..', 'dist', 'public'),
    resolve(__dirname, '..', '..', '..', 'dist', 'public'),
  ];
  
  for (const p of possiblePaths) {
    console.log(`[Static] Checking for UI static files in: ${p}`);
    if (existsSync(p) && existsSync(join(p, 'index.html'))) {
      console.log(`[Static] ✓ UI found at: ${p}`);
      return p;
    }
  }
  
  console.warn('[Static] ⚠ UI static files not found - frontend will not be served');
  console.warn('[Static] This is normal if you are running backend-only or UI is deployed separately');
  return null;
}

// Build ServeStaticModule configuration
function buildServeStaticConfig() {
  const configs: any[] = [
    {
      rootPath: findUploadsPath(),
      serveRoot: '/uploads',
      serveStaticOptions: {
        setHeaders: (res: any, filePath: string) => {
          const blockedExtensions = new Set(['.html', '.htm', '.svg', '.js', '.mjs', '.xml']);

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
  ];

  // Only add UI static serving if the directory exists
  const uiPath = findUIStaticPath();
  if (uiPath) {
    configs.push({
      rootPath: uiPath,
      renderPath: '*',
      exclude: ['/api*'],
    });
  }

  return configs;
}

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
    ServeStaticModule.forRoot(buildServeStaticConfig() as any),
    ProcessesModule,
    InteractionsModule,
    ReviewsModule,
    ResourcesModule,
    ProfilesModule,
  ],
  controllers: [AppController, ContactsController],
  providers: [AppService, ContactsService],
})
export class AppModule { }
