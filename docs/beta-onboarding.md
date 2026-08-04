# Controlled-beta onboarding

1. Create a tenant and issue the smallest required API-key scopes. Deliver the secret once through an approved secure channel.
2. Confirm the customer's authorized use case, expected monthly volume, retention needs, callback domain, and support contact.
3. Start with a limited quota. Ask the customer to retain delivery outcomes and bounce classifications for calibration feedback.
4. Verify integration against single-address requests, an idempotent retry, asynchronous CSV processing, signed callbacks, quota exhaustion, and key rotation.
5. Explain that `unknown` is intentional when evidence is ambiguous and must not be converted into `invalid` by the customer.
6. Monitor error rate, latency, unknown rate, provider defensive signals, customer bounce outcomes, and abuse indicators during the first week.
7. Suspend access immediately for unauthorized enumeration, evasion of rate controls, prohibited use, credential compromise, or provider harm.

Production claims are prohibited during beta. Customer-facing accuracy statements must come from the versioned calibration report and identify the applicable provider population and observation window.
