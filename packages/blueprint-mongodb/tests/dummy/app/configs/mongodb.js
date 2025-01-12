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

module.exports = {
  connections: {
    $default: {
      uri: 'mongodb://localhost/blueprint_mongodb',
      version: 3,
      seed: true,

      options : {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        readPreference: "primary",
        forceServerObjectId: false,
        writeConcern: {
          w: 1,
        },
        keepAlive: 1,
        poolSize: 5,
      }
    },

    secondary : {
      uri: 'mongodb://localhost/blueprint_mongodb',
      seed: false,
      options : {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        readPreference: "primary",
        forceServerObjectId: false,
        writeConcern: {
          w: 1,
        },
        keepAlive: 1,
        poolSize: 5,
      }
    }
  }
};