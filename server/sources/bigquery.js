import { BigQuery } from "@google-cloud/bigquery";

function createClient(source) {
  return new BigQuery({
    projectId: source.projectId,
    credentials: {
      client_email: source.username,
      private_key: decryptString(source.password).replace(/\\n/g, "\n"),
    },
  });
}

SOURCE_TYPES.bigquery.query = async function (
  source,
  sql,
  parameters,
  endCallback,
  startCallback
) {
  function sendResults(status, data, fields) {
    endCallback({ status: status, data: data, fields: fields });
  }

  try {
    const client = createClient(source);
    const [job] = await client.createQueryJob({
      query: replaceQueryParameters(sql, (_match, key) => "@" + key),
      params: parameters,
    });
    startCallback(job.id);

    const [rows] = await job.getQueryResults();
    sendResults("ok", rows, _.keys(rows[0]));
  } catch (err) {
    sendResults("error", err.toString());
  }
};

SOURCE_TYPES.bigquery.cancel = async function (source, pid) {
  const client = createClient(source);
  await client.job(pid).cancel();
};