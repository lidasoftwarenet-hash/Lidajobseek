import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const config: MikroOrmModuleOptions = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dbName: process.env.DB_NAME || 'lidajobseek',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
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