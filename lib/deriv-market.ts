export const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export type DerivSymbol = {
  underlying_symbol: string;
  underlying_symbol_name: string;
  underlying_symbol_type: string;
  market: string;
  submarket?: string;
  subgroup?: string;
  exchange_is_open?: number;
  is_trading_suspended?: number;
  pip_size?: number;
};

export type DerivTick = {
  quote: number;
  epoch: number;
  symbol: string;
};

export type DerivCandle = {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
};