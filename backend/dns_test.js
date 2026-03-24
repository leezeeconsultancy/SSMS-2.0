const dns = require('dns');

const target = '_mongodb._tcp.cluster0.kvxcdxq.mongodb.net';

console.log('--- DNS SRV Lookup Test ---');
console.log('Target:', target);

dns.resolveSrv(target, (err, addresses) => {
  if (err) {
    console.error('DNS SRV Resolve Error:', err.code, err.message);
    
    // Try standard lookup as well
    dns.lookup('cluster0.kvxcdxq.mongodb.net', (err2, address, family) => {
      if (err2) {
        console.error('Standard Lookup Error:', err2.code, err2.message);
      } else {
        console.log('Standard Lookup Success:', address, '(IPv' + family + ')');
      }
    });
  } else {
    console.log('DNS SRV Resolve Success:');
    console.log(JSON.stringify(addresses, null, 2));
  }
});
