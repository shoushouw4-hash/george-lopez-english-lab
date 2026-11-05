import {db} from '@/lib/db';
import {checkMaterials,emptyMaterials} from '@/lib/materials';
import type {Materials} from '@/lib/materials';
export async function GET(){
 const row=await db.materialStore.findUnique({where:{id:'local'}});
 return Response.json({revision:row?.revision??0,document:row?JSON.parse(row.data):emptyMaterials()});
}
export async function PUT(request:Request){
 const origin=request.headers.get('origin');
 try{if(origin&&new URL(origin).host!==request.headers.get('host'))return Response.json({error:'不允许跨站写入'},{status:403});}catch{return Response.json({error:'来源无效'},{status:403});}
 const text=await request.text();if(text.length>5_000_000)return Response.json({error:'教材备份超过 5MB，请分批导入'},{status:413});
 let document:Materials,revision:number;
 try{const body=JSON.parse(text);revision=body.revision;document=body.document;if(!Number.isInteger(revision)||revision<0)throw Error();checkMaterials(document);}catch{return Response.json({error:'教材数据格式、审核条件或字幕关联无效'},{status:400});}
 try{
 await db.$transaction(async tx=>{
 const row=await tx.materialStore.findUnique({where:{id:'local'}});
 if((row?.revision??0)!==revision)throw Error('CONFLICT');
 if(row){const previous=JSON.parse(row.data) as Materials;
 // A save can edit materials, but cannot silently discard original imports or learning history.
 for(const old of previous.sources){const next=document.sources.find(s=>s.id===old.id);if(!next||next.raw!==old.raw||next.filename!==old.filename||next.episodeId!==old.episodeId||old.cues.some(c=>{const n=next.cues.find(n=>n.id===c.id);return !n||n.originalText!==c.originalText||n.originalStart!==c.originalStart||n.originalEnd!==c.originalEnd;}))throw Error('LOSS');}
 for(const old of previous.lessons){if(!document.lessons.some(l=>l.id===old.id&&l.sourceId===old.sourceId))throw Error('LOSS');for(const e of old.entries){const owner=document.lessons.find(l=>l.entries.some(n=>n.id===e.id));if(owner&&owner.id!==old.id)throw Error('LOSS');}}
 for(const [id,p] of Object.entries(previous.progress)){const n=document.progress[id];if(!n||p.attempts.some((a,i)=>JSON.stringify(n.attempts[i])!==JSON.stringify(a))||p.done.some(s=>!n.done.includes(s))||Object.keys(p.reviews).some(key=>!n.reviews[key]))throw Error('LOSS');}
 const updated=await tx.materialStore.updateMany({where:{id:'local',revision},data:{revision:revision+1,data:JSON.stringify(document)}});if(updated.count!==1)throw Error('CONFLICT');
 }else await tx.materialStore.create({data:{id:'local',revision:1,data:JSON.stringify(document)}});
 for(const source of document.sources)await tx.materialSource.upsert({where:{id:source.id},create:{id:source.id,episodeId:source.episodeId,data:JSON.stringify(source)},update:{data:JSON.stringify(source)}});
 for(const lesson of document.lessons){await tx.materialLesson.upsert({where:{id:lesson.id},create:{id:lesson.id,sourceId:lesson.sourceId,status:lesson.status,data:JSON.stringify(lesson)},update:{status:lesson.status,data:JSON.stringify(lesson)}});
 await tx.materialEntry.deleteMany({where:{lessonId:lesson.id,id:{notIn:lesson.entries.map(e=>e.id)}}});
 for(const e of lesson.entries)await tx.materialEntry.upsert({where:{id:e.id},create:{id:e.id,lessonId:lesson.id,kind:e.kind,approved:e.approved,data:JSON.stringify(e)},update:{kind:e.kind,approved:e.approved,data:JSON.stringify(e)}});
 const p=document.progress[lesson.id];if(p)await tx.materialProgress.upsert({where:{lessonId:lesson.id},create:{lessonId:lesson.id,data:JSON.stringify(p)},update:{data:JSON.stringify(p)}});
 }
 },{timeout:20000});
 return Response.json({revision:revision+1});
 }catch(error){const message=error instanceof Error?error.message:'';
 if(message==='CONFLICT'||message.includes('Unique constraint'))return Response.json({error:'另一个页面已保存更新。请导出当前草稿，再刷新并合并，避免覆盖学习记录。'},{status:409});
 if(message==='LOSS')return Response.json({error:'保存会丢失原始字幕或已有学习记录，已拒绝。请导出草稿并合并。'},{status:409});
 console.error('教材保存失败',error);return Response.json({error:'数据库保存失败；当前草稿仍可导出。'},{status:500});
 }
}
