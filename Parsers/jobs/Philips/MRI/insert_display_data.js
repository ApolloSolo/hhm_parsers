("use strict");
require("dotenv").config({ path: "../../.env" });
const { log } = require("../../../logger");
const initialUpdate = require("../../../persist/phil_mri_monitor_data/initialUpdate");
const updatePhilMriTable = require("../../../persist/phil_mri_monitor_data/updateTable/updatePhilMriTable");
const { getSystemDbData } = require("../../../utils/phil_mri_monitor_helpers");

async function insertDisplayData(jobId, filePath, sysConfigData, data) {
  const sme = sysConfigData[0].id;
  const modality = sysConfigData[0].modality;
  try {
    await log("info", jobId, sme, "insertDisplayData", "FN CALL", {
      sme: sme,
      modality,
      file: filePath,
    });

    const systemDbData = await getSystemDbData(sme);

    console.time();
    if (systemDbData.rowCount === 0) {
      // Create entry for new SME
      for (const prop in data) {
        const fileName = prop;
        await initialUpdate(jobId, sme, fileName, data[prop]);
      }
    } else {
      // find most recent date in database and start process on that data for data[prop]

      for (const prop in data) {
        const fileName = prop;
        await updatePhilMriTable(jobId, sme, fileName, data[prop]);
      }
    }
    console.timeEnd();
  } catch (error) {
    console.log(error);
    await log("error", jobId, sme, "insertDisplayData", "FN CALL", {
      sme: sme,
      modality,
      file: filePath,
    });
  }
}

module.exports = insertDisplayData;

/* FILES
monitor_cryocompressor_cerr
monitor_cryocompressor_palm
monitor_cryocompressor_talm
monitor_cryocompressor_time_status
monitor_magnet_helium_level_value
monitor_magnet_lt_boiloff
monitor_magnet_pressure_dps
monitor_magnet_quench
monitor_System_HumTechRoom
monitor_System_TempTechRoom
monitor_magnet_pressure_avg
*/
