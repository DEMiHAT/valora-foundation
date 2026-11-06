"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Send, X } from "lucide-react";

const topics = [
  {label:"About Valora", words:["about","foundation","mission","values"], answer:"Valora Foundation creates learning and leadership opportunities for young people, guided by knowledge, growth and empathy.", href:"/about", action:"About the foundation"},
  {label:"Initiatives", words:["initiative","programme","program","learning","leadership","community"], answer:"Valora is developing learning, leadership and community programmes for young people.", href:"/initiatives", action:"Explore initiatives"},
  {label:"Volunteer", words:["volunteer","help","join","card","volunteer id"], answer:"Register online, choose how you would like to contribute and receive a secure digital volunteer card by email.", href:"/volunteer", action:"Volunteer with Valora"},
  {label:"Schools", words:["school","teacher","student","institution"], answer:"Schools and institutions can contact Valora to discuss future learning and leadership opportunities.", href:"/contact", action:"Contact the team"},
  {label:"Partners", words:["partner","sponsor","organisation","organization","support","collaborate"], answer:"Organisations can work with Valora through programme support, expertise, sponsorship or community collaboration.", href:"/partners", action:"Partnership options"},
  {label:"Contact", words:["contact","email","instagram","talk","question"], answer:"Use the contact page to reach the Valora team or connect through Instagram.", href:"/contact", action:"Contact Valora"},
];
export function HelpAssistant(){
  const [open,setOpen]=useState(false),[active,setActive]=useState<(typeof topics)[number]|null>(null),[query,setQuery]=useState("");
  const [asked,setAsked]=useState(false);
  const launcher=useRef<HTMLButtonElement>(null), input=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(open)input.current?.focus();},[open]);
  function close(){setOpen(false);launcher.current?.focus();}
  function ask(text:string){
    if(!text.trim())return;
    setAsked(true);
    setQuery(text);
    const lower=text.toLowerCase();
    const exact=topics.find(t=>t.label.toLowerCase()===lower);
    const ranked=topics.map(topic=>({topic,score:topic.words.filter(word=>lower.includes(word)).reduce((sum,word)=>sum+word.length,0)})).sort((a,b)=>b.score-a.score);
    setActive(exact??(ranked[0]?.score?ranked[0].topic:null));
  }
  return <div className="help-assistant"><button ref={launcher} aria-label="Ask Valora" className="help-launch" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="help-panel"><MessageCircle size={22}/><span>Ask Valora</span></button>{open&&<section role="dialog" onKeyDown={e=>{if(e.key==="Escape")close();}} id="help-panel" className="help-panel" aria-label="Valora help assistant"><header><div><span className="help-live"/>VALORA GUIDE<strong>How can we help?</strong></div><button type="button" aria-label="Close help" onClick={close}><X size={20}/></button></header><div className="help-body"><div className="help-message">Welcome to Valora Foundation. Choose a topic or type a question and I’ll guide you to the right page.</div>{active&&<div className="help-answer" role="status"><span>{active.label}</span><p>{active.answer}</p><Link href={active.href} onClick={close}>{active.action}<ArrowUpRight size={15}/></Link></div>}{asked&&!active&&<div className="help-answer" role="status"><span>Let’s get you to a person</span><p>I don’t have a reliable answer for that yet. The Valora team can help directly.</p><Link href="/contact" onClick={close}>Contact the team <ArrowUpRight size={15}/></Link></div>}<div className="help-topics">{topics.map(t=><button type="button" key={t.label} onClick={()=>ask(t.label)}>{t.label}</button>)}</div></div><form onSubmit={e=>{e.preventDefault();ask(query)}}><label htmlFor="help-question" className="sr-only">Your question</label><input ref={input} id="help-question" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask about Valora…"/><button type="submit" aria-label="Ask question"><Send size={18}/></button></form><div className="help-footer"><Link href="/contact" onClick={close}>Contact the Valora team</Link><Link href="/volunteer" onClick={close}>Volunteer with us</Link></div></section>}</div>;
}
