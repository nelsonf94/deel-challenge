const express = require('express');

const { sequelize } = require('./model');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

module.exports = app;
