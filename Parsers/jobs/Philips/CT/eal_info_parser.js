("use strict");
require("dotenv").config({ path: "../../.env" });
const fs = require("node:fs");
const readline = require("readline");
const { log } = require("../../../logger");
const bulkInsert = require("../../../utils/queryBuilder");
const convertDates = require("../../../utils/dates");
const groupsToArrayObj = require("../../../utils/prep-groups-for-array");
const mapDataToSchema = require("../../../utils/map-data-to-schema");
const { philips_re } = require("../../../utils/parsers");
const { philips_ct_eal_schema } = require("../../../utils/pg-schemas");

async function phil_ct_eal_info(jobId, filePath, sysConfigData) {
  try {
    const version = "eal_info";
    const dateTimeVersion = "type_1";
    const sme = sysConfigData[0].id;
    const manufacturer = sysConfigData[0].manufacturer;
    const modality = sysConfigData[0].modality;

    const data = [];

    await log("info", jobId, sme, "ge_ct_gesys", "FN CALL", {
      sme: sme,
      modality: sysConfigData[0].modality,
      file: filePath,
    });

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      let matches = line.match(philips_re.ct_eal);

      convertDates(matches.groups, dateTimeVersion);
      const matchData = groupsToArrayObj(sme, matches.groups);
      data.push(matchData);
    }

    // Remove headers
    data.shift();

    // homogenize data to prep for insert to db (may remove this step )
    const mappedData = mapDataToSchema(data, philips_ct_eal_schema);
    const dataToArray = mappedData.map(({ ...rest }) => Object.values(rest));

    await bulkInsert(
      dataToArray,
      manufacturer,
      modality,
      version,
      sme,
      filePath,
      jobId
    );
  } catch (error) {
    await log("error", jobId, sme, "phil_ct_eal_info", "FN CALL", {
      sme: sme,
      modality,
      file: filePath,
      error: error.message,
    });
  }
}

module.exports = phil_ct_eal_info;
