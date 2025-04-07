.PHONY: build up down logs logs-web logs-n8n

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

logs-web:
	docker compose logs -f web

logs-n8n:
	docker compose logs -f n8n

