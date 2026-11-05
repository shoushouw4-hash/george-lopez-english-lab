import {db} from '@/lib/db';
import {words} from '@/lib/content';
export async function GET(){const row=await db.localState.findUnique({where:{id:'local'}});return Response.json(row?JSON.parse(row.data):null);}
export async function PUT(request:Request){
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==request.headers.get('host'))return Response.json({error:'不允许跨站写入'},{status:403});
 const text=await request.text();if(text.length>5_000_000)return Response.json({error:'数据超过 5MB'},{status:413});
 let data;
 try{data=JSON.parse(text);if(!data||data.version!==1||!Array.isArray(data.cues)||!Array.isArray(data.attempts)||!data.settings||!Array.isArray(data.done)||!data.reviews||!Number.isInteger(data.episode)||data.episode<1||data.episode>24||!Number.isFinite(data.seconds)||data.seconds<0)throw Error();
 for(const c of data.cues)if(typeof c.id!=='string'||typeof c.text!=='string'||typeof c.translation!=='string'||typeof c.source!=='string'||!['verified_dialogue','teaching_example','user_import'].includes(c.sourceType)||!Number.isFinite(c.start)||c.start<0||!Number.isFinite(c.end)||c.end<=c.start)throw Error();
 for(const a of data.attempts)if(typeof a.id!=='string'||typeof a.answer!=='string'||typeof a.correct!=='boolean'||!Number.isFinite(Date.parse(a.date)))throw Error();
 for(const r of Object.values(data.reviews) as {interval:number;due:number;known:boolean}[])if(!Number.isInteger(r.interval)||r.interval<0||r.interval>30||!Number.isFinite(r.due)||typeof r.known!=='boolean')throw Error();
 }catch{return Response.json({error:'数据格式无效'},{status:400});}
 try{
 await db.$transaction(async tx=>{
 await tx.localState.upsert({where:{id:'local'},create:{id:'local',data:text},update:{data:text}});
 await tx.userSettings.upsert({where:{id:'local'},create:{id:'local',data:JSON.stringify(data.settings)},update:{data:JSON.stringify(data.settings)}});
 await tx.learningProgress.upsert({where:{episodeId:data.episode},create:{episodeId:data.episode,seconds:data.seconds,completed:JSON.stringify(data.done)},update:{seconds:data.seconds,completed:JSON.stringify(data.done)}});
 await tx.subtitleCue.deleteMany({where:{lessonId:'demo-1'}});
 if(data.cues.length)await tx.subtitleCue.createMany({data:data.cues.map((c:any,i:number)=>({id:c.id,lessonId:'demo-1',position:i,start:c.start,end:c.end,text:c.text,translation:c.translation,sourceType:c.sourceType,source:c.source,original:c.text}))});
 await tx.exerciseAttempt.deleteMany();
 const exercises=new Set((await tx.exercise.findMany({select:{id:true}})).map(x=>x.id));
 const attempts=data.attempts.filter((a:any)=>exercises.has(a.id));
 if(attempts.length)await tx.exerciseAttempt.createMany({data:attempts.map((a:any)=>({exerciseId:a.id,answer:a.answer,correct:a.correct,createdAt:new Date(a.date)}))});
 await tx.reviewSchedule.deleteMany();
 for(const w of words){const r=data.reviews[w.word];if(r)await tx.reviewSchedule.create({data:{vocabularyId:w.word,interval:r.interval,dueAt:new Date(r.due),known:r.known}});}
 });return Response.json({ok:true});
 }catch(e){console.error('保存学习状态失败',e);return Response.json({error:'数据库保存失败'},{status:500});}
}
