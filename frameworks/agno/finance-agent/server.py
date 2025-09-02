from agentuity import autostart
import logging
import os
import sys

if __name__ == "__main__":
    # Require an Agentuity key (CLI usually injects this for you)
    if not os.environ.get("AGENTUITY_API_KEY") and not os.environ.get("AGENTUITY_SDK_KEY"):
        print("\033[31m[ERROR] AGENTUITY_API_KEY or AGENTUITY_SDK_KEY is not set.\033[0m")
        if os.environ.get("_", "").endswith("uv") and os.path.exists(".env"):
            print("\033[31m[ERROR] Re-run with: uv run --env-file .env server.py\033[0m")
        sys.exit(1)

    if not os.environ.get("AGENTUITY_URL"):
        print("\033[33m[WARN] Running outside Agentuity runtime. Prefer `agentuity dev`.\033[0m")

    logging.basicConfig(stream=sys.stdout, level=logging.INFO, format="[%(levelname)-5.5s] %(message)s")
    autostart()