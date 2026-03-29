import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('ok'));
const server = app.listen(3002, () => {
  console.log('Test server on 3002');
});
server.on('error', (e) => console.error('Server error', e));
process.on('exit', (code) => console.log('Process exiting with code', code));
