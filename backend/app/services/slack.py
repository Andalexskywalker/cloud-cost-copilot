import os, httpx

async def send_slack(text: str):
    url = os.getenv("SLACK_WEBHOOK_URL")
    if not url:
        return
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json={"text": text})
