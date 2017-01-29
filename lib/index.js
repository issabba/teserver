'use strict';

const aws         = require('aws-sdk')
const crypto      = require('crypto');
const extracteur  = require('./textExtractor.js');
const mime        = require('mime-types');
const multer      = require('multer');
const multerS3    = require('multer-s3');

const MAX_SIZE    =  process.env.MAX_FILE_SIZE * 1024 * 1024; //20 Mb

//S3 storage
const s3 = new aws.S3({ signatureVersion: 'v4' });

const options = {
  s3: s3,
  bucket: process.env.S3_BUCKET,
  acl: 'public-read',
  metadata: (req, file, cb) => {
    cb(null, Object.assign({}, req.body));
  },
  key: (req, file, cb) => {
     crypto.pseudoRandomBytes(16, function (err, raw) {
        cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
    });
  }
}

/*
//Disk storage
const storage     = multer.diskStorage({
  destination: (req, file, cb)=> cb(null, './uploads/'),
  filename:    (req, file, cb)=> {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
    });
  }
});
*/


const storage = multerS3(options);

const upload = multer({
        storage: storage,
        limits: { fileSize: MAX_SIZE }
}).single('file')


const ExtractTextFromFile = function (req, res, next){
  upload(req, res, function(err){
    const file = req.file;
    /*For further dev/security, we can use some params*/
    const otherFields =  req.body;

    if(err){
      res.json({'status':'error','error': err})
      return;
    }

    extracteur(file)
    .then((out)=> res.json({'status':'success', 'file':file, 'text':out}))
    .catch((e)=> res.json({'status':'error','error': e, 'file':file}))
  })
}

module.exports = ExtractTextFromFile;