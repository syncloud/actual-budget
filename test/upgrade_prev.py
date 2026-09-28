from subprocess import check_output

import pytest
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from syncloudlib.http import wait_for_rest
from syncloudlib.integration.hosts import add_host_alias

TMP_DIR = '/tmp/syncloud'
APP = 'actual-budget'

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


@pytest.fixture(scope="session")
def module_setup(request, device, artifact_dir):
    def module_teardown():
        device.run_ssh('mkdir -p {0}'.format(TMP_DIR), throw=False)
        device.run_ssh('journalctl | tail -3000 > {0}/upgrade-prev.journalctl.log'.format(TMP_DIR), throw=False)
        device.scp_from_device('{0}/*'.format(TMP_DIR), artifact_dir, throw=False)
        check_output('chmod -R a+r {0}'.format(artifact_dir), shell=True)

    request.addfinalizer(module_teardown)


def test_start(module_setup, app, device_host, domain, device):
    add_host_alias(app, device_host, domain)
    device.activated()
    device.run_ssh('mkdir -p {0}'.format(TMP_DIR), throw=False)


def test_install_prev(device, app_domain):
    device.run_ssh('snap remove --purge {0}'.format(APP), throw=False)
    device.run_ssh('rm -rf /opt/disk/internal/{0} /opt/disk/external/{0}'.format(APP), throw=False)
    device.run_ssh('snap install {0}'.format(APP), retries=10)
    wait_for_rest(requests.session(), "https://{0}".format(app_domain), 200, 100)
