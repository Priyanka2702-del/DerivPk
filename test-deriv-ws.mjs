const ws = new WebSocket(
  "wss://api.derivws.com/trading/v1/options/ws/public"
);

ws.onopen = () => {
  console.log(" WEBSOCKET CONNECTED");

  // 1. Active symbols
  ws.send(
    JSON.stringify({
      active_symbols: "brief",
      req_id: 1,
    })
  );

  // 2. Live tick
  ws.send(
    JSON.stringify({
      ticks: ["frxEURUSD"],
      subscribe: 1,
      req_id: 2,
    })
  );

  // 3. Historical candles
  ws.send(
    JSON.stringify({
      ticks_history: "frxEURUSD",
      count: 100,
      end: "latest",
      style: "candles",
      granularity: 60,
      req_id: 3,
    })
  );
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    console.log("\n MESSAGE");
    console.log("req_id:", data.req_id);
    console.log("msg_type:", data.msg_type);

    if (data.error) {
      console.error(" DERIV API ERROR:");
      console.error(JSON.stringify(data.error, null, 2));
      return;
    }

    if (data.msg_type === "tick") {
      console.log(" TICK:");
      console.log({
        symbol: data.tick.symbol,
        quote: data.tick.quote,
        epoch: data.tick.epoch,
      });
    }

    if (data.msg_type === "candles") {
      console.log(" CANDLES RECEIVED:");
      console.log("Count:", data.candles?.length);

      if (data.candles?.length) {
        console.log("First candle:", data.candles[0]);
        console.log(
          "Last candle:",
          data.candles[data.candles.length - 1]
        );
      }
    }

    if (data.msg_type === "active_symbols") {
      console.log(
        " ACTIVE SYMBOLS:",
        data.active_symbols?.length
      );
    }
  } catch (error) {
    console.error(" JSON PARSE ERROR:", error);
    console.log(event.data);
  }
};

ws.onerror = (event) => {
  console.error(" WEBSOCKET ERROR:");
  console.error(event);
};

ws.onclose = (event) => {
  console.log("\nWEBSOCKET CLOSED");
  console.log("Code:", event.code);
  console.log("Reason:", event.reason);
};