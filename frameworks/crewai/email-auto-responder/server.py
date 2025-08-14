#!/usr/bin/env python3

import os
import sys
from pathlib import Path

current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from agentuity.server import serve

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3500))
    
    serve(port=port)
