FROM ubuntu 
ENV HOME /root
ADD . /root/registry-deploy
RUN apt-get update
RUN apt-get install -y --no-install-recommends git maven curl tomcat7 openjdk-7-jdk wget nginx sysv-rc-conf
RUN sysv-rc-conf tomcat7 on
RUN sysv-rc-conf nginx on
RUN mkdir -p /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry /var/opt/nginx/cache
# get appropriate .war file 
RUN wget https://s3-eu-west-1.amazonaws.com/ukgovld/release/com/github/ukgovld/registry-core/1.1.0/registry-core-1.1.0.war
RUN mkdir -p /usr/share/tomcat7/logs
RUN cp -R ~/registry-deploy/ldregistry/* /opt/ldregistry
RUN cp  ~/registry-deploy/proxy-redirectVersion.conf /var/opt/ldregistry
RUN cat ~/registry-deploy/install/nginx.logrotate.conf >> /etc/logrotate.conf
RUN cp ~/registry-deploy/install/nginx.conf /etc/nginx/conf.d/localhost.conf
RUN cp ~/registry-deploy/install/sudoers.conf /etc/sudoers.d/ldregistry
RUN rm -rf /var/lib/tomcat7/webapps/* 
RUN chown -R tomcat7 /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry
# copy appropriate .war file 
RUN cp registry-core-1.1.0.war /var/lib/tomcat7/webapps/root.war
RUN rm /etc/nginx/sites-available/default 
ADD ./tomcat7 /etc/default/tomcat7
#ADD ./tomcat_conf/* /usr/share/tomcat7/bin/
RUN mkdir -p /backups/config
RUN mkdir -p /backups/ldregistry
RUN mkdir -p /backups/old/ 
RUN echo '#!/bin/bash' >> restartbackup.sh && echo 'service tomcat7 stop && cp -r /var/opt/ldregistry/* /backups/ldregistry && service tomcat7 start' >> restartbackup.sh && chmod +x restartbackup.sh
RUN echo '#!/bin/bash' >> copybackup.sh && echo 'rm -rf /backups/old/ && cp -r /backups/ldregistry /backups/old' >> copybackup.sh && chmod +x copybackup.sh 
RUN (crontab -l 2>/dev/null; echo "00 12 * * * /restartbackup.sh") | crontab -
RUN (crontab -l 2>/dev/null; echo "00 6 * * * /copybackup.sh") | crontab -

#supervisord
RUN apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


CMD ["/usr/bin/supervisord"]

EXPOSE 22
EXPOSE 8080
EXPOSE 80

