/*
 * Copyright (c) 2021 One Hill Technologies, LLC
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

/**
 * Helper method to get the error code and message for a policy failure.
 *
 * @param result
 * @param policy
 * @returns {{code, message}}
 */

const { isPlainObject } = require ('lodash');

module.exports = function handlePolicyFailure (result, policy) {
  let code, message;

  if (isPlainObject (result)) {
    // Try and get the code and message from the result object.
    code = result.code;
    message = result.message;
  }

  // Fallback to the code and message in the policy instance.
  if (!code)
    code = policy.code;

  if (!message)
    message = policy.message;

  return { code, message };
}
