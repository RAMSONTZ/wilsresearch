import pg from 'pg';
const {Pool}=pg;
const g=globalThis;
export function getPool(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL not configured');
 if(!g.__wilsPG){g.__wilsPG=new Pool({connectionString:process.env.DATABASE_URL,max:5,idleTimeoutMillis:12000,connectionTimeoutMillis:10000,ssl:process.env.DATABASE_URL.includes('localhost')?false:{rejectUnauthorized:true}});}
 return g.__wilsPG;
}
export async function db(sql,params=[]){return getPool().query(sql,params)}
export async function tx(fn){const client=await getPool().connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
