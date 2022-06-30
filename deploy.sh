sudo git pull origin master
docker stop renderscan-backend-server
docker rm renderscan-backend-server
docker rmi renderscan/backend-server
docker build --no-cache -t renderscan/backend-server .
docker run -p 5001:5001 -p 587:587 --restart=always --name renderscan-backend-server -d --env-file .env renderscan/backend-server
docker system prune -a -f
docker ps -a
