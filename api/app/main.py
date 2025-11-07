#!/usr/bin/python -u
"""

Main runner
Workers: 2 * core + 11

"""

import os
import uvicorn

if __name__ == "__main__":
    # based on CPU cores and threads
    # (threads * cpu_count) + 1
    threads = 1
    workers = (threads * os.cpu_count()) + 1

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=5000,
        reload=False,
        workers=workers,
        backlog=4096,
        log_level="warning", # info
        limit_max_requests=1024, # prevent memleak
    )
