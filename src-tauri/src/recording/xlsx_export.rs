use rust_xlsxwriter::{Workbook, Format};

pub fn export_xlsx(
    path: &str,
    voltages: &[f64],
    currents: &[f64],
) -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let header_fmt = Format::new().set_bold();
    worksheet.write_with_format(0, 0, "Index", &header_fmt).map_err(|e| e.to_string())?;
    worksheet.write_with_format(0, 1, "Voltage (V)", &header_fmt).map_err(|e| e.to_string())?;
    worksheet.write_with_format(0, 2, "Current (A)", &header_fmt).map_err(|e| e.to_string())?;
    worksheet.write_with_format(0, 3, "Resistance (Ohm)", &header_fmt).map_err(|e| e.to_string())?;

    let sci_fmt = Format::new().set_num_format("0.00E+00");

    for (i, (v, c)) in voltages.iter().zip(currents.iter()).enumerate() {
        let row = (i + 1) as u32;
        worksheet.write(row, 0, (i + 1) as f64).map_err(|e| e.to_string())?;
        worksheet.write_with_format(row, 1, *v, &sci_fmt).map_err(|e| e.to_string())?;
        worksheet.write_with_format(row, 2, *c, &sci_fmt).map_err(|e| e.to_string())?;
        let r = if *c != 0.0 { (v / c).abs() } else { 0.0 };
        worksheet.write_with_format(row, 3, r, &sci_fmt).map_err(|e| e.to_string())?;
    }

    workbook.save(path).map_err(|e| e.to_string())?;
    Ok(())
}
