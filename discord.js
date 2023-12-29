const { Webhook, MessageBuilder } = require("discord-webhook-node");
let url =
  "https://discord.com/api/webhooks/1190104812113625159/Z3nqKSbZcDF4oTMgG92CHalOkMU3hu6FN8MD_xWeraOVYQKtAuFea0OYNbPL6bFEJmDJ";
const hook = new Webhook(url);

const embed = new MessageBuilder()
  .setTitle("Swap")
  .setAuthor(
    "Pow",
    "https://cdn.discordapp.com/embed/avatars/0.png",
    "https://www.google.com"
  )
  .setURL("https://www.google.com")
  .addField("First field", "this is inline", true)
  .addField("Second field", "this is not inline")
  .setColor("#00b0f4")
  .setThumbnail("https://cdn.discordapp.com/embed/avatars/0.png")
  .setDescription("Oh look a description :)")
  .setImage("https://cdn.discordapp.com/embed/avatars/0.png")
  .setFooter(
    "Hey its a footer",
    "https://cdn.discordapp.com/embed/avatars/0.png"
  )
  .setTimestamp();

hook.send(embed);


