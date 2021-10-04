import Discord from 'discord.js';
import fetch from 'node-fetch';

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const port = process.env.PORT || 3000;

client.on('ready', () => {
  console.log('Bot has started');
});

client.on('messageCreate', async message => {
  if(message.author.bot) return;
  if(message.content.indexOf(process.env.PREFIX) !== 0) return;

  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toUpperCase();
  
  let tickerType;
  
  if (message.content.includes('crypto')) tickerType = 'crypto';
  if (message.content.includes('stock')) tickerType = 'stock';
  
  let out;
  
  if (tickerType !== 'crypto' && (tickerType === 'stock' || typeof tickerType === 'undefined')) {
    const alphaVantageParams = new URLSearchParams({
      apikey: process.env.ALPHA_VANTAGE_KEY,
      symbol: command,
      'function': 'GLOBAL_QUOTE',
      adjusted: 'false',
    });
    
    const res = await fetch(`https://www.alphavantage.co/query?${alphaVantageParams.toString()}`)
    
    if (res.ok) {
      const data = await res.json();
      const stock = data['Global Quote'];

      if (Object.entries(stock).length !== 0) {
        const dateTime = new Date();
        const dtString = dateTime.toLocaleString('en-US', {
          dateStyle: 'long',
          timeStyle: 'short',
        });
        
        const price = stock['05. price'];
        let change = stock['10. change percent'];
        if (change.substring(0, 1) !== '-') change = `+${change}`;
        
        out = {
          embeds: [{
            title: `${stock['01. symbol']} (Stock)`,
            url: `https://www.marketwatch.com/investing/stock/${stock['01. symbol'].toLowerCase()}/`,
            fields: [{
              name: `Latest quote from AlphaVantage as of ${dtString}.`,
              value: `Price: $${price} | 24h Change: ${change}`,
            }],
          }],
        };
      }
    }
  }
  
  if (tickerType === 'crypto' || typeof out === 'undefined') {
    const coinMarketCapQuery = new URLSearchParams({
      'symbol': command,
    });
    
    const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?${coinMarketCapQuery.toString()}`, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_KEY,
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      
      for (const i in data.data) {
        const coin = data.data[i];
        const dateTime = new Date(coin.last_updated);
        const dtString = dateTime.toLocaleString('en-US', {
          dateStyle: 'long',
          timeStyle: 'short',
        });
        
        const price = (Math.round(coin.quote.USD.price * 40) / 40).toString();
        let change = coin.quote.USD.percent_change_24h;
        if (change >= 0) change = `+${change}`;
        change = `${change}%`.toString();
        
        out = {
          embeds: [{
            title: `${coin.name} (Crypto)`,
            url: `https://coinmarketcap.com/currencies/${coin.slug}/`,
            fields: [{
              name: `Latest quote from CoinMarketCap as of ${dtString}.`,
              value: `Price: $${price} | 24h Change: ${change}`,
            }],
          }],
        };
      }
    }
  }

  if (typeof out !== 'undefined') {
    const m = await message.channel.send(out);
  }
});

client.login(process.env.TOKEN);
