#!/bin/bash
# Build docker image
echo 'Building docker image...'
GIT_HASH=$(git rev-parse --short HEAD)
PROJECT_ID='above-the-clouds-app'
IMAGE_PREFIX=gcr.io/$PROJECT_ID
IMAGE=$IMAGE_PREFIX:$GIT_HASH
echo $IMAGE
echo

echo 'STOPPING container...'
docker container stop $(docker container ls -al | grep $IMAGE | awk 'END {print $1}')
echo
echo 'REMOVING container...'
docker container rm $(docker container ls -al | grep $IMAGE | awk 'END {print $1}')
echo
echo 'DELETING image...'
docker image rm $(docker images | grep $IMAGE_PREFIX | awk 'END {print $3}')
echo
echo 'BUILDING container INITIATED...'
docker build -t $IMAGE .
echo
# Run image locally:
# docker run -e DB_HOST=host.docker.internal -p 8080:8080 -d $IMAGE
