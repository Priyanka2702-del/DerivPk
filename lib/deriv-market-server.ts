import WebSocket from "ws";

import {
  DERIV_PUBLIC_WS,
  DerivSymbol,
} from "@/lib/deriv-market";

export async function getDerivSymbols(): Promise<DerivSymbol[]> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(DERIV_PUBLIC_WS);

    let finished = false;

    const finish = (
      callback: () => void
    ) => {
      if (finished) {
        return;
      }

      finished = true;

      try {
        socket.close();
      } catch {}

      callback();
    };

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          active_symbols: "brief",
          req_id: 1,
        })
      );
    });

    socket.on("message", (message) => {
      try {
        const data = JSON.parse(
          message.toString()
        );

        if (data.error) {
          finish(() => {
            reject(
              new Error(
                data.error.message ||
                  "Deriv symbols request failed"
              )
            );
          });

          return;
        }

        if (Array.isArray(data.active_symbols)) {
          finish(() => {
            resolve(
              data.active_symbols as DerivSymbol[]
            );
          });
        }
      } catch (error) {
        finish(() => {
          reject(error);
        });
      }
    });

    socket.on("error", (error) => {
      finish(() => {
        reject(error);
      });
    });

    setTimeout(() => {
      finish(() => {
        reject(
          new Error(
            "Deriv symbols request timed out"
          )
        );
      });
    }, 15000);
  });
}