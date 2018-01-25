const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require("./config.json");
const weather = require('weather-js');
const ytdl = require ("ytdl-core");
const cheerio = require('cheerio'),
      snekfetch = require('snekfetch'),
      querystring = require('querystring');
const prefix = "!";
var servers = {};

function play (connection, message) {
    var server = servers[message.guild.id];
    server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: "audioonly"}));
    server.queue.shift();
    server.dispatcher.on("end", function(){
        if (server.queue[0]) play(connection, message);
        else connection.disconnect();
    });
}

async function googleCommand(msg, args) {

  
    // These are our two variables. One of them creates a message while we preform a search,
    // the other generates a URL for our crawler.
    let searchMessage = await  args.reply('Searching... Sec.');
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(msg)}`;

    // We will now use snekfetch to crawl Google.com. Snekfetch uses promises so we will
    // utilize that for our try/catch block.
    return snekfetch.get(searchUrl).then((result) => {

    // Cheerio lets us parse the HTML on our google result to grab the URL.
    let $ = cheerio.load(result.text);

    // This is allowing us to grab the URL from within the instance of the page (HTML)
    let googleData = $('.r').first().find('a').first().attr('href');

    // Now that we have our data from Google, we can send it to the channel.
    googleData = querystring.parse(googleData.replace('/url?', ''));
    searchMessage.edit(`Result found!\n${googleData.q}`);

// If no results are found, we catch it and return 'No results are found!'
}).catch((err) => {
    searchMessage.edit('No results found!');
});
}

bot.on('ready', () =>{

    console.log('Bot iniciado.')
});

bot.on ('message', async message =>{

    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const sender = message.author;
    var args = message.content.slice(prefix.length).trim().split(" ");
    var command = args.shift().toLowerCase();
    
    switch(command) {

        case "play":
            if (!args.join("")) {
                message.channel.send("Ingrese un link por favore");
                return;
            }
            if (!message.member.voiceChannel) {
                message.channel.send("Tenes que estar en un canal de voz");
                return;
            }
            if (!servers[message.guild.id]) servers[message.guild.id] = {
                queue: []
            };

            var server = servers[message.guild.id];

            server.queue.push(args.join(""));

            if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection) {
                play(connection, message);           
                return;
            });
            break;
        case "skip":

            var server = servers [message.guild.id];
            if (server.dispatcher) server.dispatcher.end();
            break;

        case "stop":
            var server = servers [message.guild.id];

            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

        case "say":
             // makes the bot say something and delete the message. As an example, it's open to anyone to use. 
            // To get the "message" itself we join the `args` back into a string with spaces: 
            const sayMessage = args.join(" ");
            // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
            message.delete().catch(O_o=>{}); 
            // And we get the bot to say the thing: 
            message.channel.send(sayMessage);
            break;

        case "ping":
            const m = await message.channel.send("Ping?");
            m.edit(`Pong! La latencia es ${m.createdTimestamp - message.createdTimestamp}ms. API Latencia es ${Math.round(bot.ping)}ms`);
            break;

        case "purge":
            
            if (!message.member.roles.find("name", "bot-commander")){
                message.channel.send('Necesitas los permisos necesarios.')
                return;
            }

            // This command removes all messages from all users in the channel, up to 100.
            // get the delete count, as an actual number.
            const deleteCount = parseInt(args[0], 10);
    
            // Ooooh nice, combined conditions. <3
            if(!deleteCount || deleteCount < 2 || deleteCount > 100)
              return message.reply("Ingrese un numero del 2 al 100 para borar la cnatidad de mensajes");
            
            // So we get our messages, and delete them. Simple enough, right?
            const fetched = await message.channel.fetchMessages({count: deleteCount});
            message.channel.bulkDelete(fetched)
                .catch(error => message.reply(`No se puedo borar debido a : ${error}`));
            break;

        case "clima":
            weather.find({search: args.join(" "), degreeType: "C"}, function(err, result){
                if (err) message.channel.send(err);

                if (result === undefined || result.length === 0){
                    message.channel.send('Ingrese una locacion valida')
                    return;
                }

                var current = result[0].current;
                var location = result[0].location;

                const embed = new Discord.RichEmbed()
                    .setDescription(`**${current.skytext}**`)
                    .setAuthor(`Clima para ${current.observationpoint}`)
                    .setThumbnail(current.imageUrl)
                    .setColor(0x00AE86)
                    .addField('Zona horaria',`UTC ${location.timezone}`, true)
                    .addField('Tipos de Grados',`Celcius`, true)
                    .addField('Temperatura', `${current.temperature} Grados`, true)
                    .addField('Se siente', `${current.feelslike} Grados`, true)
                    .addField('Vientos',current.winddisplay, true)
                    .addField('Humedad', `${current.humidity}`, true)

                    message.channel.send({embed});
            });
            break;
        case "search":
            googleCommand(args, message);
            break;
        case "pin":
            
    }
}); 

bot.on ('message', message => {

    if(message.author.bot) return;
    const msg = message.content.toLowerCase();
    
    if (msg === 'chiquita'){
        message.reply('¿Callate un poco queres?', {
            tts:true
        })
    }
    if (msg.startsWith("hola jiss")){
        message.channel.send('Hola '+ message.author, {
            tts:true
        })
    }
    if (msg.startsWith("jiss")){
        message.channel.send('¿Que desea?'+ message.author, {
            tts:true
        })
    }

    
    const swearWords = ["puto", "gil", "conchudo", "shite", "hijo de puta", "la concha de tu madre"];
    const alagos = ["come piroca", "chupame la pija","te meto un dedo en el culo hermosa"];
    if( swearWords.some(word => msg.includes(word)) ) {
        message.reply(`Deja de decir esas cosas 😡`, {
            tts:true
        });
    }
    if( alagos.some(word => msg.includes(word)) ) {
        message.reply(`Todo el dia papi 😘`, {
            tts:true
        });
    }
});


bot.login(config.token);