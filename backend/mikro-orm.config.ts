import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

import { User } from './src/users/user.entity';
import { Process } from './src/processes/process.entity';
import { Interaction } from './src/interactions/interaction.entity';
import { Contact } from './src/contacts/contact.entity';
import { Resource } from './src/resources/resource.entity';
import { SelfReview } from './src/reviews/self-review.entity';
import { Profile } from './src/profiles/profile.entity';

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
  ],

  allowGlobalContext: true,
};

export default config;
