var uid       = require ('uid-safe')
  , blueprint = require ('blueprint')
  ;

// We have to manually load the references models since the models
// will not be accessible via <blueprint> until all models are loaded.
var Client  = require ('../Client')
  , Account = require ('../Account')
  ;

const DEFAULT_TOKEN_LENGTH = 128;

var Schema = blueprint.Schema;

var schema = new Schema ({
  token         : {type: String, index: true, required: true},
  refresh_token : {type: String, index: true},
  client        : {type: Schema.Types.ObjectId, required: true, ref: Client.modelName},
  account       : {type: Schema.Types.ObjectId, ref: Account.modelName},
  expires_at    : {type: Date, required: true, default: Date.now},
  enabled       : {type: Boolean, required: true, default : true}
});

/**
 * Create a new user token, and save the token to the database.
 *
 * @param length
 * @param client
 * @param user
 * @param done
 */
schema.statics.newUserToken = function (client, user, done) {
  var token = uid.sync (DEFAULT_TOKEN_LENGTH);
  var refreshToken = uid.sync (DEFAULT_TOKEN_LENGTH);

  var query   = {account : user, client : client};
  var data    = {token : token, refresh_token : refreshToken, enabled : true};
  var options = {upsert : true, new : true};

  this.findOneAndUpdate (query, data, options, done);
};

schema.statics.generateToken = function () {
  return uid.sync (DEFAULT_TOKEN_LENGTH);
};

/**
 * Create a new client token and add it to the database.
 *
 * @param length
 * @param client
 * @param scope
 * @param done
 */
schema.statics.newClientToken = function (client, scope, done) {
  var token   = uid.sync (DEFAULT_TOKEN_LENGTH);
  var query   = {client : client};
  var data    = {token: token, client: client, enabled : true};
  var options = {upsert : true, new : true};

  this.findOneAndUpdate (query, data, options, done);
};

/**
 * Refresh an access token.
 *
 * @param length
 * @param client
 * @param refreshToken
 * @param done
 */
schema.statics.refresh = function (client, refreshToken, done) {
  var query = {client : client, refresh_token: refreshToken};
  var data  = {token : uid.sync (DEFAULT_TOKEN_LENGTH), refresh_token : uid.sync (DEFAULT_TOKEN_LENGTH)};

  this.findOneAndUpdate (query, data, done);
};

/**
 * Retrieve how many seconds the access token expires in. This is calculated based
 * on the difference of the current time and when the access token actually expires.
 */
schema.virtual ('expires_in').get (function () {
  return 3600;
});

const COLLECTION_NAME = 'gatekeeper_oauth2_accesstoken';
module.exports = exports = blueprint.model (COLLECTION_NAME, schema);
