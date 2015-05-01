for HTTPPORT in $(seq 8080 8442); do echo -ne "\035" | telnet 127.0.0.1 $HTTPPORT > /dev/null 2>&1; [ $? -eq 1 ] && break; done
TAG=ldregistry
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
CONTAINERID=$(docker run --privileged -p $HTTPPORT:80 -d $TAG)
echo "running at http://localhost:$HTTPPORT"
NAME=$(docker inspect --format='{{.Name}}' $CONTAINERID)
NAME=${NAME:1}
echo "to stop this instance run 'sudo docker stop $NAME'"
