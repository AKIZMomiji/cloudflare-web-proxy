export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 例: https://rec877.com/untiburiburi/proxy?url=https://example.com/
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response(
        JSON.stringify({
          error: "Missing target URL.",
          example: "https://rec877.com/untiburiburi/proxy?url=https://example.com/",
        }, null, 2),
        {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    // Optional allowlist. If empty, all hosts are allowed.
    const allowedHosts = (env.ALLOWED_HOSTS || "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    if (allowedHosts.length > 0) {
      const host = targetUrl.hostname.toLowerCase();
      if (!allowedHosts.includes(host)) {
        return new Response("Host not allowed", { status: 403 });
      }
    }

    // Optional Basic Auth
    const user = env.BASIC_AUTH_USER || "";
    const pass = env.BASIC_AUTH_PASS || "";

    if (user || pass) {
      const authHeader = request.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Basic ")) {
        return new Response("Unauthorized", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="proxy"' },
        });
      }

      const decoded = atob(authHeader.replace("Basic ", ""));
      const [providedUser, providedPass] = decoded.split(":");
      if (providedUser !== user || providedPass !== pass) {
        return new Response("Unauthorized", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="proxy"' },
        });
      }
    }

    const headers = new Headers(request.headers);

    // Remove hop-by-hop headers that should not be forwarded.
    const hopByHopHeaders = [
      "host",
      "content-length",
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
    ];

    for (const name of hopByHopHeaders) {
      headers.delete(name);
    }

    headers.set("host", targetUrl.host);

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = await request.arrayBuffer();
    }

    const upstream = await fetch(targetUrl, init);
    const responseHeaders = new Headers(upstream.headers);

    // Make it easier to use from browser JS.
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*" );

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  },
};
