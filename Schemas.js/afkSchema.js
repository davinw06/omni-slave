const { model, Schema } = require('mongoose');

const afkSchema = new Schema({
    User: String,
    Guild: String,
    Message: String,
})

module.exports = model("afks", afkSchema);