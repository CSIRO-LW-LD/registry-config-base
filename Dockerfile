FROM ubuntu:xenial

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -y dist-upgrade --no-install-recommends
RUN apt-get -y install --no-install-recommends software-properties-common gettext-base
RUN add-apt-repository ppa:webupd8team/java && apt-get update
RUN echo "oracle-java8-installer shared/accepted-oracle-license-v1-1 boolean true" |\
    /usr/bin/debconf-set-selections && \
    DEBIAN_FRONTEND=text apt-get install -y --no-install-recommends oracle-java8-installer oracle-java8-unlimited-jce-policy oracle-java8-set-default
RUN apt-get install -y --no-install-recommends sudo git maven curl cron logrotate tomcat7 wget nginx sysv-rc-conf supervisor
RUN adduser --system --home=/home/ldr ldr

ENV HOME /home/ldr
RUN sysv-rc-conf tomcat7 on
RUN sysv-rc-conf nginx on
RUN mkdir -p /home/ldr/registry-deploy /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry /var/log/tomcat7 /var/log/tomcat7/rotate /var/opt/nginx/cache /var/log/supervisor /usr/share/tomcat7/logs
# get appropriate .war file 
RUN wget https://s3-eu-west-1.amazonaws.com/ukgovld/release/com/github/ukgovld/registry-core/1.2.0/registry-core-1.2.0.war

# get TINI
RUN wget https://github.com/krallin/tini/releases/download/v0.16.1/tini -O /tini
RUN chmod +x /tini
ENV JAVA_HOME=/usr/lib/jvm/java-8-oracle
RUN rm -f /usr/bin/java && ln -s $JAVA_HOME/bin/java /usr/bin/java
RUN sed -i -e 's/sleep\ 5/sleep\ 5\ \&\&\ log_end_msg\ 0\ \&\&\ exit\ 0/' /etc/init.d/tomcat7
ADD install /home/ldr/registry-deploy/install
ADD ldregistry /home/ldr/registry-deploy/ldregistry
RUN cp -R /home/ldr/registry-deploy/ldregistry/* /opt/ldregistry
ENV GOOGLE_AUTH_UA="UA-XXXXXXXX-X"
RUN envsubst '$$GOOGLE_AUTH_UA' < /home/ldr/registry-deploy/install/ga.js.template > /opt/ldregistry/ui/js/ga.js
RUN sed -i -e 's/<\/head>/<script\ type\=\"text\/javascript\"\ src\=\"\$uiroot\/js\/ga\.js\"><\/script><script\ async\ src\=\"https\:\/\/www\.google\-analytics\.com\/analytics\.js\"><\/script><\/head>/' /opt/ldregistry/templates/header.vm
RUN cp /home/ldr/registry-deploy/install/proxy-redirectVersion.conf /var/opt/ldregistry
#logrotate configs
RUN cp -af /home/ldr/registry-deploy/install/nginx.logrotate.conf /etc/logrotate.d/nginx && chmod 0644 /etc/logrotate.d/nginx
RUN cp -af /home/ldr/registry-deploy/install/tomcat7.logrotate.conf /etc/logrotate.d/tomcat7 && chmod 0644 /etc/logrotate.d/tomcat7
# fix a logrotate bug
RUN sed -i -e 's/su\ root\ syslog/su\ root\ adm/' /etc/logrotate.conf
RUN chown www-data /var/log/nginx
RUN cp /home/ldr/registry-deploy/install/nginx.conf /etc/nginx/conf.d/localhost.conf
RUN mkdir -p /etc/sudoers.d && cp /home/ldr/registry-deploy/install/sudoers.conf /etc/sudoers.d/ldregistry
RUN rm -rf /var/lib/tomcat7/webapps/*
RUN chown -R tomcat7 /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry /var/log/tomcat7 /var/log/tomcat7/rotate
RUN chown -R root:tomcat7 /run /var/run && chmod -R 776 /run /var/run && touch /var/run/tomcat7.pid && chown root:tomcat7 /var/run/tomcat7.pid && chmod 776 /var/run/tomcat7.pid
# copy appropriate .war file 
RUN cp registry-core-1.2.0.war /var/lib/tomcat7/webapps/ROOT.war
# RUN cp registry-core-1.2.0.war /var/lib/tomcat7/webapps/registry.war
RUN rm /etc/nginx/sites-available/default 
RUN cp /home/ldr/registry-deploy/install/tomcat7 /etc/default/tomcat7
#supervisord
RUN cp /home/ldr/registry-deploy/install/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN cp /home/ldr/registry-deploy/install/docker-entrypoint.sh /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
RUN mkdir -p /backups/config
RUN mkdir -p /backups/ldregistry
RUN mkdir -p /backups/old/ 
RUN echo '#!/bin/bash' > restartbackup.sh && echo 'supervisorctl stop tomcat7 && bash /etc/init.d/tomcat7 stop && sleep 5 && cp -ar /var/opt/ldregistry/* /backups/ldregistry && supervisorctl start tomcat7' >> restartbackup.sh && \
    chmod +x restartbackup.sh
RUN echo '#!/bin/bash' > copybackup.sh && echo 'rm -rf /backups/old/ && cp -ar /backups/ldregistry /backups/old' >> copybackup.sh && \
    chmod +x copybackup.sh 
RUN (crontab -l 2>/dev/null; echo "00 12 * * * /restartbackup.sh") | crontab -
RUN (crontab -l 2>/dev/null; echo "00 6 * * * /copybackup.sh") | crontab -

ENTRYPOINT ["/tini", "--", "/docker-entrypoint.sh"]
CMD ["/usr/bin/supervisord"]

EXPOSE 22
EXPOSE 8080
EXPOSE 80

