const bcrypt = require('bcryptjs');
const hash = '$2a$12$Z1x2E.9sL/nJzj4J5PqH/O/QY1zF.rTq3w5A8B.v7N6n1p/Lz7B72';
const pw = 'library@123';
bcrypt.compare(pw, hash).then(console.log).catch(console.error);
