var _ = require('underscore');
module.exports = function() {
    var key = _.sample(process.env.API_KEYS.split(' '));
    console.log(`Api Key: ${key}`);
    return key;
}