module.exports = queries = {
  GE: {
    MRI: {
      gesys: `
        INSERT INTO log.ge_mri_gesys (
          equipment_id,
          epoch,
          record_number_concurrent,
          misc_param_1,
          month,
          day,
          host_time,
          year,
          message_number,
          misc_param_2,
          type,
          data_1,
          num_1,
          server,
          task_id,
          task_epoc,
          object,
          exception_class,
          severity,
          function,
          psd,
          coil,
          scan,
          message,
          sr,
          en,
          date_time
        )
        SELECT * FROM UNNEST (
          $1::text[], $2::numeric[], $3::numeric[], $4::numeric[], $5::text[], $6::numeric[], $7::time[], $8::numeric[], $9::numeric[], $10::numeric[], $11::text[], $12::text[], $13::numeric[], $14::text[], $15::text[], $16::numeric[], $17::text[], $18::text[], $19::text[], $20::text[], $21::text[], $22::text[], $23::text[], $24::text[], $25::numeric[], $26::numeric[], $27::timestamp[]
        )
        `,
    },
    CT: {
      gesys: `
      INSERT INTO log.ge_ct_gesys (
        equipment_id,
        epoch,
        record_number_concurrent,
        misc_param_1,
        month,
        day,
        host_time,
        year,
        message_number,
        misc_param_2,
        type,
        data_1,
        num_1,
        date_2,
        host,
        ermes_number,
        exception_class,
        severity,
        file,
        line_number,
        scan_type,
        warning,
        end_msg,
        message,
        sr,
        en,
        date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::numeric[], $3::numeric[], $4::numeric[], $5::text[], $6::numeric[], $7::time[], $8::numeric[], $9::numeric[], $10::numeric[], $11::text[], $12::text[], $13::numeric[], $14::text[], $15::text[], $16::numeric[], $17::text[], $18::text[], $19::text[], $20::numeric[], $21::text[], $22::text[], $23::text[], $24::text[], $25::numeric[], $26::numeric[], $27::timestamp[]
      )
      `,
    },
    CV: {
      sysError: `
      INSERT INTO log.ge_cv_syserror (
        equipment_id,
        sequencenumber,
        host_date,
        host_time,
        subsystem,
        errorcode,
        errortext,
        exam,
        exceptioncategory,
        application,
        majorfunction,
        minorfunction,
        fru,
        viewinglevel,
        rootcause,
        repeatcount,
        debugtext,
        sourcefile,
        sourceline,
        date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::numeric[], $3::date[], $4::text[], $5::text[], $6::numeric[], $7::text[], $8::numeric[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::numeric[], $15::numeric[], $16::numeric[], $17::text[], $18::text[], $19::numeric[], $20::timestamp[]
      )
      `,
    },
  },
  Siemens: {
    CT: {
      EvtApplication_Today: `
      INSERT INTO log.siemens_ct (
          equipment_id,
          host_state,
          host_date,
          host_time,
          source_group,
          type_group,
          text_group,
          domain_group,
          id_group,
          month,
          day,
          year,
          date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::text[], $3::date[], $4::time[], $5::text[], $6::numeric[], $7::text[], $8::text[], $9::numeric[], $10::text[], $11::numeric[], $12::numeric[], $13::timestamp[]
      )
      `,
    },
    CV: {
      EvtApplication_Today: `
      INSERT INTO log.siemens_cv (
          equipment_id,
          host_time,
          source_group,
          type_group,
          text_group,
          domain_group,
          id_group,
          month,
          day,
          year,
          date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::time[], $3::text[], $4::numeric[], $5::text[], $6::text[], $7::numeric[], $8::text[], $9::numeric[], $10::numeric[], $11::timestamp[]
      )
      `,
    },
    MRI: {
      EvtApplication_Today: `
      INSERT INTO log.siemens_mri (
          equipment_id,
          host_state,
          host_date,
          host_time,
          source_group,
          type_group,
          text_group,
          domain_group,
          id_group,
          month,
          day,
          year,
          date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::text[], $3::date[], $4::time[], $5::text[], $6::numeric[], $7::text[], $8::text[], $9::numeric[], $10::text[], $11::numeric[], $12::numeric[], $13::timestamp[]
      )
      `,
    },
  },
  Philips: {
    CT: {
      eal_info: `
      INSERT INTO log.philips_ct_eal (
        equipment_id,
        line,
        err_type,
        tmstamp,
        file,
        datatype,
        param1,
        errnum,
        info,
        dtime,
        ealtime,
        lognumber,
        param2,
        vxwerrno,
        controller,
        date_time
      )
      SELECT * FROM UNNEST (
        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::numeric[], $15::text[], $16::timestamp[]
      )
      `,
      events: `
      INSERT INTO log.philips_ct_events (
      equipment_id,
      eventtime,
      blob,
      type,
      tstampnum,
      eal,
      level,
      ermodulernum,
      dtime,
      msg,
      date_time
    )
    SELECT * FROM UNNEST (
      $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::timestamp[]
    )
      `,
    },
    MRI: {
      logcurrent: `
      INSERT INTO log.philips_mri_logcurrent (
        equipment_id,
        host_date,
        host_time,
        row_type,
        event_type,
        subsystem,
        code_1,
        code_2,
        group_1,
        message,
        packets_created,
        data_created_value,
        size_copy_value,
        data_8,
        reconstructor,
        date_time
    )
    SELECT * FROM UNNEST (
      $1::text[], $2::date[], $3::time[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::text[], $14::text[], $15::text[], $16::timestamp[]
    )
      `,
      rmmu_short: `
    INSERT INTO log.philips_mri_rmmu_short(
      equipment_id,
      system_reference_number,
      hospital_name,
      serial_number_magnet,
      serial_number_meu,
      lineno,
      year,
      mo,
      dy,
      hr,
      mn,
      ss,
      hs,
      AvgPwr_value,
      MinPwr_value,
      MaxPwr_value,
      AvgAbs_value,
      AvgPrMbars_value,
      MinPrMbars_value,
      MaxPrMbars_value,
      LHePct_value,
      LHe2_value,
      DiffPressureSwitch_state,
      TempAlarm_state,
      PressureAlarm_state,
      Cerr_state,
      CompressorReset_state,
      Chd_value,
      Cpr_value,
      date_time
  )
  SELECT * FROM UNNEST (
    $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::numeric[], $7::numeric[], $8::numeric[], $9::numeric[], $10::numeric[], $11::numeric[], $12::numeric[], $13::numeric[], $14::numeric[], $15::numeric[], $16::numeric[], $17::numeric[], $18::numeric[], $19::numeric[], $20::numeric[], $21::numeric[], $22::numeric[], $23::text[], $24::text[], $25::text[], $26::text[], $27::text[], $28::numeric[], $29::numeric[], $30::timestamp[]
  )
    `,
      rmmu_long: `
    INSERT INTO log.philips_mri_rmmu_long(
      equipment_id,
      system_reference_number,
      hospital_name,
      serial_number_magnet,
      serial_number_meu,
      lineno,
      year,
      mo,
      dy,
      hr,
      mn,
      ss,
      hs,
      dow_value,
      AvgPwr_value,
      MinPwr_value,
      MaxPwr_value,
      AvgAbs_value,
      AvgPrMbars_value,
      MinPrMbars_value,
      MaxPrMbars_value,
      LHePct_value,
      LHe2_value,
      DiffPressureSwitch_state,
      TempAlarm_state,
      PressureAlarm_state,
      Cerr_state,
      CompressorReset_state,
      Chd_value,
      Cpr_value,
      date_time
  )
  SELECT * FROM UNNEST (
    $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::numeric[], $7::numeric[], $8::numeric[], $9::numeric[], $10::numeric[], $11::numeric[], $12::numeric[], $13::numeric[], $14::numeric[], $15::numeric[], $16::numeric[], $17::numeric[], $18::numeric[], $19::numeric[], $20::numeric[], $21::numeric[], $22::numeric[], $23::numeric[], $24::text[], $25::text[], $26::text[], $27::text[], $28::text[], $29::numeric[], $30::numeric[], $31::timestamp[]
  )
    `,
      rmmu_magnet: `
    INSERT INTO log.philips_mri_rmmu_magnet(
      equipment_id,
      system_reference_number,
      hospital_name,
      serial_number_magnet,
      serial_number_meu,
      lineno,
      year,
      mo,
      dy,
      hr,
      mn,
      ss,
      hs,
      event,
      data,
      descr,
      date_time
  )
  SELECT * FROM UNNEST (
    $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::numeric[], $7::numeric[], $8::numeric[], $9::numeric[], $10::numeric[], $11::numeric[], $12::numeric[], $13::numeric[], $14::text[], $15::text[], $16::text[], $17::timestamp[]
  )
    `,
    },
    CV: {
      EventLog: `
      INSERT INTO log.philips_cv_eventlog(
        equipment_id,
        category,
        host_date,
        host_time,
        error_type,
        num_1,
        technical_event_id,
        description,
        channel_id,
        module,
        source,
        line,
        memo,
        subsystem_number,
        thread_name,
        message,
        date_time
      )
    SELECT * FROM UNNEST (
      $1::text[], $2::text[], $3::date[], $4::time[], $5::text[], $6::numeric[], $7::numeric[], $8::text[], $9::text[], $10::text[], $11::text[], $12::numeric[], $13::text[], $14::numeric[], $15::text[], $16::text[], $17::timestamp[]
    )
      `,
    },
  },
};
