("use strict");
require("dotenv").config({ path: "../../.env" });
const { log } = require("../../logger");
const fs = require("node:fs").promises;
const { win_7_re } = require("../../parse/parsers");
const groupsToArrayObj = require("../../parse/prep-groups-for-array");
const mapDataToSchema = require("../../persist/map-data-to-schema");
const { siemens_cv_schema } = require("../../persist/pg-schemas");
const bulkInsert = require("../../persist/queryBuilder");
const { convertDates } = require("../../utils/dates");
const {
  getCurrentFileSize,
  getRedisFileSize,
  updateRedisFileSize,
  passForProcessing
} = require("../../redis/redisHelpers");
const execHead = require("../../read/exec-head");

const parse_win_7 = async (jobId, sysConfigData, fileToParse) => {
  const dateTimeVersion = fileToParse.datetimeVersion;
  const sme = sysConfigData.id;
  const dirPath = sysConfigData.hhm_config.file_path;

  const updateSizePath = "./read/sh/readFileSize.sh";
  const fileSizePath = "./read/sh/readFileSize.sh";
  const headPath = "./read/sh/head.sh";

  const data = [];
  const redisData = [];

  try {
    await log("info", jobId, sme, "parse_win_7", "FN CALL");

    const complete_file_path = `${dirPath}/${fileToParse.file_name}`;

    const prevFileSize = await getRedisFileSize(sme, fileToParse.file_name);
    console.log("Redis File Size: " + prevFileSize);

    let fileData;
    if (prevFileSize === null) {
      console.log("This needs to be read from file");
      fileData = (await fs.readFile(complete_file_path)).toString();
    }

    if (prevFileSize > 0) {
      console.log("File-size previously saved in Redis");

      const currentFileSize = await getCurrentFileSize(
        sme,
        fileSizePath,
        sysConfigData.hhm_config.file_path,
        fileToParse.file_name
      );
      console.log("CURRENT FILE SIZE IS: " + currentFileSize);

      const delta = currentFileSize - prevFileSize;
      await log("info", jobId, sme, "delta", "FN CALL", { delta: delta });
      console.log("DELTA: " + delta);

      if (delta === 0) {
        await log("warn", jobId, sme, "delta-0", "FN CALL");
        return;
      }

      let tailDelta = await execHead(headPath, delta, complete_file_path);

      fileData = tailDelta.toString();
    }

    let matches = fileData.match(win_7_re.big_group);

    for await (let match of matches) {
      //console.log(match + "\n")
      if (match === null) {
        throw new Error("Bad match");
      }
      let matchGroups = match.match(win_7_re.small_group);

      //convertDates(matchGroups.groups, dateTimeVersion);
      const matchData = groupsToArrayObj(sme, matchGroups.groups);
      data.push(matchData);

      // Build redis data passoff
      // Format data to pass off to redis queue for data processing
      let month = matchData.month.slice(0, 3);
      redisData.push({
        system_id: sme,
        host_date: `${matchData.day}-${month}-${matchData.year}`,
        host_time: matchData.host_time,
        pg_table: fileToParse.pg_table,
      });
    }

    const mappedData = mapDataToSchema(data, siemens_cv_schema);
    const dataToArray = mappedData.map(({ ...rest }) => Object.values(rest));

    const insertSuccess = await bulkInsert(
      jobId,
      dataToArray,
      sysConfigData,
      fileToParse
    );
    if (insertSuccess) {
      await updateRedisFileSize(
        sme,
        updateSizePath,
        sysConfigData.hhm_config.file_path,
        fileToParse.file_name
      );
      // Send data for processing to redis dp:queue
      await passForProcessing(sme, redisData);
    }

    return true;
  } catch (error) {
    console.log(error);
    await log("error", jobId, sme, "parse_win_7", "FN CATCH", {
      error: error,
    });
  }
};

module.exports = parse_win_7;
