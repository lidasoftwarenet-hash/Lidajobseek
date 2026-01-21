import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProcessesModule } from './processes/processes.module';
import { InteractionsModule } from './interactions/interactions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';
import { PrismaService } from './prisma.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ResourcesModule } from './resources/resources.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ServeStaticModule.forRoot(
      {
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(process.cwd(), 'dist', 'public'),
        exclude: ['/api'],
      },
    ),
    ProcessesModule,
    InteractionsModule,
    ReviewsModule,
    ResourcesModule,
  ],
  controllers: [AppController, ContactsController],
  providers: [AppService, ContactsService, PrismaService],
})
export class AppModule {}
