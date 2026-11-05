import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'George Lopez English Lab · 每天20分钟',description:'适合英语入门学习者的中文互动英语课堂'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
