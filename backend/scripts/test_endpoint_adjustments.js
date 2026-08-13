import http from 'http';

http.get('http://localhost:5000/api/stock/adjustments', (res) => {
  console.log('GET /api/stock/adjustments status code:', res.statusCode);
  res.on('data', d => console.log(d.toString()));
}).on('error', (e) => {
  console.error('Error connecting to backend:', e.message);
});
