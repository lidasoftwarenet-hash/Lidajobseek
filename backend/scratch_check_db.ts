import { MikroORM, SqlEntityManager } from '@mikro-orm/postgresql';
import config from './mikro-orm.config';

async function check() {
  // @ts-ignore
  const orm = await MikroORM.init(config);
  const knex = (orm.em as SqlEntityManager).getKnex();
  const res = await knex.raw(`
    SELECT column_name, table_schema 
    FROM information_schema.columns 
    WHERE table_name = 'process' AND table_schema = 'app'
  `);
  console.log('Columns in app.process:', res.rows.map((r: any) => r.column_name));
  await orm.close();
}

check().catch(console.error);
