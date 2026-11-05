import type {Cue} from './learning';
export const demo:Cue[]=[['I am ready.','我准备好了。'],['This is my family.','这是我的家人。'],['I want to learn English.','我想学英语。'],['Can you help me?','你能帮助我吗？']].map(([text,translation],i)=>({id:`demo-${i}`,start:i*4,end:i*4+3.5,text,translation,sourceType:'teaching_example',source:'本站教学示例；时间为演示定位，非原剧时间戳'}));
export const words=[
 {word:'ready',ipa:'/ˈrɛdi/',pos:'adj.',meaning:'准备好的',example:'I am ready.',zh:'我准备好了。',pair:'be ready',source:'Cambridge Dictionary 美式音标（宽式转写）'},
 {word:'family',ipa:'/ˈfæməli/',pos:'n.',meaning:'家人；家庭',example:'This is my family.',zh:'这是我的家人。',pair:'my family',source:'Cambridge Dictionary 美式音标（宽式转写）'},
 {word:'learn',ipa:'/lɝːn/',pos:'v.',meaning:'学习',example:'I want to learn English.',zh:'我想学英语。',pair:'learn English',source:'Cambridge Dictionary 美式音标'},
 {word:'help',ipa:'/hɛlp/',pos:'v.',meaning:'帮助',example:'Can you help me?',zh:'你能帮助我吗？',pair:'help me',source:'Cambridge Dictionary 美式音标（宽式转写）'},
 {word:'want',ipa:'/wɑːnt/',pos:'v.',meaning:'想要',example:'I want to read.',zh:'我想读书。',pair:'want to do',source:'Cambridge Dictionary 美式音标'},
 {word:'can',ipa:'/kæn/',pos:'modal v.',meaning:'能；可以',example:'I can read.',zh:'我会读书。',pair:'can help',source:'Cambridge Dictionary 美式音标'}];
export const grammar=[
 ['be 动词','am / is / are 表示“是”或状态。','I + am；he/she/it + is；you/we/they + are','I am ready.','我准备好了。','I am a student.','不能说 I is ready.','I ___ ready.','am'],
 ['一般现在时','表达习惯或经常发生的事。','主语 + 动词；第三人称单数动词加 s','I learn English.','我学英语。','She reads every day.','She read 应改为 She reads。','She ___ every day.','reads'],
 ['一般过去时','表达过去发生的事。','主语 + 动词过去式','I helped my family.','我帮助了家人。','I watched a video yesterday.','过去时间用过去式。','I ___ a video yesterday.','watched'],
 ['一般疑问句','把 be 动词或助动词放在句首提问。','Be / Do / Does + 主语 … ?','Are you ready?','你准备好了吗？','Do you like English?','Does 后用动词原形。','___ you ready?','Are'],
 ['特殊疑问句','用 what、who、where 等询问信息。','疑问词 + 一般疑问句','What is this?','这是什么？','Where do you live?','疑问词之后注意语序。','___ is this?（什么）','What'],
 ['否定句','用 not 表示否定。','be + not / do not + 动词原形','I am not ready.','我还没准备好。','I do not know.','不能说 I not am ready.','I am ___ ready.','not'],
 ['want to + 动词原形','表示“想做某事”。','主语 + want to + 动词原形','I want to learn English.','我想学英语。','I want to read.','to 后不要加 -ing。','I want ___ learn.','to'],
 ["can / can’t",'表达能力，can 后接动词原形。','主语 + can / cannot + 动词原形','Can you help me?','你能帮助我吗？','I can swim.','不能说 can swims。','I can ___ .（游泳）','swim'],
 ['have / has','表示拥有；第三人称单数用 has。','I/you/we/they + have；he/she/it + has','I have a book.','我有一本书。','She has a book.','不能说 She have。','She ___ a book.','has'],
 ['口语省略与连读','I am 可缩写为 I’m；连读不改变基本词义。','I am → I’m；辅音 + 元音可自然连接',"I’m ready.",'我准备好了。','Can you help me?','先慢读清楚，再练习自然连接。',"I am 的缩写是 ___ .","I'm"]
];
export const questions=[{id:'meaning',kind:'choice',prompt:'ready 的意思是？',options:['准备好的','昨天','桌子'],answer:'准备好的'}, {id:'be',kind:'fill',prompt:'I ___ ready.',answer:'am'}, {id:'match',kind:'match',prompt:'选择 family 对应的中文',options:['学习','家人；家庭','帮助'],answer:'家人；家庭'}, {id:'spell',kind:'spell',prompt:'拼写“帮助”这个英文单词',answer:'help'}];
