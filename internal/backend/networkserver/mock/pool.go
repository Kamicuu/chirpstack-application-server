package mock

import (
	"github.com/kamicuu/chirpstack-api/go/v3/ns"
	"github.com/kamicuu/chirpstack-application-server/internal/backend/networkserver"
)

// Pool is a network-server pool for testing.
type Pool struct {
	Client      ns.NetworkServerServiceClient
	GetHostname string
}

// Get returns the Client.
func (p *Pool) Get(hostname string, caCert, tlsCert, tlsKey []byte) (ns.NetworkServerServiceClient, error) {
	p.GetHostname = hostname
	return p.Client, nil
}

// NewPool creates a network-server client pool which always
// returns the given client on Get.
func NewPool(client ns.NetworkServerServiceClient) networkserver.Pool {
	return &Pool{
		Client: client,
	}
}
