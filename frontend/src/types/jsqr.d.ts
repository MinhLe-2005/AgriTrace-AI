declare module "jsqr" {
  type QRCodeLocation = {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };

  type QRCode = {
    binaryData: number[];
    data: string;
    chunks: Array<unknown>;
    location: QRCodeLocation;
  };

  type Options = {
    inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
  };

  function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: Options): QRCode | null;

  export default jsQR;
}
