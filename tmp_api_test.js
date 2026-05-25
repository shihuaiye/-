(async () => {
  try {
    const base = 'http://localhost:3100/api';
    const h = await (await fetch(base + '/health')).json();
    console.log('HEALTH', JSON.stringify(h));

    const username = 'qa_buyer_' + Date.now();
    const reg = await (
      await fetch(base + '/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password: 'pass', role: 'user' }),
      })
    ).json();
    console.log('REGISTER', JSON.stringify(reg));
    const token = reg.data?.token;
    if (!token) throw new Error('no token');

    const products = await (await fetch(base + '/products', { headers: { Authorization: 'Bearer ' + token } })).json();
    console.log('PRODUCTS_COUNT', (products.data || []).length);
    if (!products.data || products.data.length === 0) throw new Error('no products');
    const pid = products.data[0].id;

    const purchase = await (await fetch(base + '/products/' + pid + '/purchase', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })).json();
    console.log('PURCHASE', JSON.stringify(purchase));
    const orderId = purchase.data?.order?.id;
    if (!orderId) throw new Error('no order id');

    const rate = await (await fetch(base + '/orders/' + orderId + '/rate', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ rating: 8 }) })).json();
    console.log('RATE', JSON.stringify(rate));

    const orders = await (await fetch(base + '/orders', { headers: { Authorization: 'Bearer ' + token } })).json();
    console.log('ORDERS', JSON.stringify(orders));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
