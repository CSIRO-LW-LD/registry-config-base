Name:		registry-config-base
Version:	1.0
Release:	1
Summary:	Registry-core linked data registry

License:	apache
URL:		https://github.com/ukgovld/registry-config-base

BuildRoot:	%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
Source0:	%{name}-%{version}.tar.gz

Requires:       java-1.7.0-openjdk
Requires:       nginx
Requires:       tomcat7

%description
Configuration of ukgov-ld linked data registry

%prep
%setup -q


%install
rm -rf $RPM_BUILD_ROOT
install -D etc/sudoers.d/reg-sudoers.conf $RPM_BUILD_ROOT/etc/sudoers.d/reg-sudoers.conf
install -D etc/nginx/conf.d/reg-nginx.conf $RPM_BUILD_ROOT/etc/nginx/conf.d/reg-nginx.conf
install -D -d opt/ldregistry $RPM_BUILD_ROOT/opt/ldregistry
install -D var/lib/tomcat7/webapps/ROOT.war $RPM_BUILD_ROOT/var/lib/tomcat7/webapps/ROOT.war

%pre
SERVICE='tomcat'#7
if ps ax | grep -v grep | grep $SERVICE > /dev/null
then
    service tomcat7 stop
fi
alternatives --set java /usr/lib/jvm/jre-1.7.0-openjdk.x86_64/bin/java
rm -rf /var/lib/tomcat7/webapps/ROOT
rm -rf /var/lib/tomcat7/webapps/ROOT.war
rm -rf /var/opt/ldregistry/userstore/db.lck
rm -rf /var/opt/ldregistry/userstore/dbex.lck


declare -a arr=("/var/log/ldregistry" "/var/opt/ldregistry")

for sd in "${arr[@]}"
do
    if [[ ! -d $sd ]]; then
	mkdir -p $sd
	chown root:tomcat $sd
	chmod 775 $sd
    fi
done

%post
ln -s /opt/oauth/oauth.conf /opt/ldregistry/config/oauth.conf
service tomcat7 start

%clean
rm -rf $RPM_BUILD_ROOT



%files
/etc/sudoers.d/reg-sudoers.conf
/etc/nginx/conf.d/reg-nginx.conf
%defattr(775,root,tomcat,775)
/opt/ldregistry
/var/lib/tomcat7/webapps/ROOT.war


%changelog
* Tue Jul 28 2015 markh <markh@metarelate.net> - 1.0-1
- Initial version
