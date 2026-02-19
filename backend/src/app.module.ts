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
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { ResourcesModule } from './resources/resources.module';
import { AuthModule } from './auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config';
import { Contact } from './contacts/contact.entity';
import { Process } from './processes/process.entity';
import { ProfilesModule } from './profiles/profiles.module';

// Find UI build directory
function getUIPath(): string | null {
  const paths = [
    resolve(process.cwd(), 'dist', 'client'),
    resolve(process.cwd(), 'dist', 'public'),
    resolve(__dirname, '..', '..', 'dist', 'client'),
    resolve(__dirname, '..', '..', 'dist', 'public'),
  ];
  
  for (const p of paths) {
    if (existsSync(p) && existsSync(join(p, 'index.html'))) {
      console.log(`[UI] Found at: ${p}`);
      return p;
    }
  }
  
  console.log('[UI] Not found - API only mode');
  return null;
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
    ...(getUIPath() ? [
      ServeStaticModule.forRoot({
        rootPath: getUIPath()!,
        exclude: ['/api*', '/health'],
      }),
    ] : []),
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
