import type {Cue} from './learning';
import {normalize,parseSubtitles} from './learning';
export type MaterialKind='vocabulary'|'phrase'|'grammar'|'pronunciation'|'exercise';
export type SourceCue=Cue & {originalText:string;originalStart:number;originalEnd:number;reviewed:boolean};
export type MaterialSource={id:string;episodeId:number;filename:string;raw:string;importedAt:string;cues:SourceCue[]};
export type MaterialEntry={id:string;kind:MaterialKind;cueId:string;text:string;meaning:string;ipa:string;reference:string;approved:boolean};
export type MaterialLesson={id:string;sourceId:string;title:string;minutes:20;cueIds:string[];status:'draft'|'approved';entries:MaterialEntry[]};
export const stages=['看剧','学单词','学语法','听力','跟读','测验','复习'] as const;
export type MaterialStage=typeof stages[number];
export type MaterialProgress={done:MaterialStage[];attempts:{entryId:string;answer:string;correct:boolean;date:string}[];reviews:Record<string,{interval:number;due:number;known:boolean}>};
export type Materials={version:1;sources:MaterialSource[];lessons:MaterialLesson[];progress:Record<string,MaterialProgress>};
export const emptyMaterials=():Materials=>({version:1,sources:[],lessons:[],progress:{}});
export const emptyProgress=():MaterialProgress=>({done:[],attempts:[],reviews:{}});
const id=()=>crypto.randomUUID();
export function sourceFrom(cues:Cue[],raw:string,filename:string,episodeId=1):MaterialSource {
 const originals=parseSubtitles(raw,filename).cues;
 return {id:id(),episodeId,filename,raw,importedAt:new Date().toISOString(),cues:cues.map(c=>{const original=originals.find(o=>o.id===c.id)??c;return {...c,originalText:original.text,originalStart:original.start,originalEnd:original.end,reviewed:false};})};
}
export function timingIssues(cues:Pick<Cue,'id'|'start'|'end'>[],duration?:number){
 const issues:{cueId:string;message:string;fatal:boolean}[]=[];
 const sorted=[...cues].sort((a,b)=>a.start-b.start);
 for(let i=0;i<sorted.length;i++){const c=sorted[i];
 if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start)issues.push({cueId:c.id,message:'开始时间必须非负，结束时间必须晚于开始时间',fatal:true});
 if(duration!==undefined&&c.end>duration)issues.push({cueId:c.id,message:'字幕结束时间超过视频时长',fatal:false});
 if(i>0&&c.start<sorted[i-1].end)issues.push({cueId:c.id,message:'与上一条字幕重叠，请对照视频核查',fatal:false});
 }return issues;
}
export function makeLessons(source:MaterialSource):MaterialLesson[]{
 const groups:SourceCue[][]=[];
 for(const cue of [...source.cues].sort((a,b)=>a.start-b.start)){
 const last=groups.at(-1);if(!last||last.length>=12||cue.end-last[0].start>120)groups.push([cue]);else last.push(cue);
 }
 return groups.map((cues,i)=>{
 const entries:MaterialEntry[]=[];const seen=new Set<string>();
 for(const cue of cues)for(const token of cue.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)??[]){
 const word=token.toLowerCase();if(seen.has(word)||word.length<3||['the','and','that','this','you','are','was','for','with','not','but','have','has','can'].includes(word))continue;seen.add(word);
 if(entries.filter(e=>e.kind==='vocabulary').length<6)entries.push({id:id(),kind:'vocabulary',cueId:cue.id,text:word,meaning:'',ipa:'',reference:'字幕词形候选；需人工核查词义与词形',approved:false});
 }
 for(const kind of ['phrase','phrase','grammar','pronunciation','exercise'] as MaterialKind[])entries.push({id:id(),kind,cueId:cues[0].id,text:'',meaning:'',ipa:'',reference:'',approved:false});
 return {id:id(),sourceId:source.id,title:`第 ${i+1} 天 · 20 分钟`,minutes:20,cueIds:cues.map(c=>c.id),status:'draft',entries};
 });
}
export function lessonIssues(lesson:MaterialLesson,source:MaterialSource):string[]{
 const issues:string[]=[];const cues=source.cues.filter(c=>lesson.cueIds.includes(c.id));
 if(cues.length!==lesson.cueIds.length||!cues.length)issues.push('字幕关联不完整');
 if(cues.some(c=>!c.reviewed))issues.push('请逐句对照视频核实英文与时间');
 if(cues.some(c=>!c.translation.trim()))issues.push('请补全每句中文解释');
 if(timingIssues(cues).some(i=>i.fatal))issues.push('时间戳无效');
 const count=(kind:MaterialKind)=>lesson.entries.filter(e=>e.kind===kind).length;
 if(count('vocabulary')<5||count('vocabulary')>8)issues.push('每课需要 5～8 个单词');
 if(count('phrase')<2||count('phrase')>4)issues.push('每课需要 2～4 个短语');
 if(count('grammar')!==1)issues.push('每课需要恰好 1 个语法点');
 if(!count('pronunciation'))issues.push('请添加发音提示');
 if(!count('exercise'))issues.push('请添加随堂测验（题目和标准答案）');
 for(const entry of lesson.entries){const cue=cues.find(c=>c.id===entry.cueId);
 if(!cue){issues.push('教学条目必须关联本课字幕');continue;}
 if(!entry.text.trim()||!entry.meaning.trim()||!entry.reference.trim()||!entry.approved)issues.push('教学条目须补全内容、来源并逐条人工审核');
 if(['vocabulary','phrase'].includes(entry.kind)&&!(` ${normalize(cue.text)} `).includes(` ${normalize(entry.text)} `))issues.push('单词或短语必须能在关联字幕中找到');
 if(entry.ipa.trim()&&!/https?:\/\//.test(entry.reference))issues.push('填写 IPA 时须提供可查证的词典链接');
 }
 return [...new Set(issues)];
}
export function changeCue(doc:Materials,sourceId:string,cueId:string,patch:Partial<Pick<SourceCue,'text'|'translation'|'start'|'end'|'reviewed'>>):Materials{
 const contentChange=Object.keys(patch).some(k=>k!=='reviewed');
 return {...doc,sources:doc.sources.map(s=>s.id!==sourceId?s:{...s,cues:s.cues.map(c=>c.id!==cueId?c:{...c,...patch,reviewed:contentChange?false:(patch.reviewed??c.reviewed)})}),lessons:doc.lessons.map(l=>l.sourceId!==sourceId||!l.cueIds.includes(cueId)?l:{...l,status:'draft',entries:l.entries.map(e=>e.cueId===cueId?{...e,approved:false}:e)})};
}
export function checkMaterials(value:unknown):asserts value is Materials{
 const d=value as Materials;const fail=()=>{throw Error('教材数据格式或来源关联无效');};
 const str=(v:unknown)=>typeof v==='string';const finite=(n:unknown)=>typeof n==='number'&&Number.isFinite(n);
 if(!d||d.version!==1||!Array.isArray(d.sources)||!Array.isArray(d.lessons)||!d.progress||typeof d.progress!=='object'||Array.isArray(d.progress))fail();
 const sourceIds=new Set<string>(),lessonIds=new Set<string>(),entryIds=new Set<string>();
 for(const s of d.sources){if(!s||!str(s.id)||!s.id||sourceIds.has(s.id)||!Number.isInteger(s.episodeId)||s.episodeId<1||s.episodeId>24||!str(s.filename)||!str(s.raw)||!str(s.importedAt)||!Number.isFinite(Date.parse(s.importedAt))||!Array.isArray(s.cues)||!s.cues.length)fail();sourceIds.add(s.id);const cueIds=new Set<string>();
 for(const c of s.cues){if(!c||!str(c.id)||!c.id||cueIds.has(c.id)||!str(c.text)||!c.text.trim()||!str(c.translation)||!str(c.originalText)||!str(c.source)||!['teaching_example','user_import','verified_dialogue'].includes(c.sourceType)||!finite(c.start)||!finite(c.end)||c.start<0||c.end<=c.start||!finite(c.originalStart)||!finite(c.originalEnd)||c.originalStart<0||c.originalEnd<=c.originalStart||typeof c.reviewed!=='boolean')fail();cueIds.add(c.id);}}
 for(const l of d.lessons){const s=d.sources.find(s=>s.id===l?.sourceId);if(!l||!str(l.id)||!l.id||lessonIds.has(l.id)||!s||!str(l.title)||l.minutes!==20||!['draft','approved'].includes(l.status)||!Array.isArray(l.cueIds)||!l.cueIds.length||new Set(l.cueIds).size!==l.cueIds.length||l.cueIds.some(id=>!s.cues.some(c=>c.id===id))||!Array.isArray(l.entries))fail();lessonIds.add(l.id);
 for(const e of l.entries){if(!e||!str(e.id)||!e.id||entryIds.has(e.id)||!['vocabulary','phrase','grammar','pronunciation','exercise'].includes(e.kind)||!l.cueIds.includes(e.cueId)||![e.text,e.meaning,e.ipa,e.reference].every(str)||typeof e.approved!=='boolean')fail();entryIds.add(e.id);}
 if(l.status==='approved'&&lessonIssues(l,s!).length)fail();}
 for(const [lessonId,p]of Object.entries(d.progress)){const l=d.lessons.find(l=>l.id===lessonId);if(!l||!p||!Array.isArray(p.done)||p.done.some(s=>!stages.includes(s))||!Array.isArray(p.attempts)||!p.reviews||typeof p.reviews!=='object'||Array.isArray(p.reviews))fail();
 for(const a of p.attempts)if(!a||!l!.entries.some(e=>e.id===a.entryId&&e.kind==='exercise')||!str(a.answer)||typeof a.correct!=='boolean'||!str(a.date)||!Number.isFinite(Date.parse(a.date)))fail();
 for(const [id,r] of Object.entries(p.reviews))if(!l!.entries.some(e=>e.id===id&&e.kind==='vocabulary')||!r||!Number.isInteger(r.interval)||r.interval<0||r.interval>30||!finite(r.due)||typeof r.known!=='boolean')fail();
 }
}
