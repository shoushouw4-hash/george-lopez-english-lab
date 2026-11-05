import {test,expect} from '@playwright/test';
import {demo} from '../lib/content';
test.beforeEach(async({request})=>{const r=await request.put('/api/state',{data:{version:1,cues:demo,raw:'',source:'教学演示',episode:1,seconds:0,offset:0,favorites:[],reviews:{},attempts:[],done:[],days:[],settings:{minutes:20,level:'初一入门',subtitles:'双语',speed:1,autoplay:false}}});expect(r.ok()).toBeTruthy();});
test('目录、字幕导入编辑、学习、测试及刷新恢复',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'你好，英语探索者'})).toBeVisible();
 await page.getByRole('button',{name:'课程目录',exact:true}).click();await expect(page.locator('.episode-card')).toHaveCount(24);
 await page.getByRole('button',{name:'进入学习',exact:true}).click();await expect(page.getByText('字幕时间轴',{exact:true})).toBeVisible();
 page.on('dialog',d=>d.accept());
 await page.getByLabel('导入字幕',{exact:true}).setInputFiles({name:'lesson.srt',mimeType:'text/plain',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nI am ready.\n\n2\n00:00:02,000 --> 00:00:04,000\nCan you help me?')});
 await expect(page.locator('.cue')).toHaveCount(2);await page.locator('.cue').nth(1).click();await page.getByLabel('中文解释',{exact:true}).fill('你能帮助我吗？');
 await page.getByRole('button',{name:'单词学习',exact:true}).click();await page.getByRole('button',{name:'认识',exact:true}).first().click();
 await page.getByRole('button',{name:'口语跟读',exact:true}).click();await page.getByRole('button',{name:'我已完成手动 / 录音跟读'}).click();
 await page.getByRole('button',{name:'复习测试',exact:true}).click();
 for(const answer of ['准备好的','am','家人；家庭','help']){if(['am','help'].includes(answer))await page.getByLabel('测试答案').fill(answer);else await page.getByRole('button',{name:answer,exact:true}).click();await page.getByRole('button',{name:'检查并继续'}).click();}
 await expect(page.getByText('累计作答 4 次 · 正确 4 次')).toBeVisible();
 await expect.poll(async()=>{const saved=await page.request.get('/api/state');return (await saved.json()).attempts.length;}).toBe(4);
 await page.reload();await page.getByRole('button',{name:'视频精学',exact:true}).click();await expect(page.locator('.cue')).toHaveCount(2);await expect(page.locator('.cue').nth(1)).toContainText('你能帮助我吗？');
 await page.getByRole('button',{name:'学习首页',exact:true}).click();await expect(page.locator('.stat').nth(1)).toContainText('1 个');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('本地视频可播放、字幕跳转、偏移和 AB 循环',async({page})=>{
 await page.goto('/episodes/1');await expect(page.locator('.cue')).toHaveCount(4);
 await page.getByLabel('导入本地视频',{exact:true}).setInputFiles('e2e/fixtures/sample.webm');
 const video=page.locator('video');await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
 await page.locator('.cue').nth(2).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThanOrEqual(8);
 await page.getByRole('button',{name:'播放 / 暂停'}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
 await page.getByRole('button',{name:'播放 / 暂停'}).click();await page.getByLabel('字幕偏移').fill('1');await page.locator('.cue').nth(1).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThanOrEqual(5);
 await page.getByRole('button',{name:'设 A',exact:true}).click();await video.evaluate((v:HTMLVideoElement)=>{v.currentTime=6;});await page.getByRole('button',{name:'设 B 并循环'}).click();await video.evaluate((v:HTMLVideoElement)=>{v.currentTime=7;v.dispatchEvent(new Event('timeupdate'));});await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeLessThan(6);
 await page.getByRole('button',{name:'取消循环'}).click();await video.evaluate((v:HTMLVideoElement)=>{v.currentTime=10;v.dispatchEvent(new Event('timeupdate'));});await page.waitForTimeout(1000);await page.reload();await page.getByLabel('导入本地视频',{exact:true}).setInputFiles('e2e/fixtures/sample.webm');await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThanOrEqual(9);
});
test('听力语法、错题重做、备份和重置',async({page,request},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'听力训练',exact:true}).click();
 await page.getByRole('button',{name:'Good night, everyone.',exact:true}).click();await expect(page.getByRole('status')).toContainText('再试一次');
 await page.getByLabel('听写答案').fill('I AM READY');await page.getByRole('button',{name:'提交听写',exact:true}).click();await expect(page.getByRole('status')).toContainText('回答正确');
 await page.getByRole('button',{name:'语法课堂',exact:true}).click();await page.getByLabel('语法答案').fill('am');await page.getByRole('button',{name:'检查答案',exact:true}).click();
 await page.getByRole('button',{name:'复习测试',exact:true}).click();await page.getByRole('button',{name:'昨天',exact:true}).click();await page.getByRole('button',{name:'检查并继续'}).click();await expect(page.getByRole('status')).toContainText('再试一次');await expect(page.locator('.mistake')).toHaveCount(2);
 await page.getByRole('button',{name:'学习设置',exact:true}).click();const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'导出学习数据'}).click();const download=await downloaded;expect(download.suggestedFilename()).toBe('english-lab-backup.json');
 await expect.poll(async()=>((await (await request.get('/api/state')).json()).attempts.length)).toBe(4);const backup=await (await request.get('/api/state')).json();
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'重置学习记录',exact:true}).click();await expect.poll(async()=>((await (await request.get('/api/state')).json()).attempts.length)).toBe(0);
 await page.getByLabel('导入备份',{exact:true}).setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await expect(page.getByRole('status')).toContainText('备份已恢复');
 await expect.poll(async()=>((await (await request.get('/api/state')).json()).attempts.length)).toBe(4);
 await page.evaluate(()=>localStorage.clear());await page.reload();await page.getByRole('button',{name:'复习测试',exact:true}).click();await expect(page.getByText('累计作答 4 次 · 正确 2 次')).toBeVisible();
 await page.getByRole('button',{name:'学习首页',exact:true}).click();await page.screenshot({path:`/tmp/english-lab-${info.project.name}.png`,fullPage:true});
});
test('数据库接口拒绝跨站写入与损坏备份',async({request})=>{
 const cross=await request.put('/api/state',{headers:{origin:'https://evil.example'},data:{}});expect(cross.status()).toBe(403);
 const invalid=await request.put('/api/state',{data:{version:1,cues:[],attempts:[]}});expect(invalid.status()).toBe(400);
});
