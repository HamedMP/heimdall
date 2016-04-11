import mssql from 'mssql';


SOURCE_TYPES.mssql.query = function(source, sql, endCallback, startCallback) {
  function results(status, data, extras) {
    extras = extras || {};

    var result = {
      status: status,
      data: data
    };

    endCallback(_.extend(result, extras));
  }

  if (source && sql) {
    const connectionConfig = {
      user     : source.username,
      password : decryptString(source.password),
      server   : source.host,
      port     : source.port,
      database : source.database,
      options: {
        tdsVersion: '7_1'
      }
    };

    var connection = new mssql.Connection(connectionConfig, Meteor.bindEnvironment((err) => {
      if (err) return results('error', `${err} - could not connect with data source.`);

      connection.request().query(sql, Meteor.bindEnvironment((err, data) => {
        if (err) {
          results('error', err.toString());
        }
        else {
          var fields = (data && data.length) ? _.keys(data[0]) : [];
          results('ok', data, { fields: fields });
        }
      }));
    }));
  }
  else throw new Meteor.Error("Can't query job, something is missing.");
}