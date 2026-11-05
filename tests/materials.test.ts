import {describe,it,expect} from 'vitest';
import {changeCue,checkMaterials,emptyMaterials,emptyProgress,lessonIssues,makeLessons,sourceFrom,timingIssues} from '../lib/materials';
import {parseSubtitles} from '../lib/learning';
function setup(){const cues=parseSubtitles('1\n00:00:01,000 --> 00:00:04,000\nPlease bring your book and learn English with my family.\n\n2\n00:00:05,000 --> 00:00:08,000\nWe are ready to help today.','owned.srt').cues;const source=sourceFrom(cues,'original raw','owned.srt');return {source,lessons:makeLessons(source)};}
function reviewed(){const {source,lessons}=setup();source.cues.forEach(c=>{c.reviewed=true;c.translation='人工填写的解释';});const lesson=lessons[0];lesson.entries.forEach(e=>{e.meaning='人工解释';e.reference='人工对照本视频';e.approved=true;if(e.kind==='phrase')e.text='bring your book';else if(e.kind==='grammar')e.text='一般现在时';else if(e.kind==='pronunciation')e.text='慢读与连读';else if(e.kind==='exercise'){e.text='拼写书本这个词';e.meaning='book';}});return {source,lesson};}
describe('基于字幕的教材结构与审核',()=>{
 it('候选单词逐个关联字幕，不生成解释或 IPA',()=>{const {lessons}=setup();const vocab=lessons[0].entries.filter(e=>e.kind==='vocabulary');expect(vocab).toHaveLength(6);expect(vocab.every(e=>e.cueId==='import-0'&&!e.meaning&&!e.ipa&&!e.approved)).toBe(true);});
 it('每课最多12句、约2分钟视频，20分钟学习；剩余不足不造词',()=>{const {source}=setup();source.cues=Array.from({length:25},(_,i)=>({...source.cues[0],id:String(i),start:i*12,end:i*12+3}));const lessons=makeLessons(source);expect(lessons.length).toBeGreaterThan(1);expect(lessons.every(l=>l.cueIds.length<=12&&l.minutes===20&&l.status==='draft')).toBe(true);expect(lessons.flatMap(l=>l.cueIds)).toHaveLength(25);});
 it('无真实字幕不升级示例来源，不伪造英文内容',()=>{const {source}=setup();source.cues[0].sourceType='teaching_example';const l=makeLessons(source)[0];expect(l.status).toBe('draft');expect(source.cues[0].sourceType).toBe('teaching_example');expect(l.entries.filter(e=>e.kind==='phrase').every(e=>e.text==='')).toBe(true);});
 it('空草稿不可审核，完整人工内容可审核',()=>{const {source,lessons}=setup();expect(lessonIssues(lessons[0],source)).toContain('请补全每句中文解释');const r=reviewed();expect(lessonIssues(r.lesson,r.source)).toEqual([]);});
 it('拒绝不足5词、无来源的短语和不带词典链接的 IPA',()=>{const {source,lesson}=reviewed();lesson.entries=lesson.entries.filter(e=>e.kind!=='vocabulary'||['please','bring'].includes(e.text));expect(lessonIssues(lesson,source)).toContain('每课需要 5～8 个单词');lesson.entries.find(e=>e.kind==='phrase')!.text='made up phrase';expect(lessonIssues(lesson,source)).toContain('单词或短语必须能在关联字幕中找到');const word=lesson.entries.find(e=>e.kind==='vocabulary')!;word.ipa='/x/';expect(lessonIssues(lesson,source)).toContain('填写 IPA 时须提供可查证的词典链接');});
 it('改动字幕使审核失效，保留原文和历史学习结果',()=>{const {source,lesson}=reviewed();lesson.status='approved';const progress=emptyProgress();progress.done=['看剧'];const doc={version:1 as const,sources:[source],lessons:[lesson],progress:{[lesson.id]:progress}};const changed=changeCue(doc,source.id,source.cues[0].id,{start:2,text:'Edited text.'});expect(changed.sources[0].cues[0]).toMatchObject({originalText:source.cues[0].text,originalStart:1,start:2,reviewed:false});expect(changed.lessons[0].status).toBe('draft');expect(changed.lessons[0].entries.filter(e=>e.cueId===source.cues[0].id).every(e=>!e.approved)).toBe(true);expect(changed.progress).toEqual(doc.progress);});
 it('检测非法时间、重叠和视频越界',()=>{expect(timingIssues([{id:'a',start:-1,end:2},{id:'b',start:1,end:9}],5).map(i=>i.message)).toHaveLength(3);});
 it('拒绝伪造字幕关联与绕过审核的已发布课程',()=>{const {source,lessons}=setup();const d={...emptyMaterials(),sources:[source],lessons};expect(()=>checkMaterials(d)).not.toThrow();d.lessons[0].status='approved';expect(()=>checkMaterials(d)).toThrow();d.lessons[0].status='draft';d.lessons[0].entries[0].cueId='missing';expect(()=>checkMaterials(d)).toThrow();});
 it('拒绝空白题目标准答案、NaN时间和无效记录',()=>{const {source,lesson}=reviewed();const d={...emptyMaterials(),sources:[source],lessons:[lesson]};lesson.status='approved';expect(()=>checkMaterials(d)).not.toThrow();lesson.entries.find(e=>e.kind==='exercise')!.meaning='';expect(()=>checkMaterials(d)).toThrow();source.cues[0].end=NaN;expect(()=>checkMaterials(d)).toThrow();});
 it('SRT/VTT 重叠提示、毫秒保留、空文件不产生课程',()=>{const r=parseSubtitles('WEBVTT\n00:00:01.125 --> 00:00:03.500\nHello\n\n00:00:02.000 --> 00:00:04.000\nWorld','a.vtt');expect(r.cues[0].start).toBe(1.125);expect(r.warnings.some(w=>w.includes('重叠'))).toBe(true);expect(makeLessons({...setup().source,cues:[]})).toEqual([]);});
});

it('采用已编辑课堂字幕时，从原始 SRT 恢复原文与原始时间',()=>{
 const raw='1\n00:00:01,125 --> 00:00:04,000\nOriginal subtitle.';
 const cues=parseSubtitles(raw,'first.srt').cues;cues[0].text='Edited subtitle.';cues[0].start=2;
 const source=sourceFrom(cues,raw,'first.srt');expect(source.cues[0]).toMatchObject({text:'Edited subtitle.',start:2,originalText:'Original subtitle.',originalStart:1.125});
});
it('单词审核按完整词匹配，不能把 ready 作为 read 的出处',()=>{
 const {source,lesson}=reviewed();const entry=lesson.entries.find(e=>e.kind==='vocabulary')!;entry.text='read';entry.cueId=source.cues[1].id;
 expect(lessonIssues(lesson,source)).toContain('单词或短语必须能在关联字幕中找到');
});
