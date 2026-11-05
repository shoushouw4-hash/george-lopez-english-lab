import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,cpSync,symlinkSync,readFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Database=require('better-sqlite3');
it('升级与重复初始化保留旧表全部记录，自动备份可恢复旧数据库',async()=>{
 const root=mkdtempSync(join(tmpdir(),'lab-migration-'));mkdirSync(join(root,'prisma'));cpSync('scripts',join(root,'scripts'),{recursive:true});cpSync('lib',join(root,'lib'),{recursive:true});cpSync('package.json',join(root,'package.json'));cpSync('prisma/migrations',join(root,'prisma/migrations'),{recursive:true});symlinkSync(resolve('node_modules'),join(root,'node_modules'),'dir');
 const d=new Database(join(root,'prisma/lab.db'));d.exec(readFileSync('prisma/migrations/20261105000000_init/migration.sql','utf8'));
 d.exec('CREATE TABLE _lab_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
 const {createHash}=await import('node:crypto');d.prepare('INSERT INTO _lab_migrations VALUES (?,?)').run('20261105000000_init',createHash('sha256').update(readFileSync('prisma/migrations/20261105000000_init/migration.sql')).digest('hex'));
 d.prepare('INSERT INTO Episode (id,title) VALUES (1,?)').run('保留我的标题');d.prepare('INSERT INTO LocalState (id,data,updatedAt) VALUES (?,?,?)').run('local',JSON.stringify({sentinel:'旧记录',attempts:[{answer:'my answer'}]}),'2026-11-01');d.prepare('INSERT INTO LearningProgress (episodeId,seconds,completed,updatedAt) VALUES (1,?,?,?)').run(83.25,'["listen"]','2026-11-01');d.prepare('INSERT INTO UserSettings (id,data) VALUES (?,?)').run('local','{"minutes":35}');
 const before={state:d.prepare('SELECT * FROM LocalState').all(),progress:d.prepare('SELECT * FROM LearningProgress').all(),settings:d.prepare('SELECT * FROM UserSettings').all(),episode:d.prepare('SELECT * FROM Episode WHERE id=1').all()};d.close();
 for(let i=0;i<2;i++)execFileSync(process.execPath,['scripts/init-db.mjs'],{cwd:root,stdio:'pipe'});
 const next=new Database(join(root,'prisma/lab.db'));expect(next.prepare('SELECT * FROM LocalState').all()).toEqual(before.state);expect(next.prepare('SELECT * FROM LearningProgress').all()).toEqual(before.progress);expect(next.prepare('SELECT * FROM UserSettings').all()).toEqual(before.settings);expect(next.prepare('SELECT * FROM Episode WHERE id=1').all()).toEqual(before.episode);expect(next.prepare("SELECT name FROM sqlite_master WHERE name='MaterialStore'").get()).toBeTruthy();expect(next.pragma('foreign_key_check')).toEqual([]);next.close();
 const backups=readdirSync(join(root,'prisma/backups'));expect(backups).toHaveLength(1);const original=new Database(join(root,'prisma/backups',backups[0]));expect(original.prepare('SELECT * FROM LocalState').all()).toEqual(before.state);expect(original.prepare("SELECT name FROM sqlite_master WHERE name='MaterialStore'").get()).toBeUndefined();original.close();
});
