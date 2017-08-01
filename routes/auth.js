// Add Passport-related auth routes here.
var express = require('express');
var router = express.Router();
var models = require('../models');

module.exports = function(passport) {

  router.get('/', function(req, res) {
    res.render('login');
  });

  return router;
};
