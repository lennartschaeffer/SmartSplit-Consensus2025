const axios = require('axios')

let res;

const returnCurrencies = async (amount, currency) => {
    switch (currency) {
        case 'CAD':
            res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=cad');
            return (amount / res.data.aptos.cad);
        case 'USD':
            res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd');
            return (amount / res.data.aptos.usd);
        default:
            res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=cad');
            return (amount / res.data.aptos.cad);
    }
}

module.exports = returnCurrencies;