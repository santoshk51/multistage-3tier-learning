# Madhubani 3-Tier Docker Project

## Architecture

Browser -> Nginx frontend -> Node.js/Express backend -> MySQL database

- Frontend is the only tier exposed to the host on port 8080.
- Nginx serves static files and reverse-proxies `/api/*` to `backend:3000`.
- Backend connects to MySQL using the Compose service DNS name `database`.
- MySQL persists records in the named volume `mysql-data`.
- Two networks demonstrate isolation: frontend-network and backend-network.

## Run

```powershell
docker compose up -d --build
```

Open http://localhost:8080

## Observe

```powershell
docker compose ps
docker compose logs -f
docker network ls
docker volume ls
docker compose exec backend sh
docker compose exec database mysql -u madhubani_user -pmadhubani_password madhubani_db
```

Inside MySQL:

```sql
SELECT * FROM reviews;
```

## Persistence test

1. Add a review in the website.
2. Run `docker compose down`.
3. Run `docker compose up -d`.
4. The review remains because the named volume remains.

`docker compose down -v` also deletes the MySQL volume and therefore deletes the records.
