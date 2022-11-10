("use strict");
require("dotenv").config({ path: "../../.env" });
const { log } = require("../../../logger");
const fs = require("node:fs").promises;
const { philips_re } = require("../../../parse/parsers");
const groupsToArrayObj = require("../../../parse/prep-groups-for-array");
const mapDataToSchema = require("../../../persist/map-data-to-schema");
const { phil_mri_rmmu_long_schema } = require("../../../persist/pg-schemas");
const bulkInsert = require("../../../persist/queryBuilder");
const convertDates = require("../../../utils/dates");

async function phil_mri_rmmu_long(jobId, filePath, sysConfigData) {
  const version = "rmmu_long";
  const dateTimeVersion = "type_4";
  const sme = sysConfigData[0].id;
  const manufacturer = sysConfigData[0].manufacturer;
  const modality = sysConfigData[0].modality;

  const data = [];

  try {
    await log("info", jobId, sme, "phil_mri_rmmu_long", "FN CALL", {
      sme: sme,
      modality,
      file: filePath,
    });

    const fileData = (await fs.readFile(filePath)).toString();

    let matches = fileData.matchAll(philips_re.mri.rmmu_long_re);
    let metaData = fileData.match(philips_re.mri.rmmu_meta_data);

    for await (let match of matches) {
      convertDates(match.groups, dateTimeVersion);
      match.groups.system_reference_number =
        metaData.groups.system_reference_number;
      match.groups.hospital_name = metaData.groups.hospital_name;
      match.groups.serial_number_magnet = metaData.groups.serial_number_magnet;
      match.groups.serial_number_meu = metaData.groups.serial_number_meu;
      const matchData = groupsToArrayObj(sme, match.groups);
      data.push(matchData);
    }

    const mappedData = mapDataToSchema(data, phil_mri_rmmu_long_schema);
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
    await log("error", jobId, sme, "phil_mri_rmmu_long", "FN CALL", {
      sme: sme,
      modality,
      file: filePath,
      error: error.message,
    });
  }
}

module.exports = phil_mri_rmmu_long;