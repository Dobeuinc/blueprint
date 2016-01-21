var winston = require ('winston')
  , path    = require ('path')
  , util    = require ('util')
  , fs      = require ('fs')
  ;

var Server            = require ('./Server')
  , RouterBuilder     = require ('./RouterBuilder')
  , Configuration     = require ('./Configuration')
  , Database          = require ('./Database')
  , ApplicationModule = require ('./ApplicationModule')
  , Framework         = require ('./Framework')
  , Path              = require ('./Path')
  ;

var SEED_FILE_SUFFIX = '.seed.js';

/**
 * @class Application
 *
 * The main Blueprint.js application.
 *
 * @param appPath
 * @constructor
 */
function Application (appPath) {
  ApplicationModule.call (this, appPath);

  this._modules = {};
}

util.inherits (Application, ApplicationModule);

/**
 * Initialize the application.
 */
Application.prototype.init = function () {
  winston.log ('info', 'application path: %s', this.appPath);

  // First, make sure there is a data directory. This is where the application stores
  // all its internal information.
  var dataPath = Path.resolve (this.appPath, 'data');
  dataPath.createIfNotExists ();

  // Load all configurations first. This is because other entities in the
  // application may need the configuration object for initialization.
  var configPath = path.join (this.appPath, 'configs');
  this._config = Configuration (configPath, this.env);

  // Initialize the database object, if a configuration exists. If we
  // have a database configuration, then we can have models.
  if (this._config['database']) {
    this._db = new Database (this._config['database']);
    this._db.setMessenger (Framework().messaging);

    // Force loading of the models since we have a database. If there
    // was not database in the application, then we would not load any
    // of the models.
    this.models;
  }

  // Make the server object.
  this._server = new Server (this.appPath, this._config['server']);

  if (this.getSupportsViews ())
    this._server.importViews (this.getViewsPath ());

  // Import the views of all the modules.
  for (var name in this._modules) {
    if (this._modules.hasOwnProperty (name)) {
      var module = this._modules[name];

      if (module.getSupportsViews ())
        this._server.importViews (module.getViewsPath ());
    }
  }

  // Make the router for the application. Then, install the router in the
  // server object. Part of loading the routers requires force loading of
  // the controllers. Otherwise, the router builder will not be able to
  // resolve any of the defined actions.
  var routersPath = path.resolve (this.appPath, 'routers');
  var routerBuilder = new RouterBuilder (routersPath, this.controllers);

  this._router = routerBuilder.addRouters (this.routers).getRouter ();

  // Set the main router for the server.
  this._server.setMainRouter (this._router);

  // Notify all listeners the application is initialized.
  Framework().messaging.emit ('app.init', this);
};

/**
 * Start the application. This method connects to the database, creates a
 * new server, and starts listening for incoming messages.
 *
 * @param callback
 */
Application.prototype.start = function (callback) {
  var self = this;

  function startListening (err) {
    if (err) return callback (err);

    self._server.listen (function () {
      Framework().messaging.emit ('app.start', self);
      process.nextTick (callback);
    });
  }

  // If there is a database, connect to the database. Otherwise, instruct
  // the server to start listening.
  if (this._db === undefined)
    return startListening (null);

  /**
   * Read all the files in the directory, and seed the database. To be a seed,
   * the file must end with .seed.js.
   *
   * @param db
   * @param dir
   */
  function seedDatabaseFromPath (db, dir) {
    var files = fs.readdirSync (dir);

    files.forEach (function (file) {
      if (!file.endsWith (SEED_FILE_SUFFIX))
        return;

      var collectionName = file.substring (0, SEED_FILE_SUFFIX.length - 1);
      var fullname = path.join (dir, file);
      var seed = require (fullname);

      db.seed (collectionName, seed, function (err, seed) {
        if (err) throw err;
      });
    });
  }

  this._db.connect (function (err) {
    if (err)
      return callback (err);

    // Load the general purpose seeds and environment specific seeds into
    // the database. Each seed is stored by its respective model name.
    var seedsPath = Path.resolve (self.appPath, 'seeds');

    if (seedsPath.exists ())
      seedDatabaseFromPath (self._db, seedsPath.path);

    var seedsEnvPath = Path.resolve (seedsPath.path, self.env);

    if (seedsEnvPath.exists ())
      seedDatabaseFromPath (self._db, seedsEnvPath.path);

    // Start listening for events from the outside.
    startListening (null);
  });
};

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('database', function () {
  if (!this._db)
    throw new Error ('application did not configure database');

  return this._db;
});

/**
 * Get the application database.
 */
Application.prototype.__defineGetter__ ('config', function () {
  return this._config;
});

/**
 * Get the application server.
 */
Application.prototype.__defineGetter__ ('server', function () {
  if (!this._server)
    throw new Error ('application did not configure server');

  return this._server;
});

/**
 * Add an application module to the application. An application module can only
 * be added once. Two application modules are different if they have the same
 * name, not module path. This will ensure we do not have the same module in
 * different location added to the application more than once.
 *
 * @param module
 */
Application.prototype.addModule = function (modulePath) {
  var appModule = new ApplicationModule (modulePath);

  if (this._modules.hasOwnProperty (appModule.name))
    throw new Error (util.format ('duplicate module: %s', appModule.name));

  this._modules[appModule.name] = appModule;

  if (this._server && appModule.getSupportsViews ())
    this._server.importViews (appModule.getViewsPath ());
};

module.exports = exports = Application;
