import {test,expect} from '@playwright/test';
import {emptyMaterials,makeLessons,sourceFrom,emptyProgress} from '../lib/materials';
import {parseSubtitles} from '../lib/learning';
const raw='1\n00:00:01,125 --> 00:00:04,000\nPlease bring your book and learn English with my family.\n\n2\n00:00:05,000 --> 00:00:08,000\nWe are ready to help today.';
test('用户字幕导入结构：校对、人工审核、七步学习、保存恢复且旧记录不变',async({page,request},info)=>{
 const old=await (await request.get('/api/state')).json();
 await page.goto('/episodes/1');await page.getByRole('button',{name:'教材工坊',exact:true}).click();
 await expect(page.getByRole('heading',{name:'第一集 · 教材工坊'})).toBeVisible();
 const filename=`owned-${info.project.name}-${Date.now()}.srt`;
 await page.getByLabel('导入教材字幕',{exact:true}).setInputFiles({name:filename,mimeType:'text/plain',buffer:Buffer.from(raw)});
 await expect(page.getByLabel('课程名称')).toHaveValue('第 1 天 · 20 分钟');
 await page.getByLabel('字幕开始秒数').fill('1.25');await page.getByLabel('教材中文解释').fill('请带上你的书，和我的家人一起学习英语。');
 await page.getByLabel('我已对照视频核实英文和时间，并检查中文解释').check();
 await page.locator('.material-timeline .cue').nth(1).click();await page.getByLabel('教材中文解释').fill('我们准备好今天帮忙了。');await page.getByLabel('我已对照视频核实英文和时间，并检查中文解释').check();
 const cards=page.locator('.material-entry');await expect(cards).toHaveCount(11);
 for(let i=1;i<=11;i++){
 if(i===7)await page.getByLabel(`条目内容 ${i}`,{exact:true}).fill('bring your book');
 if(i===8)await page.getByLabel(`条目内容 ${i}`,{exact:true}).fill('my family');
 if(i===9)await page.getByLabel(`条目内容 ${i}`,{exact:true}).fill('祈使句');
 if(i===10)await page.getByLabel(`条目内容 ${i}`,{exact:true}).fill('先慢读再自然连接');
 if(i===11)await page.getByLabel(`条目内容 ${i}`,{exact:true}).fill('拼写“书”这个单词');
 await page.getByLabel(`条目解释 ${i}`,{exact:true}).fill(i===11?'book':'人工测试解释');
 await page.getByLabel(`条目来源 ${i}`,{exact:true}).fill('人工对照测试视频；这是自动化测试材料');
 await page.getByLabel(`审核条目 ${i}`,{exact:true}).check();
 }
 await page.getByRole('button',{name:'审核通过此课',exact:true}).click();
 await page.getByRole('button',{name:'保存教材与进度',exact:true}).click();await expect(page.getByRole('status')).toContainText('已保存到数据库');
 await page.getByLabel('教材本地视频',{exact:true}).setInputFiles('e2e/fixtures/sample.webm');await expect.poll(()=>page.locator('.material-workbench video').evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
 await page.getByRole('button',{name:'进入课程学习',exact:true}).click();await page.locator('.material-timeline .cue').first().click();await page.locator('.material-workbench video').evaluate((v:HTMLVideoElement)=>v.pause());
 await page.getByRole('button',{name:'完成看剧，学习单词',exact:true}).click();for(let i=0;i<6;i++)await page.getByRole('button',{name:'认识了',exact:true}).nth(i).click();await page.getByRole('button',{name:'完成单词，学习语法',exact:true}).click();await page.getByRole('button',{name:'完成语法，开始听力',exact:true}).click();
 await page.getByLabel('教材听写答案').fill('Please bring your book and learn English with my family.');await page.getByRole('button',{name:'检查听写并继续',exact:true}).click();await page.getByRole('button',{name:'我已跟读，进入测验',exact:true}).click();
 await page.getByLabel('教材测验答案').fill('wrong');await page.getByRole('button',{name:'提交教材测验',exact:true}).click();await expect(page.getByRole('status')).toContainText('再试一次');await page.getByLabel('教材测验答案').fill('book');await page.getByRole('button',{name:'提交教材测验',exact:true}).click();await page.getByRole('button',{name:'完成本课复习',exact:true}).click();
 await expect(page.getByText(/本课已完成 7 \/ 7 步/)).toBeVisible();await page.getByRole('button',{name:'保存教材与进度',exact:true}).click();await expect(page.getByRole('status')).toContainText('已保存到数据库');
 const saved=await (await request.get('/api/materials')).json();const src=saved.document.sources.find((s:any)=>s.filename===filename);const lesson=saved.document.lessons.find((l:any)=>l.sourceId===src.id);expect(src.cues[0]).toMatchObject({start:1.25,originalStart:1.125,originalText:'Please bring your book and learn English with my family.'});expect(saved.document.progress[lesson.id].done).toHaveLength(7);expect(saved.document.progress[lesson.id].attempts).toHaveLength(2);
 await page.evaluate(()=>{localStorage.removeItem('english-lab-materials-draft-v1');});await page.reload();await page.getByRole('button',{name:'教材工坊',exact:true}).click();await page.getByLabel('选择小课程').selectOption(lesson.id);await page.getByRole('button',{name:'进入课程学习',exact:true}).click();await expect(page.getByText(/本课已完成 7 \/ 7 步/)).toBeVisible();await page.getByRole('button',{name:'返回人工编辑',exact:true}).click();await page.getByLabel('校对英文').fill('Please bring your book.');await expect(page.getByRole('button',{name:'审核通过此课',exact:true})).toBeDisabled();await page.getByRole('button',{name:'保存教材与进度',exact:true}).click();await expect(page.getByRole('status')).toContainText('已保存到数据库');
 const after=await (await request.get('/api/materials')).json();expect(after.document.progress[lesson.id].attempts).toHaveLength(2);expect(after.document.lessons.find((l:any)=>l.id===lesson.id).status).toBe('draft');expect(await (await request.get('/api/state')).json()).toEqual(old);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('教材接口阻止旧版本覆盖、丢弃原始字幕、伪造审核与跨站写入',async({request},info)=>{
 const loaded=await (await request.get('/api/materials')).json();const source=sourceFrom(parseSubtitles(raw,'api.srt').cues,raw,`api-${info.project.name}.srt`);const lessons=makeLessons(source);const document={...loaded.document,sources:[...loaded.document.sources,source],lessons:[...loaded.document.lessons,...lessons]};
 const first=await request.put('/api/materials',{data:{revision:loaded.revision,document}});expect(first.status()).toBe(200);
 const stale=await request.put('/api/materials',{data:{revision:loaded.revision,document}});expect(stale.status()).toBe(409);
 const removed=await request.put('/api/materials',{data:{revision:loaded.revision+1,document:emptyMaterials()}});expect(removed.status()).toBe(409);
 const altered=structuredClone(document);altered.sources.find((s:any)=>s.id===source.id).raw='silently changed original';expect((await request.put('/api/materials',{data:{revision:loaded.revision+1,document:altered}})).status()).toBe(409);
 const fake=structuredClone(document);fake.lessons.find((l:any)=>l.id===lessons[0].id).status='approved';expect((await request.put('/api/materials',{data:{revision:loaded.revision+1,document:fake}})).status()).toBe(400);
 expect((await request.put('/api/materials',{headers:{origin:'https://other.example'},data:{revision:loaded.revision+1,document}})).status()).toBe(403);
 const withRecord=structuredClone(document);const lesson=lessons[0];withRecord.progress[lesson.id]={...emptyProgress(),done:['看剧'],attempts:[{entryId:lesson.entries.find(e=>e.kind==='exercise')!.id,answer:'keep me',correct:false,date:new Date().toISOString()}]};expect((await request.put('/api/materials',{data:{revision:loaded.revision+1,document:withRecord}})).status()).toBe(200);
 expect((await request.put('/api/materials',{data:{revision:loaded.revision+2,document}})).status()).toBe(409);
});
