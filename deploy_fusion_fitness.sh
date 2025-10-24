#!/bin/bash
set -e
echo "Starting Fusion Fitness (migrated)"
docker-compose up --build -d
echo "Initializing DB..."
docker-compose exec backend node db/init.js || true
echo "Done. Frontend: http://<host>:3001 Backend: http://<host>:4001"
