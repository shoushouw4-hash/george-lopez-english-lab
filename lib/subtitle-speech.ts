export function practiceMode(hasVideo:boolean,canSpeak:boolean):{mode:'video'|'speech'|'text';label:string}{
 if(hasVideo)return {mode:'video',label:'本地视频原声'};
 return canSpeak?{mode:'speech',label:'合成语音示范 · 非原剧原声'}:{mode:'text',label:'文字练习模式 · 浏览器不支持朗读'};
}
export function utteranceOptions(text:string):{text:string;lang:string;rate:number}|null{
 return text.trim()?{text,lang:'en-US',rate:0.8}:null;
}
