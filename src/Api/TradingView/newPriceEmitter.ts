import { TypedEmitter } from "tiny-typed-emitter";

interface NewPriceEvents {
  'update': (bar: { time: number, close: number, open: number, high: number, low: number }) => void;
}

export const newPriceEmitter = new TypedEmitter<NewPriceEvents>()
