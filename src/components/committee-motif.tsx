export function CommitteeMotif({ id }: { id: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg className="committee-motif" viewBox="0 0 240 240" aria-hidden="true">
    {id === "who" && <g {...common}><circle cx="120" cy="120" r="94"/><path d="M120 56v128M56 120h128" strokeWidth="18"/><path d="M32 161h42l18-29 22 49 25-75 18 55h51" strokeWidth="5"/></g>}
    {id === "unga" && <g {...common}><circle cx="120" cy="120" r="91"/><ellipse cx="120" cy="120" rx="40" ry="91"/><path d="M29 120h182M43 76h154M43 164h154"/><path d="M39 170c-7 20 12 34 26 36M201 170c7 20-12 34-26 36"/></g>}
    {id === "unhrc" && <g {...common}><path d="M120 27v168M76 207h88M64 49h112M120 48L58 151M120 48l62 103"/><path d="M38 150h40c0 18-9 28-20 28s-20-10-20-28ZM162 150h40c0 18-9 28-20 28s-20-10-20-28Z"/></g>}
    {id === "lok-sabha" && <g {...common}><path d="M33 191h174M45 177h150M58 164h124M68 149h104M78 135h84M81 122c4-36 18-57 39-57s35 21 39 57M120 40v23M99 55h42"/><path d="M48 177v14M192 177v14"/></g>}
    {id === "aippm" && <g {...common}><path d="M44 70h152v90H99l-40 30v-30H44zM81 107h78M81 129h53"/><path d="M182 88v52M170 101h24M175 159v26M158 187h36"/></g>}
    {id === "unfccc" && <g {...common}><path d="M40 190c79-89 134-94 165-143-1 100-60 154-165 143ZM70 166c36-8 65-32 98-77"/><path d="M41 75c27-12 39-30 40-48 21 15 32 35 27 56M158 191c20-23 36-32 55-34"/></g>}
  </svg>;
}
