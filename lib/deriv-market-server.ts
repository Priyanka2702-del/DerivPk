import WebSocket from "ws";

const DERIV_PUBLIC_WS =
  "wss://api.derivws.com/trading/v1/options/ws/public";

export async function getDerivSymbols() {
  return new Promise<any[]>((resolve, reject) => {
    const ws = new WebSocket(DERIV_PUBLIC_WS);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Deriv WebSocket timeout"));
    }, 10000);

    ws.on("open", () => {
      console.log("✅ Server connected to Deriv WebSocket");

      ws.send(
        JSON.stringify({
          active_symbols: "brief",
          req_id: 1,
        })
      );
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        console.log("📩 Deriv response:", data.msg_type);

        if (data.error) {
          clearTimeout(timeout);
          ws.close();

          reject(
            new Error(
              data.error.message || "Deriv API returned an error"
            )
          );

          return;
        }

        if (
          data.req_id === 1 &&
          data.msg_type === "active_symbols"
        ) {
          clearTimeout(timeout);
          ws.close();

          resolve(
            Array.isArray(data.active_symbols)
              ? data.active_symbols
              : []
          );
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();

        reject(error);
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);

      console.error("❌ Deriv Server WebSocket Error:", error);

      reject(error);
    });
  });
}