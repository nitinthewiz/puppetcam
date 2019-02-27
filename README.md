docker build -t local/chrome:0.0.1 .

docker run -v $(pwd)/export.js:/app/export.js -p 3000:3000 local/chrome:0.0.1
docker run -p 3000:3000 local/chrome:0.0.1