import Database from 'better-sqlite3';
import {readFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const db=new Database('prisma/lab.db');
db.pragma('foreign_keys = ON');
db.exec('CREATE TABLE IF NOT EXISTS _lab_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
for(const name of readdirSync('prisma/migrations').sort()) {
 const path=`prisma/migrations/${name}/migration.sql`;
 if(!existsSync(path))continue;
 const sql=readFileSync(path,'utf8');const checksum=createHash('sha256').update(sql).digest('hex');
 const existing=db.prepare('SELECT checksum FROM _lab_migrations WHERE name=?').get(name);
 if(existing&&existing.checksum!==checksum)throw Error(`已应用的迁移 ${name} 被修改，停止启动以保护数据。`);
 if(existing)continue;
 if(db.prepare("SELECT name FROM sqlite_master WHERE name='LocalState'").get()) {
  mkdirSync('prisma/backups',{recursive:true});
  const backup=`prisma/backups/pre-${name}-${Date.now()}.db`;
  await db.backup(backup);console.log(`升级前数据库备份：${backup}`);
 }
 db.transaction(()=>{db.exec(sql);db.prepare('INSERT INTO _lab_migrations VALUES (?,?)').run(name,checksum);})();
 console.log(`已应用迁移：${name}`);
}
const episode=db.prepare('INSERT OR IGNORE INTO Episode (id,title,titleSource) VALUES (?,?,?)');
for(let id=1;id<=24;id++)episode.run(id,id===1?"Who's Your Daddy?":null,id===1?'用户任务书指定，尚未独立核实':null);
db.prepare('INSERT OR IGNORE INTO Lesson (id,episodeId,title,sourceType,source) VALUES (?,?,?,?,?)').run('demo-1',1,'认识自己与家人','teaching_example','本站教学示例，非原剧台词');
db.prepare('INSERT OR IGNORE INTO UserSettings (id,data) VALUES (?,?)').run('local','{}');
db.close();console.log('SQLite 迁移和 24 集初始数据已就绪。');
await import('./seed.mjs');
