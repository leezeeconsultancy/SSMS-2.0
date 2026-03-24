const dns = require('dns');

// Force Google DNS
dns.setServers(['8.8.8.8']);

const target = '_mongodb._tcp.cluster0.kvxcdxq.mongodb.net';

console.log('--- Forced Google DNS SRV Lookup ---');
dns.resolveSrv(target, (err, addresses) => {
  if (err) {
    console.error('Forced DNS SRV Error:', err.code, err.message);
  } else {
    console.log('Forced DNS SRV Success:');
    console.log(JSON.stringify(addresses, null, 2));
  }
});
