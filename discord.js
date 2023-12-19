const axios = require("axios");
let url =
    "https://discord.com/api/webhooks/950381536346243143/mzQGIwhluhggIHdbePYhJHZVAza539EwZHR0LzL-UXzeoKZzphHZiQOFD7mYm7FC6Ax5";

const sendMsg = async function (msg) {
    let message = {
        username: "Captain_Whale",
        content: msg,
    };
    let result = await axios.post(url, message)
        .then(async function (res) {
            console.log("res : ", res.data);
        })
        .catch(async function (err) {
            console.log("err : ", err);
        });
};

sendMsg("<b>tseee</b> sss");