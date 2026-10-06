"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Send, X } from "lucide-react";

const topics = [
  {label:"Register myself", words:["register","sign up","join","student"], answer:"You can register as an individual delegate, rank three committee preferences, and pay securely online.", href:"/events/valora-mun/register", action:"Individual registration"},
  {label:"Bring a school", words:["school","teacher","bulk","group","delegation","mass"], answer:"Teachers can add 2–30 students to one roster and pay the combined amount in one checkout. Each student receives a separate registration.", href:"/events/valora-mun/delegation", action:"School delegation portal"},
  {label:"Fees & payment", words:["fee","price","cost","pay","payment","upi","card"], answer:"The delegate fee is ₹999 per student. Razorpay shows the available UPI, card and other methods at checkout. School totals are calculated automatically.", href:"/events/valora-mun/register", action:"View checkout"},
  {label:"Committees", words:["committee","who","unga","unhrc","aippm","lok sabha","unfccc"], answer:"There are six committees: WHO, UNGA, UNHRC, Lok Sabha, AIPPM and UNFCCC. Choose three preferences when registering; allocations follow availability.", href:"/events/valora-mun#committees", action:"Explore committees"},
  {label:"Venue & date", words:["when","where","venue","date","time","location"], answer:"Valora MUN is on 14 November 2026. The venue is still to be announced; confirmed details will appear on the event page and be shared with delegates.", href:"/events/valora-mun", action:"Event details"},
  {label:"Training & beginners", words:["training","beginner","first mun","prepare","experience"], answer:"Beginners are welcome. Your fee includes one general MUN training session and one committee-specific session. Timing will be shared with registered delegates.", href:"/events/valora-mun", action:"What’s included"},
  {label:"Allocation & E-ID", words:["allocation","portfolio","country","id","certificate","qr"], answer:"After payment is confirmed, your committee and portfolio are allocated from your preferences. Your digital E-ID is emailed to the address used for that student.", href:"/events/valora-mun#committees", action:"Allocation details"},
  {label:"Payment problem", words:["failed","charged","debited","stuck","status","receipt","retry"], answer:"Return to the registration page in the same browser tab and use Check payment status. If a payment was debited and has not updated, contact our team with your registration reference. Please do not send card details.", href:"/contact", action:"Contact support"},
  {label:"Refunds & terms", words:["refund","cancel","terms","policy","privacy"], answer:"The refund policy is displayed on the registration page before payment. Please review it alongside the event terms.", href:"/terms", action:"Read event terms"},
  {label:"Partners & sponsors", words:["partner","sponsor","organisation","organization","support"], answer:"Schools and organisations can contact Valora about participation, sponsorship or event support.", href:"/partners", action:"Partnership options"},
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
  return <div className="help-assistant"><button ref={launcher} aria-label="Ask Valora" className="help-launch" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="help-panel"><MessageCircle size={22}/><span>Ask Valora</span></button>{open&&<section role="dialog" onKeyDown={e=>{if(e.key==="Escape")close();}} id="help-panel" className="help-panel" aria-label="Valora help assistant"><header><div><span className="help-live"/>VALORA GUIDE<strong>How can we help?</strong></div><button type="button" aria-label="Close help" onClick={close}><X size={20}/></button></header><div className="help-body"><div className="help-message">Welcome to Valora MUN. Choose a topic or type a question. I can guide you to the right page.</div>{active&&<div className="help-answer" role="status"><span>{active.label}</span><p>{active.answer}</p><Link href={active.href} onClick={close}>{active.action}<ArrowUpRight size={15}/></Link></div>}{asked&&!active&&<div className="help-answer" role="status"><span>Let’s get you to a person</span><p>I don’t have a reliable answer for that yet. The Valora team can help directly.</p><Link href="/contact" onClick={close}>Contact the team <ArrowUpRight size={15}/></Link></div>}<div className="help-topics">{topics.map(t=><button type="button" key={t.label} onClick={()=>ask(t.label)}>{t.label}</button>)}</div></div><form onSubmit={e=>{e.preventDefault();ask(query)}}><label htmlFor="help-question" className="sr-only">Your question</label><input ref={input} id="help-question" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask about registration, fees…"/><button type="submit" aria-label="Ask question"><Send size={18}/></button></form><div className="help-footer"><Link href="/contact" onClick={close}>Contact the Valora team</Link><Link href="/events/valora-mun/delegation" onClick={close}>School portal</Link></div></section>}</div>;
}
