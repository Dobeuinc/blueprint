var xpression = require ('../../../xpression')
  ;


var schema = new xpression.Schema ({
  /// Username for the account.
  firstname : { type: String, trim: true, required: true },

  /// Encrypted password
  lastname : { type: String, trim: true, required: true},
});

const COLLECTION_NAME  = 'blueprint_testmodel2';
module.exports = exports = xpression.model (COLLECTION_NAME, schema);
