const ArrayUploadAction = require ('../../../lib/array-upload-action');
const executeAction = require ('../../../lib/middleware/execute-action');

const {expect} = require ('chai');
const request  = require ('supertest');
const express  = require ('express');
const path     = require ('path');

describe ('lib | ArrayUploadAction', function () {
  describe ('constructor', function () {
    it ('should create an ArrayUploadAction object', function () {
      let action = new ArrayUploadAction ({
        uploadPath: './temp',
        name: 'avatar'
      });

      expect (action).to.have.property ('name', 'avatar');
    });
  });

  describe ('execute', function () {
    it ('should upload an array of files', function (done) {
      let action = new ArrayUploadAction ({
        uploadPath: './temp',
        name: 'avatar',
        uploadCompleteCalled: false,

        onUploadComplete (req, res) {
          // check for the normal fields.
          expect (req).to.have.property ('body').to.include ({
            name: 'James Hill'
          });

          // check the upload file.
          expect (req).to.have.property ('files').to.have.length (2);
          expect (req).to.have.nested.property ('files[0]').to.include ({ fieldname: 'avatar', mimetype: 'image/png', originalname: 'avatar.png' });
          expect (req).to.have.nested.property ('files[1]').to.include ({ fieldname: 'avatar', mimetype: 'image/png', originalname: 'avatar.png' });

          res.status (200).json ({comment: 'The upload is complete!'});
          this.uploadCompleteCalled = true;
        }
      });

      let app = express ();
      app.post ('/profile', executeAction (action));

      const avatarPng = path.resolve (__dirname, '../../files/avatar.png');

      request (app)
        .post ('/profile')
        .field ('name', 'James Hill')
        .attach ('avatar', avatarPng)
        .attach ('avatar', avatarPng)
        .expect (200, {comment: 'The upload is complete!'})
        .end (err => {
          if (err) return done (err);

          expect (action).to.have.property ('uploadCompleteCalled').to.be.true;
          done ();
        });
    });
  });
});
