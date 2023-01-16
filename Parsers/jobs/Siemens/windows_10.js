("use strict");
require("dotenv").config({ path: "../../.env" });
const { log } = require("../../logger");
const fs = require("fs");
const readline = require("readline");
const { win_10_re } = require("../../parse/parsers");
const groupsToArrayObj = require("../../parse/prep-groups-for-array");
const mapDataToSchema = require("../../persist/map-data-to-schema");
const { siemens_ct_mri } = require("../../persist/pg-schemas");
const bulkInsert = require("../../persist/queryBuilder");
const { blankLineTest } = require("../../utils/regExHelpers");
const { convertDates } = require("../../utils/dates");
const {
  getCurrentFileSize,
  getRedisFileSize,
  updateRedisFileSize,
  passForProcessing,
} = require("../../redis/redisHelpers");
const execHead = require("../../read/exec-head");

const parse_win_10 = async (jobId, sysConfigData, fileToParse) => {
  const dateTimeVersion = sysConfigData.hhm_config.dateTimeVersion;
  const sme = sysConfigData.id;
  const dirPath = sysConfigData.hhm_config.file_path;

  const updateSizePath = "./read/sh/readFileSize.sh";
  const fileSizePath = "./read/sh/readFileSize.sh";
  const headPath = "./read/sh/head.sh";

  const data = [];
  const redisData = [];

  let line_num = 1;
  try {
    await log("info", jobId, sme, "parse_win_10", "FN CALL");

    const complete_file_path = `${dirPath}/${fileToParse.file_name}`;

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

      let tailDelta = await execHead(headPath, delta, complete_file_path);

      rl = tailDelta.toString().split(/(?:\r\n|\r|\n)/g);
    }

    for await (const line of rl) {
      let matches = line.match(win_10_re.re_v1);
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
      }
      //convertDates(matches.groups, dateTimeVersion);
      const matchData = groupsToArrayObj(sme, matches.groups);
      data.push(matchData);
      line_num++;

      // Build redis data passoff
      // Format data to pass off to redis queue for data processing
      redisData.push({
        system_id: sme,
        host_date: matchData.host_date,
        host_time: matchData.host_time,
        pg_table: fileToParse.pg_table,
      });
    }

    const mappedData = mapDataToSchema(data, siemens_ct_mri);
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
    await log("error", jobId, sme, "parse_win_10", "FN CATCH", {
      line: line_num,
      error: error,
      file: fileToParse,
    });
  }
};

module.exports = parse_win_10;
// /(?<host_state>\w+)\t(?<host_date>\d{4}-\d{1,2}-\d{1,2})\t(?<host_time>\d{2}:\d{2}:\d{2})\t(?<host_col_1>(.*?)(\.\d\.\d)?)\t?\s?(?<host_col_2>(\d{1,5}))\t(?<host_info>.*)/;
