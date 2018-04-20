/*
 * Copyright (c) 2018 One Hill Technologies, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {
  readJson,
  statSync
} = require ('fs-extra');

const path   = require ('path');
const assert = require ('assert');
const CoreObject = require ('./object');
const ApplicationModule = require ('./application-module');

const KEYWORD_BLUEPRINT_MODULE = 'blueprint-module';
const FILE_PACKAGE_JSON = 'package.json';

const {
  forEach,
  find,
} = require ('lodash');

const {
  computed
} = require ('./properties');

function isBlueprintModule (packageObj) {
  return packageObj.keywords && packageObj.keywords.indexOf (KEYWORD_BLUEPRINT_MODULE) !== -1;
}

module.exports = CoreObject.extend ({
  /// The target application for the loader.
  app: null,

  /// Collection of loaded modules.
  _modules: null,

  init () {
    this._super.call (this, ...arguments);
    this._modules = {};

    assert (!!this.app, 'You must define the app property');
  },

  load () {
    let packageFile = path.resolve (this.app.appPath, '..', FILE_PACKAGE_JSON);

    return readJson (packageFile).then (packageObj => {
      if (packageObj || packageObj.dependencies)
        return this._handleDependencies (packageObj.dependencies);
    });
  },

  _handleDependencies (dependencies) {
    let promises = [];

    forEach (dependencies, (version, name) => promises.push (this._handleNodeModule (name, version)));

    return Promise.all (promises);
  },

  _handleNodeModule (name, version) {
    // Open the package.json file for this node module, and determine
    // if the module is a Blueprint.js module.
    let modulePath;

    if (version.startsWith ('file:')) {
      // The file location is relative to the blueprint application.
      let relativePath = version.slice (5);
      modulePath = path.resolve (this.app.appPath, '..', relativePath);
    }
    else {
      modulePath = this._resolveModulePath (name);
    }

    const packageFile = path.resolve (modulePath, FILE_PACKAGE_JSON);

    return readJson (packageFile).then (packageObj => {
      // Do not continue if the module is not a Blueprint module, or we have
      // already loaded this module into memory.
      if (!isBlueprintModule (packageObj) || this._modules[name])
        return;

      // Create a new application module.
      const moduleAppPath = path.resolve (modulePath, 'app');

      const module = new ApplicationModule ({
        app: this.app,
        modulePath: moduleAppPath
      });

      this._modules[name] = module;

      // Load the dependencies for this module, then configure this module, and
      // then add this module to the application.
      const {dependencies} = packageObj;

      return this._handleDependencies (dependencies).then (() => {
        return module.configure ();
      }).then (module => {
        return this.app.addModule (name, module);
      });
    });
  },

  _resolveModulePath (name) {
    let basename = find (module.paths, basename => {
      let modulePath = path.resolve (basename, name, 'package.json');

      try {
        return statSync (modulePath).isFile ();
      }
      catch (err) {
        return false;
      }
    });

    if (!basename)
      throw new Error (`Cannot locate modules for ${name}`);

    return path.resolve (basename, name);
  }
});
