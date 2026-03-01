pub fn parse_buffer_response(response: &str) -> Result<Vec<f64>, String> {
    if response.trim().is_empty() {
        return Ok(vec![]);
    }
    response
        .split(',')
        .map(|s| {
            s.trim()
                .parse::<f64>()
                .map_err(|e| format!("Failed to parse '{}': {}", s.trim(), e))
        })
        .collect()
}

pub fn parse_dual_buffer_response(response: &str) -> Result<(Vec<f64>, Vec<f64>), String> {
    let parts: Vec<&str> = response.split("---SEPARATOR---").collect();
    if parts.len() != 2 {
        return Err("Expected two buffer sections separated by ---SEPARATOR---".to_string());
    }
    let currents = parse_buffer_response(parts[0])?;
    let voltages = parse_buffer_response(parts[1])?;
    Ok((currents, voltages))
}
