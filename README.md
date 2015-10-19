# registry-config-base

Provides configuration, UI templates and docker deployment for a starting registry installation.

Custom installations can fork this repository then customize the configuration and UI files. This makes it possible to pull in an merge upstream UI fixes made in this base repository.

## Deployment 

docker build -t registry .
docker run --privileged -d -p [desired host port]:80 registry

## Known Issues

ngnix runs but may not be being started correctly by supervisor 

## Layout

Directory | Role
---|---
`ldregistry` | A starting set of configuration files and templates which should be install in `/opt/ldregistry` on the target system. For details of the role of these files see [Configuration](https://github.com/UKGovLD/registry-core/wiki/Configuration)
`install` | Files used to configure the front end nginx proxy
`scripts` | Example installation scripts

## Customizing the configuration

The base configuration is based on the UK Government Environment registry. 

Files in `ldregistry` which make require customization are:

File | Role
---|---
`templates` | Velocity templates which implement the registry UI, particular targets for customization are ...
`templates/about.vm` | Provides descriptive information on the registry instance
`templates/header.vm` | Customize included style sheets and default page title
`templates/main.vm` | Customize landing page including main title
`ui` | Style sheets and associated javascript and images, the ones here are based on bootstrap3
`boot` | Initial register contents
`config` | Configuration files for the registry instance see [Configuration](https://github.com/UKGovLD/registry-core/wiki/Configuration)

