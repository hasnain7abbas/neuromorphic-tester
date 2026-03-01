use std::path::Path;

pub fn export_csv(
    path: &Path,
    voltages: &[f64],
    currents: &[f64],
    timestamps: &[String],
) -> Result<(), String> {
    let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
    wtr.write_record(["Index", "Voltage(V)", "Current(A)", "Resistance(Ohm)", "Timestamp"])
        .map_err(|e| e.to_string())?;

    for i in 0..currents.len() {
        let v = voltages.get(i).copied().unwrap_or(0.0);
        let c = currents[i];
        let r = if c != 0.0 { (v / c).abs() } else { 0.0 };
        let t = timestamps.get(i).cloned().unwrap_or_default();
        wtr.write_record(&[
            (i + 1).to_string(),
            format!("{:.6e}", v),
            format!("{:.6e}", c),
            format!("{:.6e}", r),
            t,
        ])
        .map_err(|e| e.to_string())?;
    }
    wtr.flush().map_err(|e| e.to_string())?;
    Ok(())
}
