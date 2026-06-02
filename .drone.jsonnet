local name = 'actual-budget';
local version = '25.2.1';
local go = '1.24.0';
local nginx = '1.24.0';
local python = '3.12-slim-bookworm';
local platform = '26.04.10';
local playwright = 'mcr.microsoft.com/playwright:v1.59.1-jammy';
local publisher_image = 'syncloud/store-publisher:stable-291';
local distros = ['bookworm', 'buster'];
local distro_default = 'bookworm';

local platform_image(distro, arch) =
  'syncloud/platform-' + distro + '-' + arch + ':' + platform;

local build(arch, ui) = [{
  kind: 'pipeline',
  type: 'docker',
  name: arch,
  platform: {
    os: 'linux',
    arch: arch,
  },
  steps: [
    {
      name: 'version',
      image: 'alpine:3.17.0',
      commands: [
        'echo $DRONE_BUILD_NUMBER > version',
      ],
    },
    {
      name: 'nginx',
      image: 'nginx:' + nginx,
      commands: [
        './nginx/build.sh',
      ],
    },
  ] + [
    {
      name: 'nginx test ' + distro,
      image: platform_image(distro, arch),
      commands: ['./nginx/test.sh'],
    }
    for distro in distros
  ] + [
    {
      name: 'actual',
      image: 'actualbudget/actual-server:' + version,
      commands: [
        './actual/build.sh',
      ],
    },
  ] + [
    {
      name: 'actual test ' + distro,
      image: platform_image(distro, arch),
      commands: ['./actual/test.sh'],
    }
    for distro in distros
  ] + [
    {
      name: 'cli',
      image: 'golang:' + go,
      commands: [
        './cli/build.sh',
      ],
    },
  ] + [
    {
      name: 'cli test ' + distro,
      image: platform_image(distro, arch),
      commands: ['./cli/test.sh'],
    }
    for distro in distros
  ] + [
    {
      name: 'package',
      image: 'debian:bookworm-slim',
      commands: [
        'VERSION=$(cat version)',
        './package.sh ' + name + ' $VERSION',
      ],
    },
  ] + [
         {
           name: 'test ' + distro_default,
           image: 'python:' + python,
           commands: ['./ci/integration.sh ' + arch],
         },
       ] + (if ui then [
         {
           name: 'test-ui-' + projectName,
           image: playwright,
           commands: ['./ci/ui.sh ' + projectName],
         }
         for projectName in ['desktop', 'mobile']
       ] else []) + [
    {
      name: 'publish',
      image: publisher_image,
      environment: {
        SYNCLOUD_TOKEN: { from_secret: 'SYNCLOUD_TOKEN' },
      },
      command: ['snap', '-c', '${DRONE_BRANCH}'],
      when: {
        branch: ['master', 'stable'],
        event: ['push'],
      },
    },
    {
      name: 'artifact',
      image: 'appleboy/drone-scp:1.6.4',
      settings: {
        host: { from_secret: 'artifact_host' },
        username: 'artifact',
        key: { from_secret: 'artifact_key' },
        timeout: '2m',
        command_timeout: '2m',
        target: '/home/artifact/repo/' + name + '/${DRONE_BUILD_NUMBER}-' + arch,
        source: 'artifact/*',
        strip_components: 1,
      },
      when: {
        status: ['failure', 'success'],
        event: ['push'],
      },
    },
  ],
  trigger: {
    event: ['push'],
  },
  services: [
    {
      name: name + '.' + distro_default + '.com',
      image: platform_image(distro_default, arch),
      privileged: true,
      volumes: [
        { name: 'dbus', path: '/var/run/dbus' },
        { name: 'dev', path: '/dev' },
      ],
    },
  ],
  volumes: [
    { name: 'dbus', host: { path: '/var/run/dbus' } },
    { name: 'dev', host: { path: '/dev' } },
  ],
}];

build('amd64', true) +
build('arm64', false) +
build('arm', false)
