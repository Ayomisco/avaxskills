# x402 Integration References

## Official Documentation
- x402 Protocol: https://www.x402.org
- x402 GitHub: https://github.com/coinbase/x402
- x402 npm Package: https://www.npmjs.com/package/x402
- Coinbase Developer Platform: https://portal.cdp.coinbase.com

## Protocol Overview
x402 is an HTTP 402 "Payment Required" standard for AI agent micropayments.
- Client sends HTTP request
- Server returns 402 with payment requirements
- Client pays on-chain
- Client retries with payment proof
- Server verifies and responds

## Key Integration Points
```typescript
// Server: require payment middleware
import { paymentMiddleware, Network } from "x402-express";

app.use(paymentMiddleware(
  receiverAddress,
  {
    "/premium-endpoint": {
      price: "$0.01",
      network: Network.BaseSepolia // or Avalanche mainnet
    }
  },
  facilitatorUrl
));

// Client (AI Agent): handle 402 and pay
import { withPaymentInterceptor } from "x402-axios";
const client = withPaymentInterceptor(axios.create(), walletClient);
```

## Supported Networks
- Base Mainnet / Base Sepolia (primary)
- Check x402 docs for latest Avalanche support status

## GitHub Repos
- x402: https://github.com/coinbase/x402
- CDP SDK: https://github.com/coinbase/cdp-sdk
