const express = require('express');
const { sequelize } = require('./model');

const { getProfile } = require('./middleware/getProfile');

const contractsRouter = require('./routes/contract');
const jobsRouter = require('./routes/job');
const adminRouter = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.use('/contracts', getProfile, contractsRouter);
app.use('/jobs', getProfile, jobsRouter);
app.use('/admin', adminRouter);

module.exports = app;
