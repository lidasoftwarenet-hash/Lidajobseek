import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

import { User } from './users/user.entity';
import { Process } from './processes/process.entity';
import { Interaction } from './interactions/interaction.entity';
import { Contact } from './contacts/contact.entity';
import { Resource } from './resources/resource.entity';
import { SelfReview } from './reviews/self-review.entity';
import { Profile } from './profiles/profile.entity';
import { Folder } from './resources/folder.entity';

const envPath = existsSync(join(process.cwd(), 'backend', '.env'))
  ? join(process.cwd(), 'backend', '.env')
  : join(process.cwd(), '.env');

loadEnv({ path: envPath });

const config: MikroOrmModuleOptions = {
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL,

  driverOptions: {
    connection: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },

  entities: [
    User,
    Process,
    Interaction,
    Contact,
    Resource,
    SelfReview,
    Profile,
    Folder,
  ],

  allowGlobalContext: true,
};

export default config;