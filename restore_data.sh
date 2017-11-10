#!/bin/bash

RESTORE_DIR=$1
echo "Restoring Data From Directory $RESTORE_DIR"

CONTAINER_NAME=$2
echo "Into Container $CONTAINER_NAME"

read -p "Will Overwrite Data. Are you sure (Y/y to continue)? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo   "Stopping Service" 
	echo 
	echo "docker exec  $CONTAINER_NAME /bin/bash -c \"service tomcat7 stop\""
	docker exec  $CONTAINER_NAME /bin/bash -c "service tomcat7 stop"
	 
	echo   "Copying Data" 
	echo 
	echo   "docker cp $RESTORE_DIR/config $CONTAINER_NAME:/opt/ldregistry/" 
	docker cp $RESTORE_DIR/config $CONTAINER_NAME:/opt/ldregistry/
	echo   "docker cp $RESTORE_DIR/templates $CONTAINER_NAME:/opt/ldregistry/"
	docker cp $RESTORE_DIR/templates $CONTAINER_NAME:/opt/ldregistry/
	echo   "docker cp $RESTORE_DIR/ldregistry $CONTAINER_NAME:/var/opt/"
	docker cp $RESTORE_DIR/ldregistry $CONTAINER_NAME:/var/opt/

	echo   "Fixing Permissions" 
	echo 
	echo   "docker exec $CONTAINER_NAME /bin/bash -c \"chown -R tomcat7 /var/opt/ldregistry/* && chgrp -R tomcat7 /var/opt/ldregistry/*\""
	docker exec $CONTAINER_NAME /bin/bash -c "chown -R tomcat7 /var/opt/ldregistry/* && chgrp -R tomcat7 /var/opt/ldregistry/*"
	echo   "docker exec $CONTAINER_NAME /bin/bash -c \"chown -R tomcat7 /opt/ldregistry/* && chgrp -R tomcat7 /opt/ldregistry/*\""
	docker exec $CONTAINER_NAME /bin/bash -c "chown -R tomcat7 /opt/ldregistry/* && chgrp -R tomcat7 /opt/ldregistry/*"

	echo   "Starting Service" 
	echo
	echo "docker exec  $CONTAINER_NAME /bin/bash -c \"service tomcat7 start\""
	docker exec  $CONTAINER_NAME /bin/bash -c "service tomcat7 start"
fi
