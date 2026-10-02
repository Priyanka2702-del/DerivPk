"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  DerivCandle,
  DerivSymbol,
  DerivTick,
} from "@/lib/deriv-market";

function isValidDerivSymbol(
  symbol: string
): boolean {
  return (
    typeof symbol === "string" &&
    /^\w{2,30}$/.test(
      symbol.trim()
    )
  );
}

/* =====================================================
   SYMBOLS
===================================================== */

export function useDerivSymbols() {
  const [symbols, setSymbols] =
    useState<DerivSymbol[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSymbols() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            "/api/deriv/market/symbols",
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load Deriv symbols"
          );
        }

        if (!cancelled) {
          setSymbols(
            Array.isArray(
              data.symbols
            )
              ? data.symbols
              : []
          );

          setLoading(false);
        }
      } catch (error) {
        console.error(
          "DERIV SYMBOL API ERROR:",
          error
        );

        if (!cancelled) {
          setSymbols([]);

          setError(
            error instanceof Error
              ? error.message
              : "Unable to load Deriv symbols"
          );

          setLoading(false);
        }
      }
    }

    loadSymbols();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    symbols,
    loading,
    error,
  };
}

/* =====================================================
   LIVE TICK
===================================================== */

export function useDerivTick(
  symbol: string
) {
  const [tick, setTick] =
    useState<DerivTick | null>(
      null
    );

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

    setTick(null);
    setError(null);

    const eventSource =
      new EventSource(
        `/api/deriv/market/stream?symbol=${encodeURIComponent(
          cleanSymbol
        )}`
      );

    eventSource.onopen = () => {
      console.log(
        "Connected to Deriv live stream:",
        cleanSymbol
      );
    };

    eventSource.onmessage = (
      event
    ) => {
      try {
        const data =
          JSON.parse(
            event.data
          );

        if (
          data.type ===
          "connected"
        ) {
          console.log(
            "Deriv stream ready:",
            data.symbol
          );

          return;
        }

        if (
          data.type === "heartbeat"
        ) {
          return;
        }

        if (
          data.type === "tick"
        ) {
          if (!cancelled) {
            setTick({
              symbol:
                data.symbol,
              quote: Number(
                data.quote
              ),
              epoch: Number(
                data.epoch
              ),
            });
          }

          return;
        }

        if (
          data.type === "error"
        ) {
          console.error(
            "DERIV STREAM ERROR:",
            data.message
          );

          if (!cancelled) {
            setError(
              data.message ||
                "Live market connection failed"
            );
          }
        }
      } catch (error) {
        console.error(
          "DERIV SSE PARSE ERROR:",
          error
        );
      }
    };

    eventSource.onerror = () => {
      console.error(
        "DERIV SSE CONNECTION ERROR"
      );

      if (!cancelled) {
        setError(
          "Live market connection failed"
        );
      }

      eventSource.close();
    };

    return () => {
      cancelled = true;

      eventSource.close();

      console.log(
        "Deriv live stream closed:",
        cleanSymbol
      );
    };
  }, [symbol]);

  return {
    tick,
    loading:
      !tick && !error,
    error,
  };
}

/* =====================================================
   CANDLES
===================================================== */

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

    async function loadCandles() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            `/api/deriv/market/candles?symbol=${encodeURIComponent(
              cleanSymbol
            )}&granularity=${granularity}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to fetch Deriv candles"
          );
        }

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
          "Deriv candles loaded:",
          receivedCandles.length
        );
      } catch (error) {
        console.error(
          "DERIV CANDLES API ERROR:",
          error
        );

        if (!cancelled) {
          setCandles([]);

          setError(
            error instanceof Error
              ? error.message
              : "Unable to fetch Deriv candles"
          );

          setLoading(false);
        }
      }
    }

    loadCandles();

    return () => {
      cancelled = true;
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