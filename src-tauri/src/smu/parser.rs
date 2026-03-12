pub fn parse_buffer_response(response: &str) -> Result<Vec<f64>, String> {
    if response.trim().is_empty() {
        return Ok(vec![]);
    }
    let mut values = Vec::new();
    for s in response.split(',') {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            continue;
        }
        match trimmed.parse::<f64>() {
            Ok(v) => values.push(v),
            Err(_) => {
                // Skip non-numeric tokens (e.g. intermediate print messages)
                // but only if they contain non-numeric chars beyond scientific notation
                if trimmed.contains(|c: char| c.is_alphabetic() && c != 'e' && c != 'E')
                    || trimmed.contains(">>>")
                    || trimmed.contains("<<<")
                {
                    continue;
                }
                return Err(format!("Failed to parse '{}' as number", trimmed));
            }
        }
    }
    Ok(values)
}

pub fn parse_dual_buffer_response(response: &str) -> Result<(Vec<f64>, Vec<f64>), String> {
    // Find the LAST occurrence of ---SEPARATOR--- to skip any intermediate print output
    let sep = "---SEPARATOR---";
    let sep_pos = response.rfind(sep);
    if sep_pos.is_none() {
        return Err("Expected two buffer sections separated by ---SEPARATOR---".to_string());
    }
    let sep_pos = sep_pos.unwrap();

    // Find the start of current data: look for the last printbuffer output block
    // before the separator. We scan backwards from separator to find numeric data.
    let before_sep = &response[..sep_pos];
    let after_sep = &response[sep_pos + sep.len()..];

    // Extract only the numeric CSV portion from before_sep
    // (skip any intermediate print messages like ">>> Press trigger <<<")
    let currents = parse_buffer_data_from_end(before_sep)?;
    let voltages = parse_buffer_response(after_sep)?;
    Ok((currents, voltages))
}

/// Extract numeric CSV data, filtering out non-numeric lines
fn parse_buffer_data_from_end(text: &str) -> Result<Vec<f64>, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Ok(vec![]);
    }

    // Split by newlines first, keep only lines that look like numeric CSV data
    let mut numeric_parts = Vec::new();
    for line in trimmed.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Check if this line looks like CSV numeric data (starts with a digit, minus, or plus)
        let first_char = line.chars().next().unwrap_or(' ');
        if first_char.is_ascii_digit() || first_char == '-' || first_char == '+' {
            numeric_parts.push(line);
        }
    }

    let joined = numeric_parts.join(", ");
    parse_buffer_response(&joined)
}
