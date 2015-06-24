FROM ubuntu 
ENV HOME /root
ADD . /root/registry-deploy
RUN apt-get update
RUN apt-get install -y --no-install-recommends git maven curl tomcat7 openjdk-7-jdk wget nginx sysv-rc-conf
RUN sysv-rc-conf tomcat7 on
RUN sysv-rc-conf nginx on
RUN mkdir -p /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry /var/opt/nginx/cache
# get appropriate .war file 
RUN wget https://s3-eu-west-1.amazonaws.com/ukgovld/snapshot/com/github/ukgovld/registry-core/1.0.0-SNAPSHOT/registry-core-1.0.0-20150623.065627-5.war
RUN mkdir -p /usr/share/tomcat7/logs
RUN cp -R ~/registry-deploy/ldregistry/* /opt/ldregistry
RUN cp  ~/registry-deploy/proxy-redirectVersion.conf /var/opt/ldregistry
RUN cat ~/registry-deploy/install/nginx.logrotate.conf >> /etc/logrotate.conf
RUN cp ~/registry-deploy/install/nginx.conf /etc/nginx/conf.d/localhost.conf
RUN cp ~/registry-deploy/install/sudoers.conf /etc/sudoers.d/ldregistry
RUN rm -rf /var/lib/tomcat7/webapps/* 
RUN chown -R tomcat7 /opt/ldregistry /var/opt/ldregistry /var/log/ldregistry
# copy appropriate .war file 
RUN cp registry-core-1.0.0-20150623.065627-5.war /var/lib/tomcat7/webapps/ROOT.war
RUN rm /etc/nginx/sites-available/default 

#supervisord
RUN apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


CMD ["/usr/bin/supervisord"]

EXPOSE 22
EXPOSE 8080
EXPOSE 80

