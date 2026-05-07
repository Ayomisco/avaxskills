# KYC/AML Integration Rules

## Must-Follow
- Always store KYC status on-chain only as a boolean or allowlist — never store PII on-chain
- Always integrate with a compliant KYC provider (Jumio, Onfido, Persona, Sumsub)
- Always implement off-chain KYC with on-chain access control gates — never do KYC entirely on-chain
- Always comply with applicable regulations (MiCA, FinCEN, FATF guidelines) for your jurisdiction

## Never Do
- Never store passport numbers, SSNs, or government IDs on-chain or in contract events
- Never implement custom AML screening — use regulated third-party providers
- Never allow bypassing KYC gates for any address including admin/deployer
- Never log PII to backend server logs unencrypted

## Always Check
- Verify KYC provider handles your target geographies
- Confirm your smart contract allowlist update mechanism is secure against unauthorized additions
- Ensure GDPR-compliant data deletion process for off-chain KYC data
