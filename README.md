# Cloudflare Worker Web Proxy

This project is a simple Cloudflare Worker that acts as a web proxy for a target URL provided in the query string.

## Example

`https://rec877.com/untiburiburi/proxy?url=https://abehiroshi.la.coan.jp/`

## Deployment in Cloudflare dashboard

1. Open Cloudflare Workers
2. Create a new Worker
3. Paste the contents of `worker.js`
4. Save and deploy
5. Set a route such as:
   - `rec877.com/untiburiburi/*`
6. Optional variables in Worker Settings -> Variables:
   - `ALLOWED_HOSTS` = `example.com,cdn.example.com`
   - `BASIC_AUTH_USER` = `admin`
   - `BASIC_AUTH_PASS` = `change-me`

## Notes

- If `ALLOWED_HOSTS` is empty, all hosts are allowed.
- If you set `ALLOWED_HOSTS`, only those hosts will be accessible through the proxy.
- Basic Auth is optional and useful when testing on a public domain.

## Security warning

This is a general-purpose proxy. Do not expose it publicly without restrictions.
