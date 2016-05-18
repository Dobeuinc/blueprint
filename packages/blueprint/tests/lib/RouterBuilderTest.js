var path    = require ('path')
  , expect  = require ('chai').expect
  , async   = require ('async')
  , request = require ('supertest')
  , util    = require ('util')
  ;

var ApplicationModule = require ('../../lib/ApplicationModule')
  , RouterBuilder     = require ('../../lib/RouterBuilder')
  , blueprint         = require ('../../lib')
  ;

describe ('RouterBuilder', function () {
  var routerBuilder;
  var routersPath;

  describe ('new RouterBuilder ()', function () {
    var appModule = new ApplicationModule ('test-module', path.resolve (__dirname, '../fixtures/app'));
    routersPath = path.resolve (__dirname, '../fixtures/app/routers');

    routerBuilder = new RouterBuilder (appModule.controllers);

    it ('should create a new RouterBuilder', function () {
      expect (routerBuilder._controllers).to.equal (appModule.controllers);
    });
  });
  
  describe ('#addRoutes', function () {
    var spec = require (path.join (routersPath, 'TestRouter'));

    it ('should add routes to the router', function () {
      routerBuilder.addSpecification (spec);
      var router = routerBuilder.getRouter ();

      expect (router.params).to.have.keys (['param1', 'param2', 'personId']);
      expect (router.params.param1).to.have.length (1);
      expect (router.params.param2).to.have.length (1);

      expect (router.params.param1[0]).to.be.a.function;
      expect (router.params.param2[0]).to.be.a.function;
      
      expect (router.stack[2].route.path).to.equal ('/helloworld');
      expect (router.stack[4].route.path).to.equal ('/helloworld/inner');
    });
  });

  describe ('resources', function () {
    var app;
    var server;
    var Person;
    var id;

    before (function (done) {
      var appPath = path.resolve (__dirname, '../fixtures/app');

      // Destroy the current application, and create a new one.
      blueprint.destroy ();
      app = blueprint.Application (appPath);
      server = app.server;
      Person = app.models.Person;

      // connect to the database, delete all resources.
      async.series ([
        function (callback) { app.database.connect (callback); },
        function (callback) { Person.remove ({}, callback); }
      ], done);
    });

    after (function (done) {
      app.database.disconnect (done);
    });

    it ('should create a new resource', function (done) {
      request (server.app)
        .post ('/persons')
        .send ({first_name: 'James', last_name: 'Hill'})
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body).to.have.keys (['_id']);

          id = res.body._id;

          return done ();
        });
    });

    it ('should not create the resource [missing body]', function (done) {
      request (server.app)
        .post ('/persons')
        .expect (400, done);
    });

    it ('should not create the resource [invalid parameters]', function (done) {
      request (server.app)
        .post ('/persons')
        .send ({first: 'James', last: 'Hill'})
        .expect (400, done);
    });

    it ('should retrieve a single resource', function (done) {
      request (server.app)
        .get ('/persons/' + id)
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body).to.have.keys (['_id', 'first_name', 'last_name']);
          expect (res.body).to.have.property ('_id', id);
          expect (res.body).to.have.property ('first_name', 'James');
          expect (res.body).to.have.property ('last_name', 'Hill');

          return done ();
        });
    });

    it ('should retrieve a list of all resources', function (done) {
      request (server.app)
        .get ('/persons')
        .expect (200)
        .end (function (err, res) {
          if (err) return done (err);

          expect (res.body).to.have.length (1);
          expect (res.body[0]._id).to.equal (id);

          return done ();
        });
    });

    it ('should update a single resource', function (done) {
      async.series ([
        function (callback) {
          request (server.app)
            .put ('/persons/' + id)
            .send ({first_name: 'Lanita', last_name: 'Hill'})
            .expect (200, 'true', callback);
        },

        function (callback) {
          request (server.app)
            .get ('/persons/' + id)
            .expect (200)
            .end (function (err, res) {
              if (err) return callback (err);

              expect (res.body).to.have.keys (['_id', 'first_name', 'last_name']);
              expect (res.body).to.have.property ('first_name', 'Lanita');
              expect (res.body).to.have.property ('last_name', 'Hill');

              return callback ();
            });
        }

      ], done);
    });

    it ('should delete an existing resource', function (done) {
      request (server.app)
        .delete ('/persons/' + id)
        .expect (200, 'true', done);
    });

    it ('should not delete an existing resource', function (done) {
      request (server.app)
        .delete ('/persons/' + id)
        .expect (404, done);
    });
  });
});