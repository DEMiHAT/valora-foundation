import QRCode from '../core/qrcode';
declare const Svg:{render(qr:ReturnType<typeof QRCode.create>,options?:{margin?:number;width?:number;color?:{dark?:string;light?:string}}):string};
export default Svg;
