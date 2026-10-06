interface QrOptions {errorCorrectionLevel?:'L'|'M'|'Q'|'H';version?:number;toSJISFunc?:(value:string)=>number}
interface QrCode {modules:{size:number;data:Uint8Array};version:number;errorCorrectionLevel:unknown;maskPattern:number;segments:unknown[]}
declare const QRCode:{create(text:string,options?:QrOptions):QrCode};
export default QRCode;
