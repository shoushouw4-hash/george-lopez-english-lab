export type Cue = {id:string;start:number;end:number;text:string;translation:string;sourceType:'teaching_example'|'verified_dialogue'|'user_import';source:string};
export function timestamp(value:string):number {
 const m=value.trim().match(/^(?:(\d{2,}):)?(\d{2}):(\d{2})[.,](\d{3})$/);
 if(!m || +m[2]>59 || +m[3]>59) return NaN;
 return +(m[1]||0)*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
}
export function parseSubtitles(raw:string,source:string){
 const cues:Cue[]=[]; const warnings:string[]=[]; const seen=new Set<string>();
 const blocks=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().split(/\n\s*\n/);
 for(const block of blocks){
 const lines=block.split('\n'); if(/^(NOTE|STYLE|REGION)(?:\s|$)/.test(lines[0]))continue; if(/^WEBVTT(?:\s|$)/.test(lines[0])){lines.shift();if(!lines.some(x=>x.includes('-->')))continue;}
 const i=lines.findIndex(x=>x.includes('-->')); if(i<0){warnings.push('已跳过无时间轴的段落');continue;}
 const times=lines[i].split('-->'); const start=timestamp(times[0]); const end=timestamp(times[1].trim().split(/\s/)[0]);
 const text=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'').trim();
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||!text){warnings.push('已跳过无效时间戳或空字幕');continue;}
 const key=`${start}|${end}|${text}`;if(seen.has(key)){warnings.push('已跳过重复字幕');continue;}seen.add(key);
 cues.push({id:`import-${cues.length}`,start,end,text,translation:'',sourceType:'user_import',source:`用户导入：${source}（用户提供，未经本站独立核实）`});
 }
 cues.sort((a,b)=>a.start-b.start); for(let i=1;i<cues.length;i++)if(cues[i].start<cues[i-1].end)warnings.push(`字幕 ${i+1} 与前句时间重叠，请对照视频核查`); return {cues,warnings};
}
export function reviewNext(previous:number,known:boolean,now=Date.now()){const interval=known?(previous===0?1:Math.min(previous*2,30)):0;return {interval,due:now+(known?interval*86400000:600000),known};}
export const normalize=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu,'').trim().replace(/\s+/g,' ');
export function wordMatch(target:string,recognized:string){const a=normalize(target).split(' ');const b=new Set(normalize(recognized).split(' '));return Math.round(a.filter(w=>b.has(w)).length/a.length*100);}
export const clock=(n:number)=>`${Math.floor(Math.max(0,n)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,n)%60).toString().padStart(2,'0')}`;
