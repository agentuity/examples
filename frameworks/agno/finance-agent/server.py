#!/usr/bin/env python3

import uvicorn
from agentuity.server import create_server

app = create_server()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3500)
