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
  clientUrl: process.env.DATABASE_URL,
  entities: [User, Process, Interaction, Contact, Resource, SelfReview],
  metadataProvider: TsMorphMetadataProvider,
  allowGlobalContext: true,
  discovery: {
    warnWhenNoEntities: false,
  },
};

export default config;
