docker network create frontend --scope swarm --driver overlay
docker-compose build
docker stack rm sherlock
sleep 2
docker stack deploy -c docker-compose.yml sherlock
