import {it,expect} from 'vitest';
import {practiceMode,utteranceOptions} from '../lib/subtitle-speech';
it('无视频时采用字幕语音练习，明确不是原剧原声',()=>{expect(practiceMode(false,true)).toEqual({mode:'speech',label:'合成语音示范 · 非原剧原声'});});
it('有视频时保留原有视频练习',()=>{expect(practiceMode(true,true).mode).toBe('video');});
it('没有语音功能时提供手动文字练习',()=>{expect(practiceMode(false,false).mode).toBe('text');});
it('使用实际字幕文本、美式英语与慢速，不编造目标句',()=>{expect(utteranceOptions('Can you help me?')).toEqual({text:'Can you help me?',lang:'en-US',rate:0.8});});
it('空白字幕不能生成朗读任务',()=>{expect(utteranceOptions('  ')).toBeNull();});
