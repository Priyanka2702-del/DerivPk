"use client";

import { useEffect, useState } from "react";

import {
  createDerivWebSocket,
  DerivCandle,
  DerivSymbol,
  DerivTick,
} from "@/lib/deriv-market";

function isValidDerivSymbol(
  symbol: string
): boolean {
  return (
    typeof symbol === "string" &&
    /^\w{2,30}$/.test(symbol.trim())
  );
}

/* =========================================================
   DERIV SYMBOLS
   ========================================================= */

export function useDerivSymbols() {
  const [symbols, setSymbols] =
    useState<DerivSymbol[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ws = createDerivWebSocket();

    setLoading(true);
    setError(null);

    ws.onopen = () => {
      console.log(
        "✅ Connected to Deriv for symbols"
      );

      ws.send(
        JSON.stringify({
          active_symbols: "brief",
          req_id: 1,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        if (data.error) {
          console.error(
            "❌ DERIV SYMBOL ERROR:",
            data.error
          );

          if (!cancelled) {
            setError(
              data.error.message ||
                "Unable to load symbols"
            );

            setLoading(false);
          }

          ws.close();

          return;
        }

        if (
          data.msg_type ===
            "active_symbols" &&
          data.req_id === 1
        ) {
          const receivedSymbols =
            Array.isArray(
              data.active_symbols
            )
              ? data.active_symbols
              : [];

          if (!cancelled) {
            setSymbols(
              receivedSymbols
            );

            setLoading(false);
          }

          console.log(
            "✅ Deriv symbols loaded:",
            receivedSymbols.length
          );

          ws.close();
        }
      } catch (error) {
        console.error(
          "❌ DERIV SYMBOL PARSE ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            "Unable to parse Deriv symbols"
          );

          setLoading(false);
        }

        ws.close();
      }
    };

    ws.onerror = (event) => {
      console.error(
        "❌ DERIV SYMBOL WEBSOCKET ERROR:",
        event
      );

      if (!cancelled) {
        setError(
          "Unable to connect to Deriv market"
        );

        setLoading(false);
      }
    };

    ws.onclose = () => {
      console.log(
        "🔌 Deriv symbols WebSocket closed"
      );
    };

    return () => {
      cancelled = true;

      try {
        ws.close();
      } catch {}
    };
  }, []);

  return {
    symbols,
    loading,
    error,
  };
}

/* =========================================================
   DERIV LIVE TICK
   ========================================================= */

export function useDerivTick(
  symbol: string
) {
  const [tick, setTick] =
    useState<DerivTick | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const cleanSymbol =
      symbol.trim();

    if (
      !isValidDerivSymbol(
        cleanSymbol
      )
    ) {
      setTick(null);
      setError(
        "Invalid Deriv symbol"
      );

      return;
    }

    let cancelled = false;

    const ws =
      createDerivWebSocket();

    setTick(null);
    setError(null);

    ws.onopen = () => {
      console.log(
        `✅ Connected to Deriv for tick: ${cleanSymbol}`
      );

      ws.send(
        JSON.stringify({
          ticks: [cleanSymbol],
          subscribe: 1,
          req_id: 2,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        if (data.error) {
          console.error(
            "❌ DERIV TICK ERROR:",
            data.error
          );

          if (!cancelled) {
            setError(
              data.error.message ||
                "Unable to fetch live price"
            );
          }

          ws.close();

          return;
        }

        if (
          data.msg_type === "tick" &&
          data.tick
        ) {
          if (!cancelled) {
            setTick({
              symbol:
                data.tick.symbol,
              quote:
                Number(
                  data.tick.quote
                ),
              epoch:
                Number(
                  data.tick.epoch
                ),
            });
          }
        }
      } catch (error) {
        console.error(
          "❌ DERIV TICK PARSE ERROR:",
          error
        );
      }
    };

    ws.onerror = (event) => {
      console.error(
        "❌ DERIV TICK WEBSOCKET ERROR:",
        event
      );

      if (!cancelled) {
        setError(
          "Live market connection failed"
        );
      }
    };

    ws.onclose = () => {
      console.log(
        `🔌 Deriv tick WebSocket closed: ${cleanSymbol}`
      );
    };

    return () => {
      cancelled = true;

      try {
        ws.close();
      } catch {}
    };
  }, [symbol]);

  return {
    tick,
    loading: !tick && !error,
    error,
  };
}

/* =========================================================
   DERIV CANDLES
   ========================================================= */

export function useDerivCandles(
  symbol: string,
  granularity = 60
) {
  const [candles, setCandles] =
    useState<DerivCandle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const cleanSymbol =
      symbol.trim();

    if (
      !isValidDerivSymbol(
        cleanSymbol
      )
    ) {
      setCandles([]);
      setError(
        "Invalid Deriv symbol"
      );
      setLoading(false);

      return;
    }

    let cancelled = false;

    const ws =
      createDerivWebSocket();

    setCandles([]);
    setLoading(true);
    setError(null);

    ws.onopen = () => {
      console.log(
        `✅ Connected to Deriv for candles: ${cleanSymbol}`
      );

      ws.send(
        JSON.stringify({
          ticks_history:
            cleanSymbol,
          count: 100,
          end: "latest",
          style: "candles",
          granularity,
          req_id: 3,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          event.data
        );

        if (data.error) {
          console.error(
            "❌ DERIV CANDLES ERROR:",
            data.error
          );

          if (!cancelled) {
            setError(
              data.error.message ||
                "Unable to fetch candles"
            );

            setLoading(false);
          }

          ws.close();

          return;
        }

        if (
          data.msg_type ===
            "candles" &&
          data.req_id === 3
        ) {
          const receivedCandles =
            Array.isArray(
              data.candles
            )
              ? data.candles.map(
                  (
                    candle: any
                  ) => ({
                    epoch:
                      Number(
                        candle.epoch
                      ),
                    open:
                      Number(
                        candle.open
                      ),
                    high:
                      Number(
                        candle.high
                      ),
                    low:
                      Number(
                        candle.low
                      ),
                    close:
                      Number(
                        candle.close
                      ),
                  })
                )
              : [];

          if (!cancelled) {
            setCandles(
              receivedCandles
            );

            setLoading(false);
          }

          console.log(
            "✅ Deriv candles loaded:",
            receivedCandles.length
          );

          ws.close();
        }
      } catch (error) {
        console.error(
          "❌ DERIV CANDLES PARSE ERROR:",
          error
        );

        if (!cancelled) {
          setError(
            "Unable to parse candle data"
          );

          setLoading(false);
        }

        ws.close();
      }
    };

    ws.onerror = (event) => {
      console.error(
        "❌ DERIV CANDLES WEBSOCKET ERROR:",
        event
      );

      if (!cancelled) {
        setError(
          "Unable to connect to Deriv candles"
        );

        setLoading(false);
      }
    };

    ws.onclose = () => {
      console.log(
        `🔌 Deriv candles WebSocket closed: ${cleanSymbol}`
      );
    };

    return () => {
      cancelled = true;

      try {
        ws.close();
      } catch {}
    };
  }, [
    symbol,
    granularity,
  ]);

  return {
    candles,
    loading,
    error,
  };
}