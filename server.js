import express from 'express';
import createError from 'http-errors';

import LeetCodeBot from './bot.js';
import indexRouter from './routes/index.js';

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: false }));

server.use('/', indexRouter);

// catch 404 and forward to error handler
server.use(function (req, res, next) {
  next(createError(404));
});

// error handler
server.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.server.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

LeetCodeBot.run();

export default server;