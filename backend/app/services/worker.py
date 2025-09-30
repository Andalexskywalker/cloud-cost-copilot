import time

from ..db import SessionLocal
from .evaluator import evaluate_and_save_alerts


def main(interval_seconds: int = 300):
    while True:
        with SessionLocal() as s:
            try:
                created = evaluate_and_save_alerts(s)
                print(f"[worker] alerts created: {created}", flush=True)
            except Exception as e:
                print("[worker] error:", e, flush=True)
        time.sleep(interval_seconds)


if __name__ == "__main__":
    main()
