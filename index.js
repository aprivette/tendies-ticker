const Discord = require("discord.js");
const DiscordRSS = require('discord.rss')
const rp = require("request-promise");
const moment = require("moment-timezone");
require('dotenv').config()

const client = new Discord.Client();
const drss = new DiscordRSS.Client({ database: { uri: './sources' } });

const crypto = require("./resources/digital_currency_list.json");

var port = process.env.PORT || 3000;

client.on("ready", () => {
  console.log("Bot has started");
});

client.on("message", async message => {
  if(message.author.bot) return;
  if(message.content.indexOf(process.env.PREFIX) !== 0) return;

  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toUpperCase();

  var params = {
    apikey: process.env.ALPHA_VANTAGE_KEY
  };

  if (crypto.includes(command)) {
    var is_crypto = true;
    var url_prefix = "https://www.cryptocompare.com/coins/";

    params.function = "CURRENCY_EXCHANGE_RATE";
    params.from_currency = command;
    params.to_currency = "USD";
  } else {
    var is_crypto = false;
    var url_prefix = "https://www.marketwatch.com/investing/stock/";

    params.symbol = command;
    params.function = "GLOBAL_QUOTE";
    params.adjusted = "false";
  }

  var request = rp({uri: "https://www.alphavantage.co/query", qs: params}).then(body => {
    var body_parsed = JSON.parse(body);
    var body_keys = Object.keys(body_parsed);

    if (body_keys[0] === 'Error Message') {
      return;
    }

    if (is_crypto === true) {
      var results_key = body_keys[0];
      var results = body_parsed[results_key];

      var close = results['5. Exchange Rate'];
      var tzAdjusted = moment.tz(results['6. Last Refreshed'], "UTC");
      tzAdjusted.tz("America/New_York");
    } else {
      var results_key = body_keys[0];
      var results = body_parsed[results_key];

      var close = results["05. price"];
      var tzAdjusted = moment();
    }

    var symbol_lower = command.toLowerCase();

    var message = {
      embed: {
        title: `${command}`,
        url: `${url_prefix}${symbol_lower}`,
        fields: [{
            name: `$${close}`,
            value: 'Latest price from Alpha Vantage'
          }
        ],
        timestamp: tzAdjusted
      }
    }

    return message;
  }).catch(error => {
    console.log(error);
    return "Error! Could not retrieve symbol data.";
  });

  var out = await request;

  if (out) {
    const m = await message.channel.send(out);
  }
});

client.login(process.env.TOKEN);
drss.login(client);
