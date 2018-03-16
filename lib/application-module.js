const CoreObject = require ('./object');
const debug  = require ('debug') ('blueprint:application-module');
const path   = require ('path');

const {
  merge
} = require ('lodash');

const fs     = require ('fs-extra');
const Loader = require ('./loader');
const ListenerLoader = require ('./listener-loader');

const BUILTIN_ENTITIES = [
  { name: 'models'},
  { name: 'listeners', loader: new ListenerLoader () },
  { name: 'controllers'},
  { name: 'policies'},
  { name: 'validators'},
  { name: 'sanitizers'},
  { name: 'routers'}
];

module.exports = CoreObject.extend ({
  /// The application path for the module.
  appPath: null,

  /// The path where the views are located.
  _viewsPath: null,

  /// The loader used by the application module.
  _defaultLoader: new Loader (),

  init () {
    this._super.init.apply (this, arguments);
    this._resources = {};

    // Define the setters/getters for the object.

    Object.defineProperty (this, 'viewsPath', {
      get () {
        return path.join (this.appPath, 'views');
      }
    });

    Object.defineProperty (this, 'hasViews', {
      get () {
        try {
          return fs.statSync (this.viewsPath).isDirectory ();
        }
        catch (ex) {
          return false;
        }
      }
    });

    Object.defineProperty (this, 'resources', {
      get () { return this._resources; }
    });
  },

  /**
   * Test of the application module has views.
   *
   * @returns {boolean}
   */
  get hasViews () {
    try {
      return fs.statSync (this.viewsPath).isDirectory ();
    }
    catch (ex) {
      return false;
    }
  },

  /**
   * Configure the application module. This method will load all the resource
   * entities for the application module into memory.
   *
   * @returns {Promise<ApplicationModule>}
   */
  configure () {
    let promises = [];

    BUILTIN_ENTITIES.forEach (entity => {
      // Compute the location of the resources we are loading. Then load the resources
      // into memory and save the resources to our application module
      let location = entity.location || entity.name;
      let rcPath = path.resolve (this.appPath, location);
      let opts = merge ({dirname: rcPath}, entity.opts);

      debug (`loading ${entity.name} in ${rcPath}`);
      let loader = entity.loader || this._defaultLoader;

      promises.push (loader.load (opts));
    });

    return Promise.all (promises).then (results => {
      BUILTIN_ENTITIES.forEach ((entity, i) => {
        const {name} = entity;

        this._resources[name] = merge (this._resources[name] || {}, results[i]);
      });

      return Promise.resolve (this);
    });
  },

  /**
   * Read an application resource. If the callback is undefined, then the data in the
   * resource is returned to the caller.
   *
   * @param filename
   * @param callback
   * @returns {*}
   */
  resource (filename, callback) {
    let fullpath = path.resolve (this.appPath, 'resources', filename);

    if (callback)
      return fs.readFile (fullpath, callback);
    else
      return fs.readFileSync (fullpath);
  },

  /**
   * Merge an module with this module. It will copy all the entities from the
   * source module into this module. Any entity in the source module will overwrite
   * the entity in this module.
   *
   * @param module
   */
  merge (module) {
    return new Promise ((resolve) => {
      BUILTIN_ENTITIES.forEach (entity => {
        const {name} = entity;

        this.resources[name] = merge (this.resources[name] || {}, module.resources[name]);
      });

      resolve (null);
    });
  }
});