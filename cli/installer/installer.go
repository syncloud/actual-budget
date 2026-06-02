package installer

import (
	"bytes"
	"context"
	"fmt"
	cp "github.com/otiai10/copy"
	"github.com/syncloud/golib/config"
	"github.com/syncloud/golib/linux"
	"github.com/syncloud/golib/platform"
	"go.uber.org/zap"
	"io"
	"net"
	"net/http"
	"os"
	"path"
	"time"
)

type Variables struct {
	App          string
	StorageDir   string
	ServerFiles  string
	UserFiles    string
	AuthUrl      string
	AppUrl       string
	ClientSecret string
	Socket       string
}

const (
	App       = "actual-budget"
	AppDir    = "/snap/actual-budget/current"
	DataDir   = "/var/snap/actual-budget/current"
	CommonDir = "/var/snap/actual-budget/common"
)

type Installer struct {
	newVersionFile     string
	currentVersionFile string
	platformClient     *platform.Client
	installFile        string
	logger             *zap.Logger
}

func New(logger *zap.Logger) *Installer {
	return &Installer{
		newVersionFile:     path.Join(AppDir, "version"),
		currentVersionFile: path.Join(DataDir, "version"),
		platformClient:     platform.New(),
		installFile:        path.Join(CommonDir, "installed"),
		logger:             logger,
	}
}

func (i *Installer) Install() error {
	return i.UpdateConfigs()
}

func (i *Installer) Configure() error {
	if i.IsInstalled() {
		if err := i.Upgrade(); err != nil {
			return err
		}
	} else {
		if err := i.Initialize(); err != nil {
			return err
		}
	}
	return i.BootstrapOpenID()
}

func (i *Installer) IsInstalled() bool {
	_, err := os.Stat(i.installFile)
	return err == nil
}

func (i *Installer) Initialize() error {
	if err := i.StorageChange(); err != nil {
		return err
	}
	if err := os.WriteFile(i.installFile, []byte("installed"), 0644); err != nil {
		return err
	}
	return i.UpdateVersion()
}

func (i *Installer) Upgrade() error {
	if err := i.StorageChange(); err != nil {
		return err
	}
	return i.UpdateVersion()
}

func (i *Installer) PreRefresh() error {
	return nil
}

func (i *Installer) PostRefresh() error {
	if err := i.UpdateConfigs(); err != nil {
		return err
	}
	if err := i.ClearVersion(); err != nil {
		return err
	}
	return i.FixPermissions()
}

func (i *Installer) AccessChange() error {
	return i.UpdateConfigs()
}

func (i *Installer) StorageChange() error {
	storageDir, err := i.platformClient.InitStorage(App, App)
	if err != nil {
		return err
	}
	if err := i.createMissingDirs(
		path.Join(storageDir, "server-files"),
		path.Join(storageDir, "user-files"),
	); err != nil {
		return err
	}
	return linux.Chown(storageDir, App)
}

func (i *Installer) ClearVersion() error {
	return os.RemoveAll(i.currentVersionFile)
}

func (i *Installer) UpdateVersion() error {
	return cp.Copy(i.newVersionFile, i.currentVersionFile)
}

func (i *Installer) UpdateConfigs() error {
	if err := linux.CreateUser(App); err != nil {
		return err
	}
	if err := i.StorageChange(); err != nil {
		return err
	}
	if err := i.createMissingDirs(path.Join(DataDir, "nginx")); err != nil {
		return err
	}

	storageDir, err := i.platformClient.InitStorage(App, App)
	if err != nil {
		return err
	}
	if err := i.GenerateConfig(storageDir); err != nil {
		return fmt.Errorf("generate config: %w", err)
	}

	return i.FixPermissions()
}

func (i *Installer) GenerateConfig(storageDir string) error {
	password, err := i.platformClient.RegisterOIDCClient(App, "/openid/callback", true, "client_secret_basic")
	if err != nil {
		return fmt.Errorf("oidc register: %w", err)
	}
	authUrl, err := i.platformClient.GetAppUrl("auth")
	if err != nil {
		return err
	}
	appUrl, err := i.platformClient.GetAppUrl(App)
	if err != nil {
		return err
	}

	variables := Variables{
		App:          App,
		StorageDir:   storageDir,
		ServerFiles:  path.Join(storageDir, "server-files"),
		UserFiles:    path.Join(storageDir, "user-files"),
		AuthUrl:      authUrl,
		AppUrl:       appUrl,
		ClientSecret: password,
		Socket:       path.Join(DataDir, "actual.sock"),
	}

	return config.Generate(
		path.Join(AppDir, "config"),
		path.Join(DataDir, "config"),
		variables,
	)
}

func (i *Installer) BootstrapOpenID() error {
	payload, err := os.ReadFile(path.Join(DataDir, "config", "bootstrap.json"))
	if err != nil {
		return err
	}
	socket := path.Join(DataDir, "actual.sock")
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				return (&net.Dialer{}).DialContext(ctx, "unix", socket)
			},
		},
	}

	ready := false
	for attempt := 0; attempt < 60; attempt++ {
		resp, err := client.Get("http://localhost/account/needs-bootstrap")
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				if bytes.Contains(body, []byte(`"bootstrapped":true`)) {
					i.logger.Info("openid already bootstrapped")
					return nil
				}
				ready = true
				break
			}
		}
		time.Sleep(2 * time.Second)
	}
	if !ready {
		return fmt.Errorf("actual server did not become ready for openid bootstrap")
	}

	for attempt := 0; attempt < 30; attempt++ {
		resp, err := client.Post("http://localhost/account/bootstrap", "application/json", bytes.NewReader(payload))
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK || bytes.Contains(body, []byte("already-bootstrapped")) {
				i.logger.Info("openid bootstrap ok")
				return nil
			}
			i.logger.Info("openid bootstrap retry", zap.Int("status", resp.StatusCode), zap.ByteString("body", body))
		} else {
			i.logger.Info("openid bootstrap error", zap.Error(err))
		}
		time.Sleep(3 * time.Second)
	}
	return fmt.Errorf("openid bootstrap failed")
}

func (i *Installer) FixPermissions() error {
	if err := linux.Chown(DataDir, App); err != nil {
		return err
	}
	return linux.Chown(CommonDir, App)
}

func (i *Installer) BackupPreStop() error    { return i.PreRefresh() }
func (i *Installer) RestorePreStart() error  { return i.PostRefresh() }
func (i *Installer) RestorePostStart() error { return i.Configure() }

func (i *Installer) createMissingDirs(dirs ...string) error {
	for _, dir := range dirs {
		if err := createMissingDir(dir); err != nil {
			i.logger.Error("cannot create dir", zap.String("dir", dir), zap.Error(err))
			return err
		}
	}
	return nil
}

func createMissingDir(dir string) error {
	_, err := os.Stat(dir)
	if os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	return nil
}
