import { pool } from './db';

export async function initializeDatabase() {
  if (!pool) {
    console.log('Skipping database initialization - no DATABASE_URL configured');
    return;
  }
  
  try {
    console.log('Initializing database schema...');

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR UNIQUE,
        password VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        plan_type plan_type DEFAULT 'free',
        plan_expires_at TIMESTAMP,
        is_blocked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'location');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        CREATE TYPE node_type AS ENUM ('trigger', 'message', 'delay', 'condition', 'question', 'tag', 'verify');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'inactive', 'draft');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        CREATE TYPE funnel_status AS ENUM ('active', 'paused', 'inactive', 'draft');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_connections (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone_number VARCHAR NOT NULL,
        name VARCHAR,
        is_connected BOOLEAN DEFAULT false,
        qr_code TEXT,
        id_instance VARCHAR,
        api_token_instance VARCHAR,
        last_connected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS name VARCHAR;
      ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS id_instance VARCHAR;
      ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS api_token_instance VARCHAR;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        status campaign_status DEFAULT 'draft',
        trigger_phrase VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS funnels (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        trigger_phrases TEXT[] DEFAULT ARRAY[]::text[],
        status funnel_status DEFAULT 'draft',
        flow_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS funnel_nodes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        funnel_id VARCHAR NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
        node_id VARCHAR NOT NULL,
        type node_type NOT NULL,
        data JSONB NOT NULL,
        position JSONB NOT NULL,
        delay_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone_number VARCHAR NOT NULL,
        name VARCHAR,
        email VARCHAR,
        tags TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE CASCADE,
        contact_id VARCHAR NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type message_type NOT NULL,
        content TEXT NOT NULL,
        media_url VARCHAR,
        status VARCHAR DEFAULT 'pending',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        external_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        type message_type NOT NULL,
        content TEXT NOT NULL,
        media_url VARCHAR,
        variables TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS funnel_executions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        funnel_id VARCHAR NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
        contact_id VARCHAR NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        current_node_id VARCHAR,
        status VARCHAR DEFAULT 'active',
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        data JSONB
      );
    `);

    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
