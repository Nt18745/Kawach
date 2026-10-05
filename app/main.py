import json
import sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from app.config.settings import SERVER_HOST, SERVER_PORT
from app.api.router import router

class KawachHttpHandler(BaseHTTPRequestHandler):
    """Production Multi-Threaded HTTP Handler for Kawach Safety Platform."""

    def _send_json_response(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.end_headers()

    def do_GET(self):
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        status_code, data = router.route_request("GET", self.path, b"", client_ip)
        self._send_json_response(status_code, data)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        status_code, data = router.route_request("POST", self.path, body, client_ip)
        self._send_json_response(status_code, data)

    def do_PUT(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        status_code, data = router.route_request("PUT", self.path, body, client_ip)
        self._send_json_response(status_code, data)

    def do_DELETE(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        status_code, data = router.route_request("DELETE", self.path, body, client_ip)
        self._send_json_response(status_code, data)

    def log_message(self, format, *args):
        # Suppress noisy standard request logs to keep terminal readable
        pass

def run_server(port: int = SERVER_PORT, host: str = SERVER_HOST):
    print(f"Starting KAWACH Production Multi-Threaded Engine on http://{host}:{port}...")
    server = ThreadingHTTPServer((host, port), KawachHttpHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        print("Server shutdown completed.")

if __name__ == "__main__":
    port = SERVER_PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run_server(port)
