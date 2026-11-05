import Database from 'better-sqlite3';
import {demo,words,grammar,questions} from '../lib/content.ts';
const db=new Database('prisma/lab.db');db.pragma('foreign_keys = ON');
const source='本站编写的教学示例，非原剧台词';
db.transaction(()=>{
 for(const [i,c] of (db.prepare('SELECT id FROM LocalState LIMIT 1').get()?[]:demo).entries())db.prepare('INSERT OR IGNORE INTO SubtitleCue (id,lessonId,position,start,end,text,translation,sourceType,source,original) VALUES (?,?,?,?,?,?,?,?,?,?)').run(c.id,'demo-1',i,c.start,c.end,c.text,c.translation,c.sourceType,c.source,c.text);
 for(const w of words)db.prepare('INSERT OR IGNORE INTO Vocabulary (id,lessonId,word,ipa,meaning,data) VALUES (?,?,?,?,?,?)').run(w.word,'demo-1',w.word,w.ipa,w.meaning,JSON.stringify(w));
 for(const [i,[text,meaning]] of [['be ready','准备好'],['help me','帮助我'],['want to learn','想学习']].entries())db.prepare('INSERT OR IGNORE INTO Phrase (id,lessonId,text,meaning,source) VALUES (?,?,?,?,?)').run('phrase-'+i,'demo-1',text,meaning,source);
 for(const [i,g] of grammar.entries()){db.prepare('INSERT OR IGNORE INTO GrammarPoint (id,lessonId,title,data,source) VALUES (?,?,?,?,?)').run('grammar-'+i,'demo-1',g[0],JSON.stringify(g),source);db.prepare('INSERT OR IGNORE INTO Exercise (id,lessonId,kind,data) VALUES (?,?,?,?)').run('grammar-'+i,'demo-1','grammar',JSON.stringify({prompt:g[7],answer:g[8],source}));}
 for(const q of [...questions,{id:'listen-choice',kind:'listening'},{id:'listen-dictation',kind:'dictation'}])db.prepare('INSERT OR IGNORE INTO Exercise (id,lessonId,kind,data) VALUES (?,?,?,?)').run(q.id,'demo-1',q.kind,JSON.stringify({...q,source}));
})();db.close();
