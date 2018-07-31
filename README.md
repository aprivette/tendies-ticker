# Tendies Ticker

A really simple and sloppy Discord bot for checking live price data on stocks and cryptocurrencies. Responds with a live price for any valid US stock and most crypto symbols. Ex. mentioning $AMD will return the live price or market closing price.

To use it you'll need an API key from Alpha Vantage which you can find [here](https://www.alphavantage.co/support/#api-key).

1. Create a config.json file with the following contents.

```
{
  "token": "ABCDEFG",
  "prefix": "$",
  "alpha_vantage_key": "1234567890"
}
```

2. `node index.js`
3. Hook it up to your discord channel.