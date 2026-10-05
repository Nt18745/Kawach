import time
from concurrent.futures import ThreadPoolExecutor
from app.location.haversine import calculate_haversine_distance

def run_load_tests(num_requests: int = 50):
    tests = []
    lat1, lon1 = 28.5672, 77.1956
    lat2, lon2 = 28.5684, 77.2069

    latencies = []

    def task():
        t0 = time.perf_counter()
        calculate_haversine_distance(lat1, lon1, lat2, lon2)
        return (time.perf_counter() - t0) * 1000

    start_total = time.perf_counter()
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(task) for _ in range(num_requests)]
        latencies = [f.result() for f in futures]
    total_time_ms = (time.perf_counter() - start_total) * 1000

    latencies.sort()
    p50 = round(latencies[len(latencies) // 2], 3)
    p95 = round(latencies[int(len(latencies) * 0.95)], 3)
    p99 = round(latencies[int(len(latencies) * 0.99)], 3)

    tests.append({
        "name": f"High-Throughput Concurrency Simulation ({num_requests} ops)",
        "passed": p95 < 5.0,  # sub-5ms per computation in memory
        "details": f"Processed {num_requests} concurrent operations in {total_time_ms:.1f}ms (p50: {p50}ms, p95: {p95}ms, p99: {p99}ms)"
    })

    return tests
