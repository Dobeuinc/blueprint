const executePromise = require ('../../../../lib/middleware/execute-promise');
const {expect} = require ('chai');

describe ('lib | middleware | executePromise', function () {
  it ('should execute promise without error', function (done) {
    let req = {};
    let res = {};

    let middleware = executePromise (() => {
      return Promise.resolve (true);
    });

    middleware (req, res, (err) => {
      expect (err).to.be.undefined;
      done (null);
    });
  });

  it ('should execute promise that fails', function (done) {
    let req = {};
    let res = {};

    let middleware = executePromise (() => {
      return Promise.reject (new Error ('This execution failed'));
    });

    middleware (req, res, (err) => {
      expect (err.message).to.equal ('This execution failed');
      done (null);
    });
  });
});
