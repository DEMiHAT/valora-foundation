// Keep other account-enabled methods visible while prioritising Indian payments.
export const checkoutMethods = {
  config: {
    display: {
      blocks: {
        indian: {
          name: "UPI, cards, netbanking & wallets",
          instruments: [{ method: "upi" }, { method: "netbanking" }, { method: "wallet" }, { method: "card" }],
        },
      },
      sequence: ["block.indian"],
      preferences: { show_default_blocks: true },
    },
  },
};
