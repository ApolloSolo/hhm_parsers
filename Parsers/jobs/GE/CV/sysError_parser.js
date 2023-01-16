("use strict");
require("dotenv").config({ path: "../../.env" });
const { log } = require("../../../logger");
const fs = require("node:fs");
const readline = require("readline");
const { ge_re } = require("../../../parse/parsers");
const groupsToArrayObj = require("../../../parse/prep-groups-for-array");
const mapDataToSchema = require("../../../persist/map-data-to-schema");
const { ge_cv_syserror_schema } = require("../../../persist/pg-schemas");
const bulkInsert = require("../../../persist/queryBuilder");
const { blankLineTest } = require("../../../utils/regExHelpers");
const { convertDates } = require("../../../utils/dates");
const {
  getCurrentFileSize,
  getRedisFileSize,
  updateRedisFileSize,
  passForProcessing,
} = require("../../../redis/redisHelpers");
const execTail = require("../../../read/exec-tail");

async function ge_cv_sys_error(jobId, sysConfigData, fileToParse) {
  const dateTimeVersion = fileToParse.datetimeVersion;
  const sme = sysConfigData.id;

  const updateSizePath = "./read/sh/readFileSize.sh";
  const fileSizePath = "./read/sh/readFileSize.sh";
  const tailPath = "./read/sh/tail.sh";

  const data = [];
  const redisData = [];

  try {
    await log("info", jobId, sme, "ge_ct_gesys", "FN CALL");

    let complete_file_path = `${sysConfigData.hhm_config.file_path}/${fileToParse.file_name}`;

    const prevFileSize = await getRedisFileSize(sme, fileToParse.file_name);
    console.log("Redis File Size: " + prevFileSize);

    let rl;
    if (prevFileSize === null) {
      console.log("This needs to be read from file");
      rl = readline.createInterface({
        input: fs.createReadStream(complete_file_path),
        crlfDelay: Infinity,
      });
    }

    if (prevFileSize > 0 && prevFileSize !== null) {
      console.log("File Size prev saved in Redis");

      const currentFileSize = await getCurrentFileSize(
        sme,
        fileSizePath,
        sysConfigData.hhm_config.file_path,
        fileToParse.file_name
      );
      console.log("CURRENT FILE SIZE: " + currentFileSize);

      const delta = currentFileSize - prevFileSize;
      await log("info", jobId, sme, "delta", "FN CALL", { delta: delta });
      console.log("DELTA: " + delta);

      if (delta === 0) {
        await log("warn", jobId, sme, "delta-0", "FN CALL");
        return;
      }

      let tailDelta = await execTail(tailPath, delta, complete_file_path);

      rl = tailDelta.toString().split(/(?:\r\n|\r|\n)/g);
    }

    for await (const line of rl) {
      let matches = line.match(ge_re.cv.sys_error);
      if (matches === null) {
        const isNewLine = blankLineTest(line);
        if (isNewLine) {
          continue;
        } else {
          await log("error", jobId, sme, "Not_New_Line", "FN CALL", {
            message: "This is not a blank new line - Bad Match",
            line: line,
          });
        }
      } else {
        //convertDates(matches.groups, dateTimeVersion);
        const matchData = groupsToArrayObj(sme, matches.groups);
        data.push(matchData);

        // Format data to pass off to redis queue for data processing
        redisData.push({
          system_id: sme,
          host_date: matchData.host_date,
          host_time: matchData.host_time,
          pg_table: fileToParse.pg_table,
        });
      }
    }

    // Remove headers - head of array
    redisData.shift();
    data.shift();

    const mappedData = mapDataToSchema(data, ge_cv_syserror_schema);
    const dataToArray = mappedData.map(({ ...rest }) => Object.values(rest));

    const insertSuccess = await bulkInsert(
      jobId,
      dataToArray,
      sysConfigData,
      fileToParse
    );
    if (insertSuccess) {
      // Data insert to db successfull, update new file size on redis
      await updateRedisFileSize(
        sme,
        updateSizePath,
        sysConfigData.hhm_config.file_path,
        fileToParse.file_name
      );

      // send data for processing to redis dp:queue
      await passForProcessing(sme, redisData);
    }
  } catch (error) {
    await log("error", jobId, sme, "ge_cv_sys_error", "FN CALL", {
      error: error,
    });
  }
}

module.exports = ge_cv_sys_error;

// "{\"host_date\":\"12-Jan-23\",\"host_time\":\"01:08\",\"capture_datetime\":\"2023-01-12T08:15:00Z\",\"system_id\":\"SME09782\",\"pg_table\":\"mmb_ge_mm3\"}"
