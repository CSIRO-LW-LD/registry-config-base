FROM ubuntu:xenial

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -y dist-upgrade --no-install-recommends
RUN apt-get -y install --no-install-recommends software-properties-common
RUN add-apt-repository ppa:webupd8team/java && apt-get update
RUN echo "oracle-java8-installer shared/accepted-oracle-license-v1-1 boolean true" |\
    /usr/bin/debconf-set-selections && \
    DEBIAN_FRONTEND=text apt-get install -y --no-install-recommends oracle-java8-installer oracle-java8-unlimited-jce-policy oracle-java8-set-default
RUN apt-get install -y --no-install-recommends sudo git maven curl cron tomcat7 wget nginx sysv-rc-conf supervisor
RUN adduser --system --home=/home/ldr ldr

ENV HOME /home/ldr
RUN sysv-rc-conf tomcat7 on
RUN sysv-rc-conf nginx on
RUN mkdir -p /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry /var/opt/nginx/cache /var/log/supervisor /usr/share/tomcat7/logs
# get appropriate .war file 
RUN wget https://s3-eu-west-1.amazonaws.com/ukgovld/release/com/github/ukgovld/registry-core/1.2.0/registry-core-1.2.0.war

# get TINI
ADD https://github.com/krallin/tini/releases/download/v0.14.0/tini /tini
RUN chmod +x /tini
ENV JAVA_HOME=/usr/lib/jvm/java-8-oracle
RUN rm -f /usr/bin/java && ln -s $JAVA_HOME/bin/java /usr/bin/java
RUN sed -i -e 's/sleep\ 5/sleep\ 5\ \&\&\ log_end_msg\ 0\ \&\&\ exit\ 0/' /etc/init.d/tomcat7
ADD . /home/ldr/registry-deploy
RUN cp -R /home/ldr/registry-deploy/ldregistry/* /opt/ldregistry
RUN cp  /home/ldr/registry-deploy/proxy-redirectVersion.conf /var/opt/ldregistry
RUN cat /home/ldr/registry-deploy/install/nginx.logrotate.conf >> /etc/logrotate.conf
RUN cp /home/ldr/registry-deploy/install/nginx.conf /etc/nginx/conf.d/localhost.conf
RUN mkdir -p /etc/sudoers.d && cp /home/ldr/registry-deploy/install/sudoers.conf /etc/sudoers.d/ldregistry
RUN rm -rf /var/lib/tomcat7/webapps/*
RUN chown -R tomcat7 /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry
RUN chown -R root:tomcat7 /run /var/run && chmod -R 776 /run /var/run && touch /var/run/tomcat7.pid && chown root:tomcat7 /var/run/tomcat7.pid && chmod 776 /var/run/tomcat7.pid
# copy appropriate .war file 
RUN cp registry-core-1.2.0.war /var/lib/tomcat7/webapps/ROOT.war
# RUN cp registry-core-1.2.0.war /var/lib/tomcat7/webapps/registry.war
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
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENTRYPOINT ["/tini", "--"]
CMD ["/usr/bin/supervisord"]

EXPOSE 22
EXPOSE 8080
EXPOSE 80

