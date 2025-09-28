import os, requests

def send_slack_sync(text: str):
    url = os.getenv("SLACK_WEBHOOK_URL")
    if not url:
        return
    try:
        requests.post(url, json={"text": text}, timeout=10)
    except Exception:
        pass
