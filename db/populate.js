#! /usr/bin/env node

const { Client } = require('pg');

const SQL = `
  CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  )
  WITH (OIDS=FALSE);

  ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

  CREATE TABLE IF NOT EXISTS app_user (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "username" varchar(255) NOT NULL UNIQUE,
    "password" varchar(255) NOT NULL,
    "created" timestamp(6) NOT NULL,
    "last_login" timestamp(6)
  )
`;

async function init() {
  try {
    const connectionString = process.argv[2];
    if (!connectionString) throw new Error('No db connection string provided');

    const client = new Client({ connectionString });
    console.log('Connecting to db...');
    await client.connect();

    console.log('Running query...');
    await client.query(SQL);

    console.log('Closing connection...');
    await client.end();

    console.log('Done!');
  } catch (error) {
    console.log(error);
  }
}

init();
