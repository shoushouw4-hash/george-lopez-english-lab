import {describe,it,expect} from 'vitest';
import {parseSubtitles,timestamp,reviewNext,wordMatch,normalize} from '../lib/learning';
describe('字幕导入',()=>{
 it('解析 SRT，保留来源和双行文本',()=>{const {cues}=parseSubtitles('1\r\n00:00:01,250 --> 00:00:03,500\r\nHello.\r\nHow are you?','mine.srt');expect(cues).toHaveLength(1);expect(cues[0]).toMatchObject({start:1.25,end:3.5,text:'Hello.\nHow are you?',sourceType:'user_import'});expect(cues[0].source).toContain('未经本站独立核实');});
 it('解析 VTT 标识和 cue settings',()=>{const {cues}=parseSubtitles('WEBVTT\n\nintro\n00:01.000 --> 00:03.000 align:start\n<b>Hello</b>','a.vtt');expect(cues[0].text).toBe('Hello');expect(cues[0].start).toBe(1);});
 it('拒绝逆向时间、非法时间、空文本并去重',()=>{const raw='1\n00:00:02,000 --> 00:00:01,000\nBad\n\n2\n00:90:00,000 --> 01:00:00,000\nBad\n\n3\n00:00:01,000 --> 00:00:02,000\nHi\n\n4\n00:00:01,000 --> 00:00:02,000\nHi';const r=parseSubtitles(raw,'a.srt');expect(r.cues).toHaveLength(1);expect(r.warnings).toHaveLength(3);});
 it('不接受任意格式时间',()=>{expect(timestamp('nonsense')).toBeNaN();expect(timestamp('01:02:03.125')).toBe(3723.125);});
});
describe('间隔复习和词汇匹配',()=>{
 it('认识后 1、2、4 天复习，最多 30 天',()=>{expect(reviewNext(0,true,0).due).toBe(86400000);expect(reviewNext(1,true,0).interval).toBe(2);expect(reviewNext(16,true,0).interval).toBe(30);});
 it('不认识 10 分钟后重学',()=>expect(reviewNext(8,false,0)).toEqual({interval:0,due:600000,known:false}));
 it('仅报告词汇命中，不冒充发音评分',()=>{expect(wordMatch('I am ready.','i AM ready')).toBe(100);expect(wordMatch('Can you help me?','help me')).toBe(50);});
});

it('中文选项不能因归一化而全部判对',()=>{expect(normalize('准备好的')).not.toBe(normalize('昨天'));});
