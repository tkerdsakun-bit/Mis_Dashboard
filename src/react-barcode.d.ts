declare module 'react-barcode' {
  interface BarcodeProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
  }
  const Barcode: React.FC<BarcodeProps>;
  export default Barcode;
}
