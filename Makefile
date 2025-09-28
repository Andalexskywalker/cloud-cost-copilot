.PHONY: up down logs test

up:
	docker compose up -d --build

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=100

test:
	docker compose exec -T backend pytest -q
	
alerts-run:
\tdocker compose exec -T backend python -m app.services.worker
