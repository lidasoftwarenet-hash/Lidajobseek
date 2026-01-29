import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User } from './src/users/user.entity';
import { Process } from './src/processes/process.entity';
import { Interaction } from './src/interactions/interaction.entity';
import { Contact } from './src/contacts/contact.entity';
import { Resource } from './src/resources/resource.entity';
import { SelfReview } from './src/reviews/self-review.entity';

const config: MikroOrmModuleOptions = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'lidajobseek',
  entities: [User, Process, Interaction, Contact, Resource, SelfReview],
  metadataProvider: TsMorphMetadataProvider,
  allowGlobalContext: true,
  discovery: {
    warnWhenNoEntities: false,
  },
  schemaGenerator: {
    disableForeignKeys: false,
  },
  schema: 'app',
};

export default config;
