#!/bin/bash
cd /root/.openclaw/workspace/projects/vertdata-polymarket/signal_service
pip install -r requirements.txt -q
uvicorn signal_generator:app --host 127.0.0.1 --port 8002 --reload
