import os
import requests


def send_slack_sync(text: str):
    """
    Post a simple message to Slack via Incoming Webhook.
    Safe no-op if SLACK_WEBHOOK_URL is missing.
    """
    url = os.getenv("SLACK_WEBHOOK_URL")
    if not url:
        return
    try:
        requests.post(url, json={"text": text}, timeout=10)
    except Exception:
        # don't break the pipeline just because Slack failed
        pass
