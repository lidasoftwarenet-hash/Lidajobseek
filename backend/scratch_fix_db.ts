import { MikroORM, SqlEntityManager } from '@mikro-orm/postgresql';
import config from './mikro-orm.config';

async function fix() {
  // @ts-ignore
  const orm = await MikroORM.init(config);
  const knex = (orm.em as SqlEntityManager).getKnex();
  
  console.log('Adding job_description_url column...');
  await knex.raw(`
    ALTER TABLE app.process 
    ADD COLUMN IF NOT EXISTS job_description_url text;
  `);
  
  console.log('Done.');
  await orm.close();
}

fix().catch(console.error);
